"use strict";

const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const express = require("express");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const http = require("node:http");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("node:path");
const { Server } = require("socket.io");
const XLSX = require("xlsx");

const User = require("./models/User");
const Message = require("./models/Message");
const constants = require("./config/constants");
const createRateLimiter = require("./utils/rateLimiter");
const validation = require("./utils/validation");
const messageUtils = require("./utils/messageUtils");
const attachmentUtils = require("./utils/attachmentUtils");
const createAuthMiddleware = require("./middleware/auth");
const errorHandler = require("./middleware/errorHandler");
const createMessageService = require("./services/message.service");
const registerAuthRoutes = require("./routes/auth.routes");
const registerUsersRoutes = require("./routes/users.routes");
const registerAttachmentsRoutes = require("./routes/attachments.routes");
const registerMessagesRoutes = require("./routes/messages.routes");
const registerAdminRoutes = require("./routes/admin.routes");
const registerSockets = require("./sockets");

function acknowledge(callback, result) {
    if (typeof callback === "function") callback(result);
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
            issuer: constants.JWT_ISSUER,
            audience: constants.JWT_AUDIENCE
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
    const auth = createAuthMiddleware({ UserModel, jwtSecret, jwtExpiresIn });
    const messageService = createMessageService({ io, MessageModel });
    const upload = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: constants.MAX_IMPORT_FILE_SIZE, files: 1 }
    }).single("file");
    const attachmentUpload = multer({
        storage: multer.memoryStorage(),
        limits: {
            fileSize: constants.MAX_ATTACHMENT_SIZE,
            files: 1,
            fields: 1,
            parts: 2
        },
        fileFilter(req, file, callback) {
            const extension = path.extname(file.originalname || "").toLowerCase();
            const supported = constants.ATTACHMENT_TYPES[extension];
            if (!supported || !supported.mimeTypes.includes(file.mimetype)) {
                const error = new Error(
                    "Unsupported attachment type. Choose a supported document, image, or video."
                );
                error.status = 415;
                return callback(error);
            }
            callback(null, true);
        }
    }).single("file");

    const dependencies = {
        app,
        io,
        server,
        onlineUsers,
        UserModel,
        MessageModel,
        mongoose,
        authRateLimit,
        privateAttachmentsDir,
        upload,
        attachmentUpload,
        createAccessToken: auth.createAccessToken,
        verifyAccessToken: auth.verifyAccessToken,
        loadAuthenticatedUser: auth.loadAuthenticatedUser,
        authenticateHttp: auth.authenticateHttp,
        requireAdmin: auth.requireAdmin,
        broadcastMessageMutation: messageService.broadcastMessageMutation,
        ...constants,
        ...validation,
        ...messageUtils,
        ...attachmentUtils,
        bcrypt,
        crypto,
        fs,
        fsp,
        path,
        XLSX,
        multer,
        acknowledge
    };

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

    registerAuthRoutes(dependencies);
    registerUsersRoutes(dependencies);
    registerAttachmentsRoutes(dependencies);
    registerMessagesRoutes(dependencies);
    registerAdminRoutes(dependencies);

    app.use(express.static(path.join(__dirname, "public"), { index: "index.html" }));
    app.use("/api", (req, res) => {
        res.status(404).json({
            ok: false,
            error: `API endpoint not found: ${req.method} ${req.baseUrl}${req.path}.`
        });
    });
    app.use(errorHandler);

    registerSockets(dependencies);
    return { app, io, server, onlineUsers };
}

module.exports = { createChatServer };
