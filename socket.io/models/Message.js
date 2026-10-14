const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
    {
        originalFilename: { type: String, required: true, maxlength: 255 },
        storageName: { type: String, required: true, maxlength: 80 },
        mimeType: { type: String, required: true, maxlength: 100 },
        fileSize: { type: Number, required: true, min: 1 },
        senderId: { type: String, required: true, maxlength: 64 },
        recipientId: { type: String, required: true, maxlength: 64 },
        timestamp: { type: Date, required: true }
    },
    { _id: false }
);

const messageSchema = new mongoose.Schema({
    from: { type: String, required: true, maxlength: 64 },
    to: { type: String, required: true, maxlength: 64 },
    message: { type: String, default: "", maxlength: 2000 },
    attachment: { type: attachmentSchema, default: undefined },
    timestamp: { type: Date, default: Date.now },
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    forwardedFrom: { type: String, maxlength: 64 },
    status: {
        type: String,
        enum: ["sent", "delivered", "read"],
        default: "sent"
    },
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
    clientMessageId: { type: String, maxlength: 100 }
});

messageSchema.pre("validate", function validateTextOrAttachment() {
    if (!this.message?.trim() && !this.attachment) {
        this.invalidate("message", "A message or attachment is required.");
    }
});

messageSchema.index({ from: 1, to: 1, timestamp: -1, _id: -1 });
messageSchema.index({ to: 1, from: 1, timestamp: -1, _id: -1 });
messageSchema.index({ to: 1, status: 1, from: 1 });
messageSchema.index(
    { from: 1, to: 1, clientMessageId: 1 },
    {
        unique: true,
        partialFilterExpression: { clientMessageId: { $type: "string" } }
    }
);

module.exports = mongoose.models.Message || mongoose.model("Message", messageSchema);
