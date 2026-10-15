"use strict";

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

function conversationQuery(userId, recipientId) {
    return {
        $or: [
            { from: userId, to: recipientId },
            { from: recipientId, to: userId }
        ]
    };
}

module.exports={safeUser,serializeMessage,conversationQuery};
