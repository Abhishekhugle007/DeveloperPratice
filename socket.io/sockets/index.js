"use strict";
const {removeSocketFromPresence}=require("./presence");
function registerSockets(dependencies){
 const {io,onlineUsers,loadAuthenticatedUser,UserModel,MessageModel,mongoose,normalizeObjectId,serializeMessage,conversationQuery,PAGE_SIZE,MAX_MESSAGE_LENGTH,MAX_RECIPIENTS,acknowledge}=dependencies;
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
            removeSocketFromPresence(io, onlineUsers, socket);
        });
    });

}
module.exports=registerSockets;
