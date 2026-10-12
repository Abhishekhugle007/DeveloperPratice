const express = require("express");
const http = require("http");
const path = require("path");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;
const DB_URL = "mongodb://localhost:27017/socket_chat";

const PAGE_SIZE = 50;
const MAX_USER_ID_LENGTH = 64;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_RECIPIENTS = 50;
const messageSchema = new mongoose.Schema({

    from: { type: String, required: true, maxlength: MAX_USER_ID_LENGTH },
    to: { type: String, required: true, maxlength: MAX_USER_ID_LENGTH },
    message: { type: String, required: true, maxlength: MAX_MESSAGE_LENGTH },
    timestamp: { type: Date, default: Date.now }
});
messageSchema.index({ from: 1, to: 1, timestamp: -1, _id: -1 });
const Message = mongoose.model("Message", messageSchema);
app.use(express.static(path.join(__dirname, "public")));
function acknowledge(callback, result) {
    if (typeof callback === "function") callback(result);
}
function normalizeUserId(value) {
    if (typeof value !== "string") return null;
    const userId = value.trim();
    return userId && userId.length <= MAX_USER_ID_LENGTH ? userId : null;
}
function conversationQuery(user, receiver) {
    return {
        $or: [
            { from: user, to: receiver },
            { from: receiver, to: user }
        ]
    };
}
function serializeMessage(message) {
    return {
        id: String(message._id),
        from: message.from,
        to: message.to,
        message: message.message,
        timestamp: message.timestamp
    };
}
io.on("connection", (socket) => {
    socket.on("join", (userId, callback) => {
        userId = normalizeUserId(userId);
        if (!userId) {
            return acknowledge(callback, {
                ok: false,
                error: "Enter a valid user ID (maximum 64 characters)."
            });
        }
        if (socket.data.userId) {
            socket.leave(`user:${socket.data.userId}`);
        }
        socket.data.userId = userId;
        socket.join(`user:${userId}`);
        acknowledge(callback, { ok: true, userId });
    });
    socket.on("leave", (callback) => {
        const userId = socket.data.userId;
        if (userId) {
            socket.leave(`user:${userId}`);
            delete socket.data.userId;
        }
        acknowledge(callback, { ok: true });
    });

    socket.on("fetchMessages", async (data, callback) => {
        const user = socket.data.userId;
        const receiver = normalizeUserId(data?.to);

        if (!user) {
            return acknowledge(callback, {
                ok: false,
                error: "Join the chat before loading messages."
            });
        }
        if (!receiver) {
            return acknowledge(callback, {
                ok: false,
                error: "Enter a valid recipient ID."
            });
        }
        let query = conversationQuery(user, receiver);

        if (data?.before !== undefined) {
            const before = data.before;
            const timestamp = before && new Date(before.timestamp);
            const id = before?.id;

            if (
                !timestamp ||
                Number.isNaN(timestamp.getTime()) ||
                typeof id !== "string" ||
                !mongoose.Types.ObjectId.isValid(id)
            ) {
                return acknowledge(callback, {
                    ok: false,
                    error: "Invalid message history cursor."
                });
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
        try {
            const results = await Message.find(query)
                .sort({ timestamp: -1, _id: -1 })
                .limit(PAGE_SIZE + 1)
                .lean();
            const hasMore = results.length > PAGE_SIZE;
            const messages = results.slice(0, PAGE_SIZE);
            const oldest = messages[messages.length - 1];
            acknowledge(callback, {
                ok: true,
                messages: messages.reverse().map(serializeMessage),
                hasMore,
                nextCursor: hasMore && oldest
                    ? {
                        timestamp: oldest.timestamp.toISOString(),
                        id: String(oldest._id)
                    }
                    : null
            });
        } catch (error) {
            console.error("Could not load messages:", error);
            acknowledge(callback, {
                ok: false,
                error: "Could not load messages."
            });
        }
    });
    socket.on("privateMessage", async (data, callback) => {
        const from = socket.data.userId;
        const recipients = Array.isArray(data?.to)
            ? data.to
            : typeof data?.to === "string"
                ? data.to.split(",")
                : [];

        const recipientIds = [...new Set(recipients.map(normalizeUserId))];

        const message = typeof data?.message === "string"
            ? data.message.trim()
            : "";

        if (!from) {
            return acknowledge(callback, {
                ok: false,
                error: "Join the chat before sending messages."
            });
        }
        if (
            !recipientIds.length ||
            recipientIds.length > MAX_RECIPIENTS ||
            recipientIds.some(id => !id || id === from)
        ) {
            return acknowledge(callback, {
                ok: false,
                error: `Enter between 1 and ${MAX_RECIPIENTS} valid recipient IDs other than your own.`
            });
        }
        if (!message || message.length > MAX_MESSAGE_LENGTH) {
            return acknowledge(callback, {
                ok: false,
                error: `Messages must be between 1 and ${MAX_MESSAGE_LENGTH} characters.`
            });
        }
        try {
            const savedMessages = await Message.insertMany(
                recipientIds.map(to => ({ from, to, message }))
            );

            savedMessages.forEach(msg => {
                io.to(`user:${msg.to}`).emit(
                    "privateMessage",
                    serializeMessage(msg)
                );
            });

            acknowledge(callback, {
                ok: true,
                messages: savedMessages.map(serializeMessage)
            });
        } catch (error) {
            console.error("Message could not be sent:", error);

            acknowledge(callback, {
                ok: false,
                error: "Message could not be sent."
            });
        }
    });
});
mongoose.connect(DB_URL)
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    })
    .catch(error => {
        console.error("MongoDB connection failed:", error);
    });
