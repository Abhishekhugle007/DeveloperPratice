"use strict";
function registerRoutes(dependencies){
 const {app,UserModel,MessageModel,onlineUsers,io,crypto,fs,fsp,path,attachmentUpload,normalizeObjectId,sanitizeOriginalFilename,validateAttachmentHeader,hasRequiredOfficeEntry,privateAttachmentsDir,serializeMessage,authenticateHttp}=dependencies;

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

}
module.exports=registerRoutes;
