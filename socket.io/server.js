require("dotenv").config();

const bcrypt = require("bcrypt");
const crypto = require("crypto");
const express = require("express");
const fs = require("fs");
const fsp = require("fs/promises");
const http = require("http");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const { Server } = require("socket.io");
const XLSX = require("xlsx");
const yauzl = require("yauzl");
const Message = require("./models/Message");
const User = require("./models/User");

const PAGE_SIZE = 50;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_RECIPIENTS = 50;
const MAX_IMPORT_FILE_SIZE = 2 * 1024 * 1024;
const MAX_IMPORT_ROWS = 1000;
const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024;
const BCRYPT_ROUNDS = 12;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
const JWT_ISSUER = "private-chat";
const JWT_AUDIENCE = "private-chat";
const ATTACHMENT_TYPES = Object.freeze({
    ".pdf": { mimeTypes: ["application/pdf"], kind: "document" },
    ".doc": { mimeTypes: ["application/msword"], kind: "document" },
    ".docx": {
        mimeTypes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        kind: "document",
        archiveEntry: "word/document.xml"
    },
    ".xls": { mimeTypes: ["application/vnd.ms-excel"], kind: "document" },
    ".xlsx": {
        mimeTypes: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
        kind: "document",
        archiveEntry: "xl/workbook.xml"
    },
    ".ppt": { mimeTypes: ["application/vnd.ms-powerpoint"], kind: "document" },
    ".pptx": {
        mimeTypes: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
        kind: "document",
        archiveEntry: "ppt/presentation.xml"
    },
    ".txt": { mimeTypes: ["text/plain"], kind: "document" },
    ".csv": { mimeTypes: ["text/csv", "application/vnd.ms-excel"], kind: "document" },
    ".jpg": { mimeTypes: ["image/jpeg"], kind: "image" },
    ".jpeg": { mimeTypes: ["image/jpeg"], kind: "image" },
    ".png": { mimeTypes: ["image/png"], kind: "image" },
    ".gif": { mimeTypes: ["image/gif"], kind: "image" },
    ".webp": { mimeTypes: ["image/webp"], kind: "image" },
    ".mp4": { mimeTypes: ["video/mp4"], kind: "video" },
    ".mov": { mimeTypes: ["video/quicktime"], kind: "video" },
    ".webm": { mimeTypes: ["video/webm"], kind: "video" }
});

function acknowledge(callback, result) {
    if (typeof callback === "function") callback(result);
}

function normalizeEmail(value) {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeObjectId(value) {
    if (typeof value !== "string") return null;
    const normalized = value.trim().toLowerCase();
    return OBJECT_ID_PATTERN.test(normalized) ? normalized : null;
}

function validateRegistration({ name, email, password }) {
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedName || normalizedName.length > 50) {
        return { error: "Name must be between 1 and 50 characters." };
    }
    if (
        !normalizedEmail ||
        normalizedEmail.length > 254 ||
        !EMAIL_PATTERN.test(normalizedEmail)
    ) {
        return { error: "Enter a valid email address." };
    }
    if (
        typeof password !== "string" ||
        password.length < 8 ||
        Buffer.byteLength(password, "utf8") > 72
    ) {
        return { error: "Password must be at least 8 characters and at most 72 bytes." };
    }
    return { value: { name: normalizedName, email: normalizedEmail, password } };
}

function safeUser(user) {
    return {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role || "user",
        createdAt: user.createdAt
    };
}

function serializeMessage(message) {
    const serialized = {
        id: String(message._id),
        from: message.from,
        to: message.to,
        message: message.message,
        timestamp: message.timestamp,
        edited: Boolean(message.editedAt),
        editedAt: message.editedAt || null,
        deleted: Boolean(message.deletedAt),
        forwarded: Boolean(message.forwardedFrom),
        status: message.status || "sent",
        deliveredAt: message.deliveredAt || null,
        readAt: message.readAt || null
    };
    if (message.attachment) {
        serialized.attachment = {
            filename: message.attachment.originalFilename,
            mimeType: message.attachment.mimeType,
            size: message.attachment.fileSize,
            url: `/api/attachments/${String(message._id)}`
        };
    }
    return serialized;
}

function validateAttachmentHeader(file) {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const type = ATTACHMENT_TYPES[extension];
    if (!type || !type.mimeTypes.includes(file.mimetype)) {
        return { error: "This file extension and MIME type are not supported." };
    }
    const data = file.buffer;
    if (!Buffer.isBuffer(data) || data.length === 0) {
        return { error: "The uploaded file is empty or invalid." };
    }
    const startsWith = signature => data.length >= signature.length &&
        data.subarray(0, signature.length).equals(signature);
    const validSignatures = {
        ".pdf": () => data.subarray(0, 5).toString("ascii") === "%PDF-",
        ".doc": () => startsWith(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])),
        ".xls": () => startsWith(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])),
        ".ppt": () => startsWith(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])),
        ".jpg": () => startsWith(Buffer.from([0xff, 0xd8, 0xff])),
        ".jpeg": () => startsWith(Buffer.from([0xff, 0xd8, 0xff])),
        ".png": () => startsWith(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
        ".gif": () => ["GIF87a", "GIF89a"].includes(data.subarray(0, 6).toString("ascii")),
        ".webp": () => data.length >= 12 &&
            data.subarray(0, 4).toString("ascii") === "RIFF" &&
            data.subarray(8, 12).toString("ascii") === "WEBP",
        ".mp4": () => data.length >= 12 && data.subarray(4, 8).toString("ascii") === "ftyp",
        ".mov": () => data.length >= 12 && data.subarray(4, 8).toString("ascii") === "ftyp",
        ".webm": () => startsWith(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])),
        ".txt": () => !data.includes(0),
        ".csv": () => !data.includes(0)
    };
    if (type.archiveEntry) return { type, extension };
    if (!validSignatures[extension]?.()) {
        return { error: "The file contents do not match the selected file type." };
    }
    return { type, extension };
}

