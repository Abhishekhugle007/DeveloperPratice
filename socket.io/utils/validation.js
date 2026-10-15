"use strict";

const {EMAIL_PATTERN,OBJECT_ID_PATTERN}=require("../config/constants");

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

module.exports={normalizeEmail,normalizeObjectId,validateRegistration};
