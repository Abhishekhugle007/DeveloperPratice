const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { after, afterEach, before, beforeEach, test } = require("node:test");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const os = require("node:os");
const ioClient = require("socket.io-client");
const XLSX = require("xlsx");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");
const { createChatServer, startServer } = require("../server");

const JWT_SECRET = "test-only-secret-with-at-least-thirty-two-bytes";
let mongoServer;
let chatServer;
let baseUrl;
let attachmentsDir;
const sockets = new Set();

async function request(path, { token, ...options } = {}) {
    const headers = new Headers(options.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (typeof options.body === "string" && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    return fetch(`${baseUrl}${path}`, { ...options, headers });
}

async function register(email, name = "Test User", password = "correct-horse-battery") {
    const response = await request("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
    });
    return { response, body: await response.json() };
}

async function login(email, password = "correct-horse-battery") {
    const response = await request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    return { response, body: await response.json() };
}

async function connectSocket(token) {
    const socket = ioClient(baseUrl, {
        auth: { token },
        transports: ["websocket"],
        reconnection: false,
        timeout: 5000
    });
    sockets.add(socket);
    await new Promise((resolve, reject) => {
        socket.once("connect", resolve);
        socket.once("connect_error", reject);
    });
    return socket;
}

function emit(socket, event, payload) {
    return new Promise((resolve, reject) => {
        socket.timeout(5000).emit(event, payload, (error, response) => {
            if (error) return reject(error);
            resolve(response);
        });
    });
}

function makeWorkbook(rows) {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.aoa_to_sheet(rows),
        "Users"
    );
    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

before(async () => {
    mongoServer = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
    await mongoose.connect(mongoServer.getUri());
    attachmentsDir = fs.mkdtempSync(path.join(os.tmpdir(), "private-chat-attachments-"));
    chatServer = createChatServer({
        jwtSecret: JWT_SECRET,
        attachmentsDir,
        authRateLimitOptions: { max: 100 }
    });
    await new Promise(resolve => chatServer.server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${chatServer.server.address().port}`;
});

beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    await Promise.all([User.syncIndexes(), Message.syncIndexes()]);
});

afterEach(async () => {
    for (const socket of sockets) socket.disconnect();
    sockets.clear();
    await new Promise(resolve => setTimeout(resolve, 25));
});

after(async () => {
    if (chatServer) await new Promise(resolve => chatServer.io.close(resolve));
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
    if (attachmentsDir) await fs.promises.rm(attachmentsDir, { recursive: true, force: true });
});

test("registration hashes passwords, returns safe fields, and rejects duplicate emails", async () => {
    const created = await register("person@example.com", "Person");
    assert.equal(created.response.status, 201);
    assert.equal(created.body.ok, true);
    assert.equal(created.body.user.email, "person@example.com");
    assert.equal(Object.hasOwn(created.body.user, "password"), false);
    const stored = await User.findOne({ email: "person@example.com" }).select("+password").exec();
    assert.notEqual(stored.password, "correct-horse-battery");
    assert.equal(await require("bcrypt").compare("correct-horse-battery", stored.password), true);

    const duplicate = await register("PERSON@example.com", "Duplicate");
    assert.equal(duplicate.response.status, 409);
    assert.equal(duplicate.body.ok, false);
});

test("registration validates input and login checks the bcrypt password", async () => {
    const invalid = await request("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "", email: "not-an-email", password: "short" })
    });
    assert.equal(invalid.status, 400);

    await register("login@example.com", "Login User");
    const wrong = await login("login@example.com", "not-the-password");
    assert.equal(wrong.response.status, 401);
    const valid = await login("LOGIN@example.com");
    assert.equal(valid.response.status, 200);
    assert.ok(valid.body.token);
    assert.equal(Object.hasOwn(valid.body.user, "password"), false);
});

test("startup explains missing database configuration without starting the HTTP server", async () => {
    const originalMongoUri = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;
    try {
        await assert.rejects(startServer(), {
            message: "MONGODB_URI must be set."
        });
    } finally {
        if (originalMongoUri === undefined) delete process.env.MONGODB_URI;
        else process.env.MONGODB_URI = originalMongoUri;
    }
});

test("unknown API routes and wrong methods return useful JSON 404 responses", async () => {
    const unknown = await request("/api/admin/users/template");
    assert.equal(unknown.status, 404);
    assert.deepEqual(await unknown.json(), {
        ok: false,
        error: "API endpoint not found: GET /api/admin/users/template."
    });

    const wrongMethod = await request("/api/admin/users/export", { method: "POST" });
    assert.equal(wrongMethod.status, 404);
    assert.deepEqual(await wrongMethod.json(), {
        ok: false,
        error: "API endpoint not found: POST /api/admin/users/export."
    });
});

test("message composer assets are served separately without removed icons", async () => {
    const html = fs.readFileSync(
        path.join(__dirname, "..", "public", "index.html"),
        "utf8"
    );
    const script = fs.readFileSync(
        path.join(__dirname, "..", "public", "app.js"),
        "utf8"
    );
    const stylesheet = fs.readFileSync(
        path.join(__dirname, "..", "public", "styles.css"),
        "utf8"
    );
    assert.match(html, /href="\/styles\.css"/);
    assert.match(html, /src="\/socket\.io\/socket\.io\.js"/);
    assert.match(html, /src="\/app\.js"/);
    for (const id of [
        "messageInput",
        "attachmentInput",
        "sendButton"
    ]) {
        assert.match(html, new RegExp(`id="${id}"`));
    }
    assert.match(script, /elements\.composer\.addEventListener\("submit"/);
    assert.match(script, /socketRequest\("privateMessage"/);
    assert.match(script, /apiRequest\("\/api\/attachments"/);
    assert.match(script, /renderMessageActions/);
    assert.match(script, /window\.confirm/);
    assert.match(script, /messageUpdated/);
    assert.match(script, /messageDeleted/);
    assert.match(script, /\/api\/files/);
    assert.match(script, /drop", event =>/);
    assert.match(stylesheet, /\.composer/);
    assert.doesNotMatch(html, /id="(?:formatToggle|emojiToggle|chatActions|moreActions)"/);

    const [cssResponse, scriptResponse] = await Promise.all([
        request("/styles.css"),
        request("/app.js")
    ]);
    assert.equal(cssResponse.status, 200);
    assert.equal(scriptResponse.status, 200);
    assert.match(cssResponse.headers.get("content-type"), /text\/css/);
    assert.match(scriptResponse.headers.get("content-type"), /javascript/);
});

test("invalid JWTs cannot access private APIs or establish sockets", async () => {
    const response = await request("/api/users", { token: "not-a-jwt" });
    assert.equal(response.status, 401);
    const socket = ioClient(baseUrl, {
        auth: { token: "not-a-jwt" },
        transports: ["websocket"],
        reconnection: false
    });
    sockets.add(socket);
    await assert.rejects(new Promise((resolve, reject) => {
        socket.once("connect", resolve);
        socket.once("connect_error", reject);
    }));
});

test("expired JWTs cannot access private APIs or establish sockets", async () => {
    const account = await register("expired@example.com", "Expired");
    const expiredToken = jwt.sign(
        { sub: account.body.user.id, ver: 0 },
        JWT_SECRET,
        { expiresIn: "-1s", issuer: "private-chat", audience: "private-chat" }
    );
    const response = await request("/api/users", { token: expiredToken });
    assert.equal(response.status, 401);
    const socket = ioClient(baseUrl, {
        auth: { token: expiredToken },
        transports: ["websocket"],
        reconnection: false
    });
    sockets.add(socket);
    await assert.rejects(new Promise((resolve, reject) => {
        socket.once("connect", resolve);
        socket.once("connect_error", reject);
    }));
});

test("private messages use verified identity, restrict history, and mark delivery only on recipient acknowledgement", async () => {
    const alice = await register("alice@example.com", "Alice");
    const bob = await register("bob@example.com", "Bob");
    const carol = await register("carol@example.com", "Carol");
    const aliceSocket = await connectSocket(alice.body.token);
    const bobSocket = await connectSocket(bob.body.token);
    const bobSecondTab = await connectSocket(bob.body.token);
    const carolSocket = await connectSocket(carol.body.token);

    const received = new Promise(resolve => bobSocket.once("privateMessage", resolve));
    const notificationEvents = [];
    bobSocket.on("messageNotification", notification => notificationEvents.push(notification));
    bobSecondTab.on("messageNotification", notification => notificationEvents.push(notification));
    let unrelatedReceivedMessage = false;
    carolSocket.once("privateMessage", () => { unrelatedReceivedMessage = true; });
    const sent = await emit(aliceSocket, "privateMessage", {
        from: carol.body.user.id,
        to: [bob.body.user.id],
        message: "hello privately",
        clientMessageId: "message-1"
    });
    assert.equal(sent.ok, true);
    const incoming = await received;
    assert.equal(incoming.from, alice.body.user.id);
    assert.equal(incoming.status, "sent");
    assert.equal(await Message.countDocuments({ from: alice.body.user.id, to: bob.body.user.id }), 1);
    await new Promise(resolve => setTimeout(resolve, 50));
    assert.equal(notificationEvents.length, 1);
    assert.deepEqual(
        {
            from: notificationEvents[0].from,
            senderName: notificationEvents[0].senderName,
            preview: notificationEvents[0].preview,
            unreadCount: notificationEvents[0].unreadCount
        },
        {
            from: alice.body.user.id,
            senderName: "Alice",
            preview: "hello privately",
            unreadCount: 1
        }
    );
    assert.equal(unrelatedReceivedMessage, false);
    const bobUsersResponse = await request("/api/users", { token: bob.body.token });
    const bobUsers = (await bobUsersResponse.json()).users;
    assert.equal(bobUsers.find(user => user.id === alice.body.user.id).unreadCount, 1);

    const unauthorizedHistory = await emit(carolSocket, "fetchMessages", { to: bob.body.user.id });
    assert.equal(unauthorizedHistory.ok, true);
    assert.equal(unauthorizedHistory.messages.length, 0);

    const wrongRecipientAck = await emit(carolSocket, "messageDelivered", incoming.id);
    assert.equal(wrongRecipientAck.updated, false);
    let stored = await Message.findById(incoming.id).lean().exec();
    assert.equal(stored.status, "sent");

    const deliveredStatus = new Promise(resolve => aliceSocket.once("messageStatus", resolve));
    const acknowledgement = await emit(bobSocket, "messageDelivered", incoming.id);
    assert.equal(acknowledgement.updated, true);
    assert.equal((await deliveredStatus).status, "delivered");
    stored = await Message.findById(incoming.id).lean().exec();
    assert.equal(stored.status, "delivered");
    assert.ok(stored.deliveredAt);

    const readStatus = new Promise(resolve => aliceSocket.once("messageStatus", resolve));
    const readResult = await emit(bobSocket, "markConversationRead", { from: alice.body.user.id });
    assert.equal(readResult.ok, true);
    assert.equal(readResult.markedRead, 1);
    assert.equal(readResult.unreadCount, 0);
    assert.equal((await readStatus).status, "read");
    stored = await Message.findById(incoming.id).lean().exec();
    assert.equal(stored.status, "read");
    assert.ok(stored.readAt);
    assert.ok(stored.deliveredAt);
    assert.equal(await Message.countDocuments({ to: bob.body.user.id, from: alice.body.user.id, status: { $ne: "read" } }), 0);

    const duplicate = await emit(aliceSocket, "privateMessage", {
        to: bob.body.user.id,
        message: "hello privately",
        clientMessageId: "message-1"
    });
    assert.equal(duplicate.messages[0].id, incoming.id);
    assert.equal(await Message.countDocuments({ from: alice.body.user.id, to: bob.body.user.id }), 1);
    await new Promise(resolve => setTimeout(resolve, 50));
    assert.equal(notificationEvents.length, 1);

    const history = await emit(bobSocket, "fetchMessages", { to: alice.body.user.id });
    assert.equal(history.messages.length, 1);

    const replyNotification = new Promise(resolve => aliceSocket.once("messageNotification", resolve));
    const reply = await emit(bobSocket, "privateMessage", {
        to: alice.body.user.id,
        message: "Reply notification",
        clientMessageId: "reply-1"
    });
    assert.equal(reply.ok, true);
    const notification = await replyNotification;
    assert.equal(notification.from, bob.body.user.id);
    assert.equal(notification.senderName, "Bob");
    assert.equal(notification.preview, "Reply notification");
    const aliceUsers = await request("/api/users", { token: alice.body.token });
    assert.equal(
        (await aliceUsers.json()).users.find(user => user.id === bob.body.user.id).unreadCount,
        1
    );

    const video = Buffer.from([
        0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70,
        0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x00, 0x00
    ]);
    const videoForm = new FormData();
    videoForm.append("recipientId", bob.body.user.id);
    videoForm.append("file", new Blob([video], { type: "video/mp4" }), "clip.mp4");
    const videoUpload = await request("/api/attachments", {
        method: "POST",
        token: alice.body.token,
        body: videoForm
    });
    assert.equal(videoUpload.status, 201);
    const videoMessage = (await videoUpload.json()).message;
    assert.equal(videoMessage.attachment.mimeType, "video/mp4");
    const downloadedVideo = await request(videoMessage.attachment.url, { token: bob.body.token });
    assert.equal(downloadedVideo.status, 200);
    assert.deepEqual(Buffer.from(await downloadedVideo.arrayBuffer()), video);

    const workbook = makeWorkbook([["test"], ["valid Office archive"]]);
    const workbookForm = new FormData();
    workbookForm.append("recipientId", bob.body.user.id);
    workbookForm.append(
        "file",
        new Blob([workbook], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }),
        "workbook.xlsx"
    );
    const workbookUpload = await request("/api/attachments", {
        method: "POST",
        token: alice.body.token,
        body: workbookForm
    });
    assert.equal(workbookUpload.status, 201);

    const groupSend = await emit(aliceSocket, "privateMessage", {
        to: `${bob.body.user.id},${carol.body.user.id}`,
        message: "Legacy multi-recipient format",
        clientMessageId: "group-message"
    });
    assert.equal(groupSend.messages.length, 2);
    assert.equal(await Message.countDocuments({ from: alice.body.user.id, clientMessageId: "group-message" }), 2);
});

test("presence stays online until the user's last tab disconnects", async () => {
    const alice = await register("tabs@example.com", "Tabs");
    const bob = await register("presence@example.com", "Presence");
    const first = await connectSocket(alice.body.token);
    const second = await connectSocket(alice.body.token);
    const userList = async () => (await (await request("/api/users", { token: bob.body.token })).json()).users;

    const visibleUsers = await userList();
    assert.deepEqual(
        Object.keys(visibleUsers[0]).sort(),
        ["id", "name", "online", "unreadCount"]
    );
    assert.equal(visibleUsers.find(user => user.id === alice.body.user.id).online, true);
    first.disconnect();
    await new Promise(resolve => setTimeout(resolve, 50));
    assert.equal((await userList()).find(user => user.id === alice.body.user.id).online, true);
    second.disconnect();
    await new Promise(resolve => setTimeout(resolve, 50));
    assert.equal((await userList()).find(user => user.id === alice.body.user.id).online, false);
});

test("offline messages remain saved and appear in history when the recipient reconnects", async () => {
    const alice = await register("offline-sender@example.com", "Sender");
    const bob = await register("offline-recipient@example.com", "Recipient");
    const aliceSocket = await connectSocket(alice.body.token);
    const bobSocket = await connectSocket(bob.body.token);
    bobSocket.disconnect();
    await new Promise(resolve => setTimeout(resolve, 25));

    const sent = await emit(aliceSocket, "privateMessage", {
        to: bob.body.user.id,
        message: "Delivered after reconnect",
        clientMessageId: "offline-message"
    });
    assert.equal(sent.ok, true);
    assert.equal(sent.messages[0].status, "sent");
    assert.equal(await Message.countDocuments({ to: bob.body.user.id }), 1);
    const offlineRecipientUsers = await request("/api/users", { token: bob.body.token });
    assert.equal(
        (await offlineRecipientUsers.json()).users.find(user => user.id === alice.body.user.id).unreadCount,
        1
    );

    const reconnectedBob = await connectSocket(bob.body.token);
    const history = await emit(reconnectedBob, "fetchMessages", { to: alice.body.user.id });
    assert.equal(history.messages.length, 1);
    assert.equal(history.messages[0].message, "Delivered after reconnect");
    assert.equal(history.messages[0].status, "sent");
    assert.equal((await emit(reconnectedBob, "messageDelivered", history.messages[0].id)).updated, true);
    const read = await emit(reconnectedBob, "markConversationRead", { from: alice.body.user.id });
    assert.equal(read.markedRead, 1);
    assert.equal(read.unreadCount, 0);
    assert.equal((await Message.findById(history.messages[0].id).lean().exec()).status, "read");
});

test("authenticated users can share a validated private image and unrelated users cannot download it", async () => {
    const alice = await register("attachment-alice@example.com", "Alice");
    const bob = await register("attachment-bob@example.com", "Bob");
    const carol = await register("attachment-carol@example.com", "Carol");
    const aliceSocket = await connectSocket(alice.body.token);
    const bobSocket = await connectSocket(bob.body.token);
    const receivedMessage = new Promise(resolve => bobSocket.once("privateMessage", resolve));
    const receivedNotification = new Promise(resolve => bobSocket.once("messageNotification", resolve));
    const image = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/gNoAAAAASUVORK5CYII=",
        "base64"
    );
    const form = new FormData();
    form.append("recipientId", bob.body.user.id);
    form.append("file", new Blob([image], { type: "image/png" }), "private image.png");
    const uploaded = await request("/api/attachments", {
        method: "POST",
        token: alice.body.token,
        body: form
    });
    assert.equal(uploaded.status, 201);
    const result = await uploaded.json();
    assert.equal(result.ok, true);
    assert.equal(result.message.from, alice.body.user.id);
    assert.equal(result.message.to, bob.body.user.id);
    assert.equal(result.message.attachment.filename, "private image.png");
    assert.equal(result.message.attachment.mimeType, "image/png");
    assert.equal(result.message.attachment.size, image.length);
    assert.equal(Object.hasOwn(result.message.attachment, "storageName"), false);

    const socketMessage = await receivedMessage;
    assert.equal(socketMessage.id, result.message.id);
    assert.equal(socketMessage.attachment.filename, "private image.png");
    const notification = await receivedNotification;
    assert.match(notification.preview, /private image\.png/);

    const authorizedDownload = await request(result.message.attachment.url, { token: bob.body.token });
    assert.equal(authorizedDownload.status, 200);
    assert.equal(authorizedDownload.headers.get("content-type"), "image/png");
    assert.deepEqual(Buffer.from(await authorizedDownload.arrayBuffer()), image);

    const senderDownload = await request(result.message.attachment.url, { token: alice.body.token });
    assert.equal(senderDownload.status, 200);
    const unrelatedDownload = await request(result.message.attachment.url, { token: carol.body.token });
    assert.equal(unrelatedDownload.status, 404);
    const unauthenticatedDownload = await request(result.message.attachment.url);
    assert.equal(unauthenticatedDownload.status, 401);

    const storedMessage = await Message.findById(result.message.id).lean().exec();
    assert.equal(storedMessage.attachment.senderId, alice.body.user.id);
    assert.equal(storedMessage.attachment.recipientId, bob.body.user.id);
    assert.equal(storedMessage.attachment.fileSize, image.length);
    assert.ok(storedMessage.attachment.storageName);
});

test("offline recipient gets persisted attachment history and unread count on reconnect", async () => {
    const alice = await register("offline-file-sender@example.com", "File sender");
    const bob = await register("offline-file-recipient@example.com", "File recipient");
    const aliceSocket = await connectSocket(alice.body.token);
    const bobSocket = await connectSocket(bob.body.token);
    bobSocket.disconnect();
    await new Promise(resolve => setTimeout(resolve, 25));

    const pdf = Buffer.from("%PDF-1.4\nPrivate test document\n%%EOF\n", "ascii");
    const form = new FormData();
    form.append("recipientId", bob.body.user.id);
    form.append("file", new Blob([pdf], { type: "application/pdf" }), "offline.pdf");
    const uploaded = await request("/api/attachments", {
        method: "POST",
        token: alice.body.token,
        body: form
    });
    assert.equal(uploaded.status, 201);
    const result = await uploaded.json();
    assert.equal(await Message.countDocuments({ _id: result.message.id }), 1);

    const recipientUsers = await request("/api/users", { token: bob.body.token });
    assert.equal(
        (await recipientUsers.json()).users.find(user => user.id === alice.body.user.id).unreadCount,
        1
    );
    const reconnectedBob = await connectSocket(bob.body.token);
    const history = await emit(reconnectedBob, "fetchMessages", { to: alice.body.user.id });
    assert.equal(history.messages.length, 1);
    assert.equal(history.messages[0].attachment.filename, "offline.pdf");
    const download = await request(history.messages[0].attachment.url, { token: bob.body.token });
    assert.equal(download.status, 200);
    assert.deepEqual(Buffer.from(await download.arrayBuffer()), pdf);
});

test("attachment uploads reject MIME spoofing, invalid file signatures, and oversized files", async () => {
    const sender = await register("file-validation-sender@example.com", "Sender");
    const recipient = await register("file-validation-recipient@example.com", "Recipient");
    const forgedPng = new FormData();
    forgedPng.append("recipientId", recipient.body.user.id);
    forgedPng.append("file", new Blob(["not a png"], { type: "image/png" }), "forged.png");
    const forgedResponse = await request("/api/attachments", {
        method: "POST",
        token: sender.body.token,
        body: forgedPng
    });
    assert.equal(forgedResponse.status, 415);

    const mismatchedMime = new FormData();
    mismatchedMime.append("recipientId", recipient.body.user.id);
    mismatchedMime.append("file", new Blob(["%PDF-1.4"], { type: "text/plain" }), "fake.pdf");
    const mismatchedResponse = await request("/api/attachments", {
        method: "POST",
        token: sender.body.token,
        body: mismatchedMime
    });
    assert.equal(mismatchedResponse.status, 415);

    const oversized = new FormData();
    oversized.append("recipientId", recipient.body.user.id);
    oversized.append(
        "file",
        new Blob([Buffer.alloc(25 * 1024 * 1024 + 1)], { type: "application/pdf" }),
        "large.pdf"
    );
    const oversizedResponse = await request("/api/attachments", {
        method: "POST",
        token: sender.body.token,
        body: oversized
    });
    assert.equal(oversizedResponse.status, 413);
});

test("message edit, delete, forwarding, and ownership checks are enforced", async () => {
    const alice = await register("manage-alice@example.com", "Alice");
    const bob = await register("manage-bob@example.com", "Bob");
    const carol = await register("manage-carol@example.com", "Carol");
    const aliceSocket = await connectSocket(alice.body.token);
    const bobSocket = await connectSocket(bob.body.token);
    const carolSocket = await connectSocket(carol.body.token);

    const sent = await emit(aliceSocket, "privateMessage", {
        to: [bob.body.user.id],
        message: "Original text",
        clientMessageId: "managed-text-1"
    });
    const original = sent.messages[0];
    const unauthorizedEdit = await request(`/api/messages/${original.id}`, {
        method: "PATCH",
        token: carol.body.token,
        body: JSON.stringify({ message: "Not allowed" })
    });
    assert.equal(unauthorizedEdit.status, 404);
    const invalidEdit = await request(`/api/messages/${original.id}`, {
        method: "PATCH",
        token: alice.body.token,
        body: JSON.stringify({ message: "   " })
    });
    assert.equal(invalidEdit.status, 400);

    const updateEvent = new Promise(resolve => bobSocket.once("messageUpdated", resolve));
    const edit = await request(`/api/messages/${original.id}`, {
        method: "PATCH",
        token: alice.body.token,
        body: JSON.stringify({ message: "Edited text" })
    });
    assert.equal(edit.status, 200);
    const edited = (await edit.json()).message;
    assert.equal(edited.message, "Edited text");
    assert.equal(edited.edited, true);
    assert.ok(edited.editedAt);
    assert.equal((await updateEvent).message, "Edited text");

    const forwardedEvent = new Promise(resolve => carolSocket.once("privateMessage", resolve));
    const forward = await request(`/api/messages/${original.id}/forward`, {
        method: "POST",
        token: bob.body.token,
        body: JSON.stringify({ recipientId: carol.body.user.id })
    });
    assert.equal(forward.status, 201);
    const forwarded = (await forward.json()).message;
    assert.equal(forwarded.message, "Edited text");
    assert.equal(forwarded.from, bob.body.user.id);
    assert.equal(forwarded.to, carol.body.user.id);
    assert.equal(forwarded.forwarded, true);
    assert.equal((await forwardedEvent).id, forwarded.id);

    const unauthorizedDelete = await request(`/api/messages/${forwarded.id}`, {
        method: "DELETE",
        token: alice.body.token
    });
    assert.equal(unauthorizedDelete.status, 404);
    const deleteEvent = new Promise(resolve => bobSocket.once("messageDeleted", resolve));
    const remove = await request(`/api/messages/${original.id}`, {
        method: "DELETE",
        token: alice.body.token
    });
    assert.equal(remove.status, 200);
    assert.equal((await remove.json()).message.deleted, true);
    assert.equal((await deleteEvent).deleted, true);
    assert.equal((await Message.findById(original.id).lean().exec()).message, "");
    assert.equal((await request(`/api/messages/${original.id}`, {
        method: "PATCH",
        token: alice.body.token,
        body: JSON.stringify({ message: "Edit after delete" })
    })).status, 404);
});

test("shared files are listed safely and only their sender can delete stored data", async () => {
    const alice = await register("file-owner@example.com", "File owner");
    const bob = await register("file-recipient@example.com", "File recipient");
    const carol = await register("file-outsider@example.com", "Outsider");
    const aliceSocket = await connectSocket(alice.body.token);
    const bobSocket = await connectSocket(bob.body.token);
    const carolSocket = await connectSocket(carol.body.token);
    const pdf = Buffer.from("%PDF-1.4\nPrivate file\n%%EOF\n", "ascii");
    const upload = async (recipientId, token = alice.body.token) => {
        const form = new FormData();
        form.append("recipientId", recipientId);
        form.append("file", new Blob([pdf], { type: "application/pdf" }), "shared.pdf");
        return request("/api/attachments", { method: "POST", token, body: form });
    };
    const uploaded = await upload(bob.body.user.id);
    assert.equal(uploaded.status, 201);
    const sourceMessage = (await uploaded.json()).message;
    const sourceRecord = await Message.findById(sourceMessage.id).lean().exec();
    const sourcePath = path.join(attachmentsDir, sourceRecord.attachment.storageName);
    assert.equal(fs.existsSync(sourcePath), true);

    const bobFiles = await request("/api/files", { token: bob.body.token });
    const listed = (await bobFiles.json()).files[0];
    assert.equal(listed.filename, "shared.pdf");
    assert.equal(listed.owner.name, "File owner");
    assert.equal(listed.sharedWith.name, "File recipient");
    assert.equal(listed.canDelete, false);
    assert.equal(Object.hasOwn(listed, "storageName"), false);
    assert.equal((await request("/api/files")).status, 401);
    assert.equal((await request(`/api/messages/${sourceMessage.id}`, {
        method: "DELETE",
        token: bob.body.token
    })).status, 404);

    const forwarded = await request(`/api/messages/${sourceMessage.id}/forward`, {
        method: "POST",
        token: bob.body.token,
        body: JSON.stringify({ recipientId: carol.body.user.id })
    });
    assert.equal(forwarded.status, 201);
    const forwardedMessage = (await forwarded.json()).message;
    const forwardedRecord = await Message.findById(forwardedMessage.id).lean().exec();
    const forwardedPath = path.join(attachmentsDir, forwardedRecord.attachment.storageName);
    assert.notEqual(forwardedPath, sourcePath);
    assert.equal(fs.existsSync(forwardedPath), true);
    assert.deepEqual(
        Buffer.from(await (await request(forwardedMessage.attachment.url, {
            token: carol.body.token
        })).arrayBuffer()),
        pdf
    );

    const deleted = await request(`/api/messages/${sourceMessage.id}`, {
        method: "DELETE",
        token: alice.body.token
    });
    assert.equal(deleted.status, 200);
    assert.equal(fs.existsSync(sourcePath), false);
    assert.equal((await request(sourceMessage.attachment.url, { token: bob.body.token })).status, 404);
    assert.equal((await (await request("/api/files", { token: alice.body.token })).json()).files.length, 0);
    assert.equal(fs.existsSync(forwardedPath), true);
    assert.equal((await request(forwardedMessage.attachment.url, {
        token: carol.body.token
    })).status, 200);
    assert.equal((await request(`/api/messages/${forwardedMessage.id}`, {
        method: "DELETE",
        token: carol.body.token
    })).status, 404);
    assert.equal((await request(`/api/messages/${forwardedMessage.id}`, {
        method: "DELETE",
        token: bob.body.token
    })).status, 200);
    assert.equal(fs.existsSync(forwardedPath), false);
});

test("conversation history keeps stable ordering and older-message pagination", async () => {
    const alice = await register("history-sender@example.com", "History sender");
    const bob = await register("history-recipient@example.com", "History recipient");
    const createdAt = new Date("2025-01-01T00:00:00.000Z");
    await Message.insertMany(Array.from({ length: 51 }, (_, index) => ({
        from: alice.body.user.id,
        to: bob.body.user.id,
        message: `Message ${index}`,
        timestamp: new Date(createdAt.getTime() + index * 1000)
    })));
    const bobSocket = await connectSocket(bob.body.token);
    const newestPage = await emit(bobSocket, "fetchMessages", { to: alice.body.user.id });
    assert.equal(newestPage.messages.length, 50);
    assert.equal(newestPage.hasMore, true);
    assert.equal(newestPage.messages[0].message, "Message 1");
    assert.equal(newestPage.messages[49].message, "Message 50");
    const olderPage = await emit(bobSocket, "fetchMessages", {
        to: alice.body.user.id,
        before: newestPage.nextCursor
    });
    assert.equal(olderPage.messages.length, 1);
    assert.equal(olderPage.messages[0].message, "Message 0");
    assert.equal(olderPage.hasMore, false);
});

test("admin import validates rows and export contains only escaped public fields", async () => {
    const admin = await register("admin@example.com", "=Admin");
    await User.updateOne({ _id: admin.body.user.id }, { $set: { role: "admin" } });
    const ordinary = await register("ordinary@example.com", "Ordinary");
    const forbidden = await request("/api/admin/users/export", { token: ordinary.body.token });
    assert.equal(forbidden.status, 403);
    const forbiddenImport = await request("/api/admin/users/import", {
        method: "POST",
        token: ordinary.body.token
    });
    assert.equal(forbiddenImport.status, 403);
    const forbiddenTemplate = await request("/api/admin/users/import-template", { token: ordinary.body.token });
    assert.equal(forbiddenTemplate.status, 403);

    const exportedInput = new FormData();
    exportedInput.append(
        "file",
        new Blob([makeWorkbook([
            ["Name", "Email", "Registration date"],
            ["Existing", "ordinary@example.com", "2026-01-01"]
        ])], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }),
        "registered-users.xlsx"
    );
    const exportAsImport = await request("/api/admin/users/import", {
        method: "POST",
        token: admin.body.token,
        body: exportedInput
    });
    assert.equal(exportAsImport.status, 400);
    assert.match((await exportAsImport.json()).error, /intentionally omit passwords/i);

    const templateResponse = await request("/api/admin/users/import-template", { token: admin.body.token });
    assert.equal(templateResponse.status, 200);
    assert.match(templateResponse.headers.get("content-disposition"), /user-import-template\.xlsx/);
    const template = XLSX.read(Buffer.from(await templateResponse.arrayBuffer()), { type: "buffer" });
    assert.deepEqual(
        XLSX.utils.sheet_to_json(template.Sheets.Users, { header: 1, defval: "" })[0],
        ["name", "email", "password"]
    );

    const workbook = makeWorkbook([
        ["name", "email", "password"],
        ["Imported", "imported@example.com", "imported-password"],
        ["Duplicate", "imported@example.com", "duplicate-password"],
        ["Bad", "invalid", "tiny"],
        ["Existing", "ordinary@example.com", "another-password"]
    ]);
    const form = new FormData();
    form.append(
        "file",
        new Blob([workbook], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }),
        "users.xlsx"
    );
    const importedResponse = await request("/api/admin/users/import", {
        method: "POST",
        token: admin.body.token,
        body: form
    });
    assert.equal(importedResponse.status, 200);
    const summary = await importedResponse.json();
    assert.equal(summary.successfulRows, 1);
    assert.equal(summary.skippedRows, 3);
    assert.equal(summary.errors.length, 3);
    const importedUser = await User.findOne({ email: "imported@example.com" })
        .select("+password").exec();
    assert.notEqual(importedUser.password, "imported-password");

    const exportedResponse = await request("/api/admin/users/export", { token: admin.body.token });
    assert.equal(exportedResponse.status, 200);
    assert.match(exportedResponse.headers.get("content-disposition"), /attachment/);
    const exported = XLSX.read(Buffer.from(await exportedResponse.arrayBuffer()), { type: "buffer" });
    const rows = XLSX.utils.sheet_to_json(exported.Sheets.Users, { header: 1 });
    assert.deepEqual(rows[0], ["Name", "Email", "Registration date"]);
    assert.ok(rows.some(row => row[0] === "'=Admin"));
    assert.equal(rows.flat().includes(importedUser.password), false);
});

test("logout revokes tokens and closes authenticated sockets", async () => {
    const account = await register("logout@example.com", "Logout");
    const socket = await connectSocket(account.body.token);
    const response = await request("/api/auth/logout", {
        method: "POST",
        token: account.body.token
    });
    assert.equal(response.status, 200);
    const privateResponse = await request("/api/users", { token: account.body.token });
    assert.equal(privateResponse.status, 401);
    await new Promise(resolve => {
        if (!socket.connected) return resolve();
        socket.once("disconnect", resolve);
    });
});