function hasRequiredOfficeEntry(buffer, expectedEntry) {
    return new Promise((resolve, reject) => {
        yauzl.fromBuffer(buffer, { lazyEntries: true, autoClose: true }, (error, zipFile) => {
            if (error) return reject(error);
            let entryCount = 0;
            let hasContentTypes = false;
            let hasExpectedEntry = false;
            zipFile.on("entry", entry => {
                entryCount += 1;
                if (entryCount > 2048) {
                    zipFile.close();
                    return reject(new Error("Office archive contains too many entries."));
                }
                if (entry.fileName === "[Content_Types].xml") hasContentTypes = true;
                if (entry.fileName === expectedEntry) hasExpectedEntry = true;
                zipFile.readEntry();
            });
            zipFile.on("end", () => resolve(hasContentTypes && hasExpectedEntry));
            zipFile.on("error", reject);
            zipFile.readEntry();
        });
    });
}

function sanitizeOriginalFilename(filename) {
    return String(filename || "")
        .split(/[\\/]/)
        .pop()
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .trim()
        .slice(0, 255);
}

function attachmentStorageName(message) {
    const storageName = message?.attachment?.storageName;
    return typeof storageName === "string" &&
        /^[a-f\d-]{36}\.[a-z\d]{2,5}$/i.test(storageName) &&
        path.basename(storageName) === storageName
        ? storageName
        : null;
}

function conversationQuery(userId, recipientId) {
    return {
        $or: [
            { from: userId, to: recipientId },
            { from: recipientId, to: userId }
        ]
    };
}

function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 20 } = {}) {
    const attempts = new Map();
    return (req, res, next) => {
        const now = Date.now();
        const key = req.ip;
        let entry = attempts.get(key);
        if (!entry || now - entry.startedAt >= windowMs) {
            entry = { startedAt: now, count: 0 };
            attempts.set(key, entry);
        }
        entry.count += 1;
        if (entry.count > max) {
            return res.status(429).json({
                ok: false,
                error: "Too many attempts. Please try again later."
            });
        }
        if (attempts.size > 10000) {
            for (const [ip, item] of attempts) {
                if (now - item.startedAt >= windowMs) attempts.delete(ip);
            }
        }
        next();
    };
}

