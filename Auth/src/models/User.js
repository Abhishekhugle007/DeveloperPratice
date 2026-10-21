const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 254
        },
        passwordHash: {
            type: String,
            required: true,
            select: false
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
