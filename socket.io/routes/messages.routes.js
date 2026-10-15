"use strict";
function registerRoutes(dependencies){
 const {app,UserModel,MessageModel,onlineUsers,io,crypto,fs,fsp,path,normalizeObjectId,privateAttachmentsDir,MAX_MESSAGE_LENGTH,serializeMessage,authenticateHttp,broadcastMessageMutation,attachmentStorageName}=dependencies;

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

}
module.exports=registerRoutes;