function createChatServer({
    UserModel = User,
    MessageModel = Message,
    jwtSecret = process.env.JWT_SECRET,
    attachmentsDir = process.env.ATTACHMENTS_DIR || path.join(__dirname, "private_uploads"),
    authRateLimitOptions = {}
} = {}) {
    if (typeof jwtSecret !== "string" || Buffer.byteLength(jwtSecret, "utf8") < 32) {
        throw new Error("JWT_SECRET must be set to a random value of at least 32 bytes.");
    }
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "8h";
    try {
        jwt.sign({ sub: "configuration-check" }, jwtSecret, {
            algorithm: "HS256",
            expiresIn: jwtExpiresIn,
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE
        });
    } catch (error) {
        throw new Error("JWT_EXPIRES_IN must be a valid jsonwebtoken duration.");
    }

    const app = express();
    const server = http.createServer(app);
    const io = new Server(server);
    const onlineUsers = new Map();
    const authRateLimit = createRateLimiter(authRateLimitOptions);
    const privateAttachmentsDir = path.resolve(attachmentsDir);

    app.disable("x-powered-by");
    app.use((req, res, next) => {
        res.set({
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "Referrer-Policy": "no-referrer"
        });
        next();
    });
    app.use(express.json({ limit: "16kb" }));

    function createAccessToken(user) {
        return jwt.sign(
            { sub: String(user._id), ver: user.tokenVersion || 0 },
            jwtSecret,
            {
                algorithm: "HS256",
                expiresIn: jwtExpiresIn,
                issuer: JWT_ISSUER,
                audience: JWT_AUDIENCE
            }
        );
    }

    function verifyAccessToken(token) {
        return jwt.verify(token, jwtSecret, {
            algorithms: ["HS256"],
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE
        });
    }

    async function loadAuthenticatedUser(token) {
        const payload = verifyAccessToken(token);
        if (typeof payload.sub !== "string" || !OBJECT_ID_PATTERN.test(payload.sub)) {
            throw new Error("Invalid authentication token.");
        }
        const user = await UserModel.findById(payload.sub)
            .select("name email role tokenVersion")
            .exec();
        if (!user || (user.tokenVersion || 0) !== (payload.ver || 0)) {
            throw new Error("Invalid authentication token.");
        }
        return { user, payload };
    }

    async function authenticateHttp(req, res, next) {
        const header = req.get("authorization") || "";
        const match = /^Bearer\s+(\S+)$/i.exec(header);
        if (!match) {
            return res.status(401).json({ ok: false, error: "Authentication required." });
        }
        try {
            const { user } = await loadAuthenticatedUser(match[1]);
            req.user = {
                id: String(user._id),
                name: user.name,
                role: user.role || "user",
                tokenVersion: user.tokenVersion || 0
            };
            next();
        } catch (error) {
            res.status(401).json({ ok: false, error: "Invalid or expired access token." });
        }
    }

    function requireAdmin(req, res, next) {
        if (req.user.role !== "admin") {
            return res.status(403).json({ ok: false, error: "Administrator access required." });
        }
        next();
    }

    async function broadcastMessageMutation(eventName, message) {
        const serialized = serializeMessage(message);
        io.to(`user:${message.from}`).emit(eventName, serialized);
        io.to(`user:${message.to}`).emit(eventName, serialized);
        const unreadCount = await MessageModel.countDocuments({
            from: message.from,
            to: message.to,
            status: { $ne: "read" },
            deletedAt: null
        }).exec();
        io.to(`user:${message.to}`).emit("unreadCount", {
            from: message.from,
            count: unreadCount
        });
        return serialized;
    }

    app.post("/api/auth/register", authRateLimit, async (req, res) => {
        const validation = validateRegistration(req.body || {});
        if (validation.error) {
            return res.status(400).json({ ok: false, error: validation.error });
        }
        try {
            const { name, email, password } = validation.value;
            const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
            const user = await UserModel.create({ name, email, password: passwordHash });
            return res.status(201).json({
                ok: true,
                token: createAccessToken(user),
                user: safeUser(user)
            });
        } catch (error) {
            if (error && error.code === 11000) {
                return res.status(409).json({ ok: false, error: "That email is already registered." });
            }
            console.error("Registration failed.");
            return res.status(500).json({ ok: false, error: "Could not create the account." });
        }
    });

    app.post("/api/auth/login", authRateLimit, async (req, res) => {
        const email = normalizeEmail(req.body?.email);
        const password = req.body?.password;
        if (
            !email ||
            email.length > 254 ||
            !EMAIL_PATTERN.test(email) ||
            typeof password !== "string" ||
            password.length === 0 ||
            Buffer.byteLength(password, "utf8") > 72
        ) {
            return res.status(400).json({ ok: false, error: "Enter a valid email and password." });
        }
        try {
            const user = await UserModel.findOne({ email }).select("+password +tokenVersion").exec();
            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({ ok: false, error: "Email or password is incorrect." });
            }
            return res.json({
                ok: true,
                token: createAccessToken(user),
                user: safeUser(user)
            });
        } catch (error) {
            console.error("Login failed.");
            return res.status(500).json({ ok: false, error: "Could not sign in." });
        }
    });

    app.get("/api/auth/me", authenticateHttp, async (req, res) => {
        try {
            const user = await UserModel.findById(req.user.id).exec();
            if (!user) return res.status(401).json({ ok: false, error: "Account no longer exists." });
            res.json({ ok: true, user: safeUser(user) });
        } catch (error) {
            console.error("Could not load account.");
            res.status(500).json({ ok: false, error: "Could not load your account." });
        }
    });

    app.post("/api/auth/logout", authenticateHttp, async (req, res) => {
        try {
            await UserModel.findByIdAndUpdate(req.user.id, { $inc: { tokenVersion: 1 } }).exec();
            const sockets = onlineUsers.get(req.user.id);
            if (sockets) {
                for (const socketId of sockets) {
                    const socket = io.sockets.sockets.get(socketId);
                    if (socket) {
                        socket.emit("authError", { error: "You have been signed out." });
                        socket.disconnect(true);
                    }
                }
            }
            res.json({ ok: true });
        } catch (error) {
            console.error("Logout failed.");
            res.status(500).json({ ok: false, error: "Could not sign out." });
        }
    });

    app.get("/api/users", authenticateHttp, async (req, res) => {
        try {
            const [users, unreadCounts] = await Promise.all([
                UserModel.find({ _id: { $ne: req.user.id } })
                    .select("name")
                    .sort({ name: 1, _id: 1 })
                    .lean()
                    .exec(),
                MessageModel.aggregate([
                    { $match: { to: req.user.id, status: { $ne: "read" }, deletedAt: null } },
                    { $group: { _id: "$from", count: { $sum: 1 } } }
                ]).exec()
            ]);
            const unreadBySender = new Map(
                unreadCounts.map(item => [item._id, item.count])
            );
            res.json({
                ok: true,
                users: users.map(user => ({
                    id: String(user._id),
                    name: user.name,
                    online: onlineUsers.has(String(user._id)),
                    unreadCount: unreadBySender.get(String(user._id)) || 0
                }))
            });
        } catch (error) {
            console.error("Could not load registered users.");
            res.status(500).json({ ok: false, error: "Could not load users." });
        }
    });

    app.get("/api/files", authenticateHttp, async (req, res) => {
        try {
            const messages = await MessageModel.find({
                attachment: { $exists: true },
                deletedAt: null,
                $or: [{ from: req.user.id }, { to: req.user.id }]
            })
                .select("from to timestamp attachment")
                .sort({ timestamp: -1, _id: -1 })
                .lean()
                .exec();
            const userIds = [...new Set(messages.flatMap(message => [message.from, message.to]))];
            const people = await UserModel.find({ _id: { $in: userIds } })
                .select("name")
                .lean()
                .exec();
            const names = new Map(people.map(person => [String(person._id), person.name]));
            return res.json({
                ok: true,
                files: messages.map(message => ({
                    id: String(message._id),
                    filename: message.attachment.originalFilename,
                    mimeType: message.attachment.mimeType,
                    size: message.attachment.fileSize,
                    timestamp: message.timestamp,
                    url: `/api/attachments/${String(message._id)}`,
                    owner: {
                        id: message.from,
                        name: names.get(message.from) || "Unknown user"
                    },
                    sharedWith: {
                        id: message.to,
                        name: names.get(message.to) || "Unknown user"
                    },
                    canDelete: message.from === req.user.id
                }))
            });
        } catch (error) {
            console.error("Could not load shared files.");
            return res.status(500).json({ ok: false, error: "Could not load shared files." });
        }
    });

    const upload = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: MAX_IMPORT_FILE_SIZE, files: 1 }
    }).single("file");

    const attachmentUpload = multer({
        storage: multer.memoryStorage(),
        limits: {
            fileSize: MAX_ATTACHMENT_SIZE,
            files: 1,
            fields: 1,
            parts: 2
        },
        fileFilter(req, file, callback) {
            const extension = path.extname(file.originalname || "").toLowerCase();
            const supported = ATTACHMENT_TYPES[extension];
            if (!supported || !supported.mimeTypes.includes(file.mimetype)) {
                const error = new Error("Unsupported attachment type. Choose a supported document, image, or video.");
                error.status = 415;
                return callback(error);
            }
            callback(null, true);
        }
    }).single("file");

    app.post("/api/attachments", authenticateHttp, (req, res, next) => {
        attachmentUpload(req, res, error => {
            if (error) return next(error);
            next();
        });
    }, async (req, res) => {
        const file = req.file;
        const recipientId = normalizeObjectId(req.body?.recipientId);
        if (!file) {
            return res.status(400).json({ ok: false, error: "Choose one file to attach." });
        }
        if (!recipientId || recipientId === req.user.id) {
            return res.status(400).json({ ok: false, error: "Select a valid recipient." });
        }
        const originalFilename = sanitizeOriginalFilename(file.originalname);
        if (!originalFilename || !path.extname(originalFilename)) {
            return res.status(400).json({ ok: false, error: "The original filename is invalid." });
        }
        const validation = validateAttachmentHeader({ ...file, originalname: originalFilename });
        if (validation.error) {
            return res.status(415).json({ ok: false, error: validation.error });
        }
        if (validation.type.archiveEntry) {
            try {
                if (!(await hasRequiredOfficeEntry(file.buffer, validation.type.archiveEntry))) {
                    return res.status(415).json({ ok: false, error: "The Office document contents are invalid." });
                }
            } catch (error) {
                return res.status(415).json({ ok: false, error: "The Office document archive is invalid." });
            }
        }

        try {
            const recipient = await UserModel.exists({ _id: recipientId }).exec();
            if (!recipient) {
                return res.status(404).json({ ok: false, error: "That user was not found." });
            }
        } catch (error) {
            console.error("Could not verify attachment recipient.");
            return res.status(500).json({ ok: false, error: "Could not verify the recipient." });
        }

        const storageName = `${crypto.randomUUID()}${validation.extension}`;
        const storagePath = path.join(privateAttachmentsDir, storageName);
        const timestamp = new Date();
        let stored = false;
        let savedMessage;
        try {
            await fsp.mkdir(privateAttachmentsDir, { recursive: true });
            await fsp.writeFile(storagePath, file.buffer, { flag: "wx", mode: 0o600 });
            stored = true;
            savedMessage = await MessageModel.create({
                from: req.user.id,
                to: recipientId,
                message: "",
                timestamp,
                status: "sent",
                attachment: {
                    originalFilename,
                    storageName,
                    mimeType: file.mimetype,
                    fileSize: file.size,
                    senderId: req.user.id,
                    recipientId,
                    timestamp
                }
            });
        } catch (error) {
            if (stored && !savedMessage) {
                try {
                    await fsp.unlink(storagePath);
                } catch (cleanupError) {
                    console.error("Could not remove an unreferenced private attachment.");
                }
            }
            console.error("Could not persist private attachment message.");
            return res.status(500).json({ ok: false, error: "Could not save this attachment." });
        }

        const serializedMessage = serializeMessage(savedMessage);
        let notificationWarning;
        try {
            const unreadCount = await MessageModel.countDocuments({
                from: req.user.id,
                to: recipientId,
                status: { $ne: "read" },
                deletedAt: null
            }).exec();
            io.to(`user:${recipientId}`).emit("privateMessage", serializedMessage);
            io.to(`user:${recipientId}`).emit("unreadCount", {
                from: req.user.id,
                count: unreadCount
            });
            const recipientSockets = onlineUsers.get(recipientId);
            const notificationSocketId = recipientSockets?.values().next().value;
            if (notificationSocketId) {
                io.to(notificationSocketId).emit("messageNotification", {
                    id: String(savedMessage._id),
                    from: req.user.id,
                    senderName: req.user.name,
                    preview: `Shared a file: ${originalFilename}`.slice(0, 140),
                    timestamp: savedMessage.timestamp,
                    unreadCount
                });
            }
        } catch (error) {
            console.error("Attachment saved but recipient notification could not be delivered.");
            notificationWarning = "Attachment saved, but the recipient notification could not be sent.";
        }
        return res.status(201).json({
            ok: true,
            message: serializedMessage,
            ...(notificationWarning ? { warning: notificationWarning } : {})
        });
    });

    app.patch("/api/messages/:messageId", authenticateHttp, async (req, res) => {
        const messageId = normalizeObjectId(req.params.messageId);
        const text = typeof req.body?.message === "string" ? req.body.message.trim() : "";
        if (!messageId) {
            return res.status(400).json({ ok: false, error: "Invalid message identifier." });
        }
        if (!text || text.length > MAX_MESSAGE_LENGTH) {
            return res.status(400).json({
                ok: false,
                error: `Messages must be between 1 and ${MAX_MESSAGE_LENGTH} characters.`
            });
        }
        try {
            const updated = await MessageModel.findOneAndUpdate(
                {
                    _id: messageId,
                    from: req.user.id,
                    attachment: { $exists: false },
                    deletedAt: null
                },
                { $set: { message: text, editedAt: new Date() } },
                { returnDocument: "after", runValidators: true }
            ).lean().exec();
            if (!updated) {
                return res.status(404).json({
                    ok: false,
                    error: "Editable message not found or you do not own it."
                });
            }
            const message = await broadcastMessageMutation("messageUpdated", updated);
            return res.json({ ok: true, message });
        } catch (error) {
            console.error("Message edit failed.");
            return res.status(500).json({ ok: false, error: "Could not edit this message." });
        }
    });

    app.delete("/api/messages/:messageId", authenticateHttp, async (req, res) => {
        const messageId = normalizeObjectId(req.params.messageId);
        if (!messageId) {
            return res.status(400).json({ ok: false, error: "Invalid message identifier." });
        }
        let tombstonePath;
        let storagePath;
        let movedAttachment = false;
        let persistedDeletion = false;
        try {
            const existing = await MessageModel.findOne({
                _id: messageId,
                from: req.user.id,
                deletedAt: null
            }).lean().exec();
            if (!existing) {
                return res.status(404).json({
                    ok: false,
                    error: "Message not found or you do not own it."
                });
            }
            if (existing.attachment) {
                const storageName = attachmentStorageName(existing);
                if (!storageName) {
                    console.error("Attachment message contains invalid storage metadata.");
                    return res.status(500).json({ ok: false, error: "Could not safely delete this file." });
                }
                storagePath = path.join(privateAttachmentsDir, storageName);
                tombstonePath = `${storagePath}.deleting-${crypto.randomUUID()}`;
                try {
                    await fsp.rename(storagePath, tombstonePath);
                    movedAttachment = true;
                } catch (error) {
                    if (error.code !== "ENOENT") throw error;
                }
            }
            const deleted = await MessageModel.findOneAndUpdate(
                { _id: messageId, from: req.user.id, deletedAt: null },
                {
                    $set: { deletedAt: new Date(), message: "" },
                    $unset: { attachment: 1 }
                },
                { returnDocument: "after" }
            ).lean().exec();
            if (!deleted) {
                if (movedAttachment) await fsp.rename(tombstonePath, storagePath);
                return res.status(404).json({
                    ok: false,
                    error: "Message not found or you do not own it."
                });
            }
            persistedDeletion = true;
            if (movedAttachment) {
                try {
                    await fsp.unlink(tombstonePath);
                } catch (error) {
                    console.error("Deleted attachment is inaccessible but its temporary file could not be removed.");
                }
            }
            let message = serializeMessage(deleted);
            try {
                message = await broadcastMessageMutation("messageDeleted", deleted);
            } catch (notificationError) {
                console.error("Message was deleted, but its updates could not be broadcast.");
            }
            return res.json({ ok: true, message });
        } catch (error) {
            if (movedAttachment && !persistedDeletion) {
                try {
                    await fsp.rename(tombstonePath, storagePath);
                } catch (restoreError) {
                    console.error("Could not restore an attachment after message deletion failed.");
                }
            }
            console.error("Message deletion failed.");
            return res.status(500).json({ ok: false, error: "Could not delete this message." });
        }
    });

    app.post("/api/messages/:messageId/forward", authenticateHttp, async (req, res) => {
        const messageId = normalizeObjectId(req.params.messageId);
        const recipientId = normalizeObjectId(req.body?.recipientId);
        if (!messageId || !recipientId || recipientId === req.user.id) {
            return res.status(400).json({ ok: false, error: "Select a valid message and recipient." });
        }
        let copiedStoragePath;
        let persistedForward = false;
        try {
            const source = await MessageModel.findOne({
                _id: messageId,
                deletedAt: null,
                $or: [{ from: req.user.id }, { to: req.user.id }]
            }).lean().exec();
            if (!source) {
                return res.status(404).json({ ok: false, error: "Message not found." });
            }
            const recipient = await UserModel.exists({ _id: recipientId }).exec();
            if (!recipient) {
                return res.status(404).json({ ok: false, error: "That user was not found." });
            }
            const now = new Date();
            const forwardedData = {
                from: req.user.id,
                to: recipientId,
                message: source.message,
                timestamp: now,
                status: "sent",
                deliveredAt: null,
                readAt: null,
                forwardedFrom: String(source._id)
            };
            if (source.attachment) {
                const storageName = attachmentStorageName(source);
                if (!storageName) {
                    console.error("Forwarded attachment contains invalid storage metadata.");
                    return res.status(500).json({ ok: false, error: "Could not safely forward this file." });
                }
                const extension = path.extname(storageName);
                const newStorageName = `${crypto.randomUUID()}${extension}`;
                const sourcePath = path.join(privateAttachmentsDir, storageName);
                copiedStoragePath = path.join(privateAttachmentsDir, newStorageName);
                await fsp.copyFile(sourcePath, copiedStoragePath, fs.constants.COPYFILE_EXCL);
                forwardedData.attachment = {
                    ...source.attachment,
                    storageName: newStorageName,
                    senderId: req.user.id,
                    recipientId,
                    timestamp: now
                };
            }
            let forwarded;
            try {
                forwarded = await MessageModel.create(forwardedData);
                persistedForward = true;
            } catch (error) {
                if (copiedStoragePath) {
                    try {
                        await fsp.unlink(copiedStoragePath);
                    } catch (cleanupError) {
                        console.error("Could not remove an unreferenced forwarded attachment.");
                    }
                }
                copiedStoragePath = null;
                throw error;
            }
            const serialized = serializeMessage(forwarded);
            try {
                const unreadCount = await MessageModel.countDocuments({
                    from: req.user.id,
                    to: recipientId,
                    status: { $ne: "read" },
                    deletedAt: null
                }).exec();
                io.to(`user:${recipientId}`).emit("privateMessage", serialized);
                io.to(`user:${recipientId}`).emit("unreadCount", { from: req.user.id, count: unreadCount });
                const recipientSockets = onlineUsers.get(recipientId);
                const notificationSocketId = recipientSockets?.values().next().value;
                if (notificationSocketId) {
                    io.to(notificationSocketId).emit("messageNotification", {
                        id: serialized.id,
                        from: req.user.id,
                        senderName: req.user.name,
                        preview: source.attachment
                            ? `Forwarded a file: ${source.attachment.originalFilename}`.slice(0, 140)
                            : source.message.slice(0, 140),
                        timestamp: serialized.timestamp,
                        unreadCount
                    });
                }
            } catch (notificationError) {
                console.error("Forwarded message was saved, but recipient notification failed.");
            }
            return res.status(201).json({ ok: true, message: serialized });
        } catch (error) {
            if (copiedStoragePath && !persistedForward) {
                try {
                    await fsp.unlink(copiedStoragePath);
                } catch (cleanupError) {
                    console.error("Could not remove an unreferenced forwarded attachment.");
                }
            }
            if (error.code === "ENOENT") {
                return res.status(404).json({ ok: false, error: "The source file is no longer available." });
            }
            console.error("Message forwarding failed.");
            return res.status(500).json({ ok: false, error: "Could not forward this message." });
        }
    });

    app.get("/api/attachments/:messageId", authenticateHttp, async (req, res) => {
        const messageId = normalizeObjectId(req.params.messageId);
        if (!messageId) {
            return res.status(400).json({ ok: false, error: "Invalid attachment identifier." });
        }
        try {
            const message = await MessageModel.findOne({
                _id: messageId,
                attachment: { $exists: true },
                deletedAt: null,
                $or: [{ from: req.user.id }, { to: req.user.id }]
            }).lean().exec();
            if (!message?.attachment) {
                return res.status(404).json({ ok: false, error: "Attachment not found." });
            }
            const { storageName, mimeType, originalFilename, fileSize } = message.attachment;
            if (
                typeof storageName !== "string" ||
                !/^[a-f\d-]{36}\.[a-z\d]{2,5}$/i.test(storageName) ||
                path.basename(storageName) !== storageName
            ) {
                console.error("Attachment metadata has an invalid storage name.");
                return res.status(404).json({ ok: false, error: "Attachment not found." });
            }
            const storagePath = path.join(privateAttachmentsDir, storageName);
            try {
                const stats = await fsp.stat(storagePath);
                if (!stats.isFile() || stats.size !== fileSize) {
                    return res.status(404).json({ ok: false, error: "Attachment not found." });
                }
            } catch (error) {
                return res.status(404).json({ ok: false, error: "Attachment not found." });
            }
            res.set({
                "Content-Type": mimeType,
                "Content-Length": String(fileSize),
                "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(originalFilename)}`,
                "Cache-Control": "private, no-store",
                "X-Content-Type-Options": "nosniff"
            });
            const stream = fs.createReadStream(storagePath);
            stream.on("error", () => {
                if (!res.headersSent) {
                    res.status(500).json({ ok: false, error: "Could not read the attachment." });
                } else {
                    res.destroy();
                }
            });
            stream.pipe(res);
        } catch (error) {
            console.error("Could not retrieve private attachment.");
            res.status(500).json({ ok: false, error: "Could not retrieve the attachment." });
        }
    });

    app.post("/api/admin/users/import", authenticateHttp, requireAdmin, (req, res, next) => {
        upload(req, res, error => {
            if (error) return next(error);
            next();
        });
    }, async (req, res) => {
        if (
            !req.file ||
            !/\.xlsx$/i.test(req.file.originalname) ||
            ![
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/octet-stream"
            ].includes(req.file.mimetype)
        ) {
            return res.status(400).json({ ok: false, error: "Upload one .xlsx file in the file field." });
        }
        const summary = { successfulRows: 0, skippedRows: 0, errors: [] };
        let rows;
        try {
            const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            if (!firstSheet) {
                return res.status(400).json({ ok: false, error: "The workbook contains no worksheet." });
            }
            rows = XLSX.utils.sheet_to_json(firstSheet, {
                header: 1,
                defval: "",
                raw: false
            });
        } catch (error) {
            console.error("Could not parse the user import workbook.");
            return res.status(400).json({ ok: false, error: "Could not read the .xlsx workbook." });
        }
        if (!rows.length) {
            return res.status(400).json({ ok: false, error: "The worksheet is empty." });
        }
        if (rows.length - 1 > MAX_IMPORT_ROWS) {
            return res.status(400).json({
                ok: false,
                error: `The worksheet may contain at most ${MAX_IMPORT_ROWS} data rows.`
            });
        }
        const headers = rows[0].map(value => String(value).trim().toLowerCase());
        const columns = ["name", "email", "password"];
        const headerIndexes = Object.fromEntries(
            columns.map(column => [column, headers.indexOf(column)])
        );
        const missing = columns.filter(column => headerIndexes[column] < 0);
        if (missing.length || new Set(headers).size !== headers.length) {
            return res.status(400).json({
                ok: false,
                error: missing.length
                    ? missing.includes("password")
                        ? "This workbook is missing the password column. Exported user lists intentionally omit passwords and cannot be imported as-is. Download the import template and provide a valid password for each new user."
                        : `Missing required columns: ${missing.join(", ")}.`
                    : "Worksheet column names must be unique."
            });
        }

        const seenEmails = new Set();
        for (let index = 1; index < rows.length; index += 1) {
            const row = rows[index];
            if (row.every(value => String(value).trim() === "")) {
                summary.skippedRows += 1;
                continue;
            }
            const name = String(row[headerIndexes.name] ?? "").trim();
            const email = normalizeEmail(String(row[headerIndexes.email] ?? ""));
            const password = String(row[headerIndexes.password] ?? "");
            const rowNumber = index + 1;
            const validation = validateRegistration({ name, email, password });
            if (validation.error) {
                summary.skippedRows += 1;
                summary.errors.push({ row: rowNumber, error: validation.error });
                continue;
            }
            if (seenEmails.has(email)) {
                summary.skippedRows += 1;
                summary.errors.push({ row: rowNumber, error: "Duplicate email in this worksheet." });
                continue;
            }
            seenEmails.add(email);
            try {
                const exists = await UserModel.exists({ email });
                if (exists) {
                    summary.skippedRows += 1;
                    summary.errors.push({ row: rowNumber, error: "Email is already registered." });
                    continue;
                }
                const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
                await UserModel.create({ name, email, password: passwordHash });
                summary.successfulRows += 1;
            } catch (error) {
                if (error && error.code === 11000) {
                    summary.skippedRows += 1;
                    summary.errors.push({ row: rowNumber, error: "Email is already registered." });
                    continue;
                }
                console.error(`User import failed at worksheet row ${rowNumber}.`);
                return res.status(500).json({
                    ok: false,
                    error: "Could not complete the user import.",
                    ...summary
                });
            }
        }
        return res.json({ ok: true, ...summary });
    });

    app.get("/api/admin/users/import-template", authenticateHttp, requireAdmin, (req, res) => {
        const workbook = XLSX.utils.book_new();
        const sheet = XLSX.utils.aoa_to_sheet([
            ["name", "email", "password"],
            ["", "", ""]
        ]);
        XLSX.utils.book_append_sheet(workbook, sheet, "Users");
        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
        res.set({
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": 'attachment; filename="user-import-template.xlsx"',
            "Cache-Control": "no-store"
        });
        res.send(buffer);
    });

    app.get("/api/admin/users/export", authenticateHttp, requireAdmin, async (req, res) => {
        try {
            const users = await UserModel.find({})
                .select("name email createdAt")
                .sort({ createdAt: 1, _id: 1 })
                .lean()
                .exec();
            const escapeSpreadsheetValue = value => {
                const text = String(value ?? "");
                return /^[\s]*[=+\-@\t\r]/.test(text) ? `'${text}` : text;
            };
            const sheet = XLSX.utils.aoa_to_sheet([
                ["Name", "Email", "Registration date"],
                ...users.map(user => [
                    escapeSpreadsheetValue(user.name),
                    escapeSpreadsheetValue(user.email),
                    user.createdAt ? new Date(user.createdAt).toISOString() : ""
                ])
            ]);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, sheet, "Users");
            const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
            res.set({
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": 'attachment; filename="registered-users.xlsx"',
                "Cache-Control": "no-store"
            });
            res.send(buffer);
        } catch (error) {
            console.error("Could not export registered users.");
            res.status(500).json({ ok: false, error: "Could not export users." });
        }
    });

    app.use(express.static(path.join(__dirname, "public"), { index: "index.html" }));
    app.use("/api", (req, res) => {
        res.status(404).json({
            ok: false,
            error: `API endpoint not found: ${req.method} ${req.baseUrl}${req.path}.`
        });
    });

    app.use((error, req, res, next) => {
        if (res.headersSent) return next(error);
        if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
            const maxSize = req.path === "/api/attachments" ? "25 MB" : "2 MB";
            return res.status(413).json({ ok: false, error: `The upload must be ${maxSize} or smaller.` });
        }
        if (error instanceof multer.MulterError) {
            return res.status(400).json({ ok: false, error: "The upload request is invalid." });
        }
        if (error.status === 415) {
            return res.status(415).json({ ok: false, error: error.message });
        }
        if (error.type === "entity.too.large") {
            return res.status(413).json({ ok: false, error: "The request body is too large." });
        }
        if (error.type === "entity.parse.failed") {
            return res.status(400).json({ ok: false, error: "The request body must contain valid JSON." });
        }
        console.error("Request failed.");
        res.status(500).json({ ok: false, error: "An unexpected server error occurred." });
    });

    function removeSocketFromPresence(socket) {
        const userId = socket.data.userId;
        const sockets = onlineUsers.get(userId);
        if (!sockets) return;
        sockets.delete(socket.id);
        if (sockets.size === 0) {
            onlineUsers.delete(userId);
            io.emit("userPresence", { userId, online: false });
        }
    }

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (typeof token !== "string" || !token) {
                return next(new Error("Authentication required."));
            }
            const { user, payload } = await loadAuthenticatedUser(token);
            socket.data.userId = String(user._id);
            socket.data.userName = user.name;
            socket.data.tokenVersion = user.tokenVersion || 0;
            socket.data.tokenExpiresAt = payload.exp * 1000;
            next();
        } catch (error) {
            next(new Error("Invalid or expired access token."));
        }
    });

    io.on("connection", socket => {
        const userId = socket.data.userId;
        let sockets = onlineUsers.get(userId);
        const cameOnline = !sockets;
        if (!sockets) {
            sockets = new Set();
            onlineUsers.set(userId, sockets);
        }
        sockets.add(socket.id);
        socket.join(`user:${userId}`);
        if (cameOnline) io.emit("userPresence", { userId, online: true });
        socket.emit("presenceSnapshot", { users: [...onlineUsers.keys()] });

        const expiryTimer = setTimeout(() => {
            socket.emit("authError", { error: "Your session expired. Please sign in again." });
            socket.disconnect(true);
        }, Math.max(0, socket.data.tokenExpiresAt - Date.now()));
        expiryTimer.unref?.();

        socket.use((packet, next) => {
            if (Date.now() >= socket.data.tokenExpiresAt) {
                socket.emit("authError", { error: "Your session expired. Please sign in again." });
                socket.disconnect(true);
                return next(new Error("Authentication expired."));
            }
            UserModel.findById(userId)
                .select("tokenVersion")
                .exec()
                .then(user => {
                    if (!user || (user.tokenVersion || 0) !== socket.data.tokenVersion) {
                        socket.emit("authError", { error: "Your session is no longer valid." });
                        socket.disconnect(true);
                        return next(new Error("Authentication revoked."));
                    }
                    next();
                })
                .catch(() => next(new Error("Authentication could not be verified.")));
        });

        socket.on("fetchMessages", async (data, callback) => {
            const recipientId = normalizeObjectId(data?.to);
            if (!recipientId || recipientId === userId) {
                return acknowledge(callback, { ok: false, error: "Select a valid conversation." });
            }
            try {
                const recipient = await UserModel.exists({ _id: recipientId });
                if (!recipient) {
                    return acknowledge(callback, { ok: false, error: "That user was not found." });
                }
                let query = conversationQuery(userId, recipientId);
                if (data.before !== undefined) {
                    const timestamp = new Date(data.before?.timestamp);
                    const id = normalizeObjectId(data.before?.id);
                    if (
                        Number.isNaN(timestamp.getTime()) ||
                        !id
                    ) {
                        return acknowledge(callback, { ok: false, error: "Invalid history cursor." });
                    }
                    query = {
                        $and: [
                            query,
                            {
                                $or: [
                                    { timestamp: { $lt: timestamp } },
                                    { timestamp, _id: { $lt: new mongoose.Types.ObjectId(id) } }
                                ]
                            }
                        ]
                    };
                }
                const results = await MessageModel.find(query)
                    .sort({ timestamp: -1, _id: -1 })
                    .limit(PAGE_SIZE + 1)
                    .lean()
                    .exec();
                const hasMore = results.length > PAGE_SIZE;
                const messages = results.slice(0, PAGE_SIZE);
                const oldest = messages[messages.length - 1];
                acknowledge(callback, {
                    ok: true,
                    messages: messages.reverse().map(serializeMessage),
                    hasMore,
                    nextCursor: hasMore && oldest
                        ? { timestamp: oldest.timestamp.toISOString(), id: String(oldest._id) }
                        : null
                });
            } catch (error) {
                console.error("Could not load messages.");
                acknowledge(callback, { ok: false, error: "Could not load chat history." });
            }
        });

        socket.on("privateMessage", async (data, callback) => {
            const requestedRecipients = Array.isArray(data?.to)
                ? data.to
                : typeof data?.to === "string" ? data.to.split(",") : [];
            if (
                requestedRecipients.length > MAX_RECIPIENTS ||
                (typeof data?.to === "string" && data.to.length > MAX_RECIPIENTS * 25)
            ) {
                return acknowledge(callback, { ok: false, error: "Select no more than 50 recipients." });
            }
            const recipientIds = [...new Set(requestedRecipients.map(normalizeObjectId))];
            const messageText = typeof data?.message === "string" ? data.message.trim() : "";
            const clientMessageId = data?.clientMessageId === undefined
                ? ""
                : typeof data.clientMessageId === "string" ? data.clientMessageId.trim() : null;
            if (
                !recipientIds.length ||
                recipientIds.length > MAX_RECIPIENTS ||
                recipientIds.some(id => !id || id === userId)
            ) {
                return acknowledge(callback, { ok: false, error: "Select valid recipients." });
            }
            if (!messageText || messageText.length > MAX_MESSAGE_LENGTH) {
                return acknowledge(callback, {
                    ok: false,
                    error: `Messages must be between 1 and ${MAX_MESSAGE_LENGTH} characters.`
                });
            }
            if (
                clientMessageId === null ||
                (data?.clientMessageId !== undefined && !clientMessageId) ||
                clientMessageId.length > 100
            ) {
                return acknowledge(callback, { ok: false, error: "Invalid message identifier." });
            }
            try {
                const existingUsers = await UserModel.find({ _id: { $in: recipientIds } })
                    .select("_id")
                    .lean()
                    .exec();
                if (existingUsers.length !== recipientIds.length) {
                    return acknowledge(callback, { ok: false, error: "A recipient was not found." });
                }
                const idempotencyKey = clientMessageId || crypto.randomUUID();
                const savedMessages = [];
                for (const recipientId of recipientIds) {
                    const query = {
                        from: userId,
                        to: recipientId,
                        clientMessageId: idempotencyKey
                    };
                    const result = await MessageModel.updateOne(
                        query,
                        {
                            $setOnInsert: {
                                from: userId,
                                to: recipientId,
                                message: messageText,
                                timestamp: new Date(),
                                status: "sent",
                                deliveredAt: null,
                                readAt: null,
                                clientMessageId: idempotencyKey
                            }
                        },
                        { upsert: true, setDefaultsOnInsert: true }
                    ).exec();
                    const savedMessage = await MessageModel.findOne(query).lean().exec();
                    if (result.upsertedCount > 0) {
                        io.to(`user:${recipientId}`).emit("privateMessage", serializeMessage(savedMessage));
                        const unreadCount = await MessageModel.countDocuments({
                            from: userId,
                            to: recipientId,
                            status: { $ne: "read" },
                            deletedAt: null
                        }).exec();
                        io.to(`user:${recipientId}`).emit("unreadCount", {
                            from: userId,
                            count: unreadCount
                        });
                        const recipientSockets = onlineUsers.get(recipientId);
                        const notificationSocketId = recipientSockets?.values().next().value;
                        if (notificationSocketId) {
                            io.to(notificationSocketId).emit("messageNotification", {
                                id: String(savedMessage._id),
                                from: userId,
                                senderName: socket.data.userName,
                                preview: messageText.slice(0, 140),
                                timestamp: savedMessage.timestamp,
                                unreadCount
                            });
                        }
                    }
                    savedMessages.push(serializeMessage(savedMessage));
                }
                acknowledge(callback, { ok: true, messages: savedMessages });
            } catch (error) {
                console.error("Message could not be sent.");
                acknowledge(callback, { ok: false, error: "Message could not be sent." });
            }
        });

        socket.on("messageDelivered", async (messageId, callback) => {
            const normalizedMessageId = normalizeObjectId(messageId);
            if (!normalizedMessageId) {
                return acknowledge(callback, { ok: false, error: "Invalid message identifier." });
            }
            try {
                const message = await MessageModel.findOneAndUpdate(
                    { _id: normalizedMessageId, to: userId, status: "sent", deletedAt: null },
                    { $set: { status: "delivered", deliveredAt: new Date() } },
                    { returnDocument: "after" }
                ).lean().exec();
                if (message) {
                    io.to(`user:${message.from}`).emit("messageStatus", {
                        id: String(message._id),
                        from: message.from,
                        to: message.to,
                        status: "delivered",
                        deliveredAt: message.deliveredAt,
                        readAt: null
                    });
                }
                acknowledge(callback, { ok: true, updated: Boolean(message) });
            } catch (error) {
                console.error("Could not update message delivery status.");
                acknowledge(callback, { ok: false, error: "Could not update delivery status." });
            }
        });

        socket.on("markConversationRead", async (data, callback) => {
            const senderId = normalizeObjectId(data?.from);
            if (!senderId || senderId === userId) {
                return acknowledge(callback, { ok: false, error: "Select a valid conversation." });
            }
            try {
                const senderExists = await UserModel.exists({ _id: senderId });
                if (!senderExists) {
                    return acknowledge(callback, { ok: false, error: "That user was not found." });
                }
                const unreadQuery = {
                    from: senderId,
                    to: userId,
                    status: { $in: ["sent", "delivered"] },
                    deletedAt: null
                };
                const unreadMessages = await MessageModel.find(unreadQuery)
                    .select("_id")
                    .lean()
                    .exec();
                if (unreadMessages.length) {
                    const readAt = new Date();
                    await MessageModel.updateMany(
                        unreadQuery,
                        { $set: { status: "read", readAt } }
                    ).exec();
                    unreadMessages.forEach(message => {
                        io.to(`user:${senderId}`).emit("messageStatus", {
                            id: String(message._id),
                            from: senderId,
                            to: userId,
                            status: "read",
                            deliveredAt: null,
                            readAt
                        });
                    });
                }
                const unreadCount = await MessageModel.countDocuments({
                    from: senderId,
                    to: userId,
                    status: { $ne: "read" },
                    deletedAt: null
                }).exec();
                io.to(`user:${userId}`).emit("unreadCount", {
                    from: senderId,
                    count: unreadCount
                });
                acknowledge(callback, {
                    ok: true,
                    markedRead: unreadMessages.length,
                    unreadCount
                });
            } catch (error) {
                console.error("Could not mark conversation as read.");
                acknowledge(callback, {
                    ok: false,
                    error: "Could not mark messages as read."
                });
            }
        });

        socket.on("disconnect", () => {
            clearTimeout(expiryTimer);
            removeSocketFromPresence(socket);
        });
    });

    return { app, io, server, onlineUsers };
}

