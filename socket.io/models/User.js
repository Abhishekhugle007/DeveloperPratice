const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 50 },
        email: {type: String,required: true,trim: true,lowercase: true,unique: true,maxlength: 254},
        password: { type: String, required: true, select: false },
        role: { type: String, enum: ["user", "admin"], default: "user" },
        tokenVersion: { type: Number, default: 0, select: false }
    },
    { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