async function startServer() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error("MONGODB_URI must be set.");
    if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32) {
        throw new Error("JWT_SECRET must be set to a random value of at least 32 bytes.");
    }
    const port = Number(process.env.PORT || 3000);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("PORT must be an integer between 1 and 65535.");
    }
    let chatServer;
    try {
        try {
            await mongoose.connect(mongoUri);
        } catch (error) {
            throw new Error("Could not connect to MongoDB. Check MONGODB_URI and database availability.");
        }
        chatServer = createChatServer();
        await new Promise((resolve, reject) => {
            chatServer.server.once("error", reject);
            chatServer.server.listen(port, resolve);
        });
        console.log(`Private chat server listening on port ${port}.`);
        return chatServer.server;
    } catch (error) {
        if (chatServer?.server.listening) {
            await new Promise(resolve => chatServer.server.close(resolve));
        }
        if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
        throw error;
    }
}

if (require.main === module) {
    startServer().catch(error => {
        const safeErrors = new Set([
            "MONGODB_URI must be set.",
            "JWT_SECRET must be set to a random value of at least 32 bytes.",
            "PORT must be an integer between 1 and 65535.",
            "JWT_EXPIRES_IN must be a valid jsonwebtoken duration.",
            "Could not connect to MongoDB. Check MONGODB_URI and database availability."
        ]);
        if (error.code === "EADDRINUSE") {
            console.error(`Server startup failed: port ${process.env.PORT || 3000} is already in use.`);
        } else if (safeErrors.has(error.message)) {
            console.error(`Server startup failed: ${error.message}`);
        } else {
            console.error("Server startup failed due to an unexpected configuration or runtime error.");
        }
        process.exitCode = 1;
    });
}

module.exports = {
    createChatServer,
    startServer,
    validateRegistration,
    serializeMessage,
    conversationQuery
};
