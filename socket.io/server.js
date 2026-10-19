require("dotenv").config();

const mongoose = require("mongoose");
const { connectDatabase, disconnectDatabase } = require("./config/database");
const { createChatServer } = require("./app");
const { validateRegistration } = require("./utils/validation");
const { serializeMessage, conversationQuery } = require("./utils/messageUtils");
async function startServer() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error("MONGODB_URI must be set.");
    if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32) {
        throw new Error("JWT_SECRET must be set to a random value of at least 32 bytes.");
    }
    const port = Number(process.env.PORT || 3000);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("PORT must be an integer between 1 and 65535.");
    }
    let chatServer;
    try {
        await connectDatabase(mongoUri);
        chatServer = createChatServer();
        await new Promise((resolve, reject) => {
            chatServer.server.once("error", reject);
            chatServer.server.listen(port, resolve);
        });
        console.log(`Private chat server listening on port ${port}.`);
        return chatServer.server;
    } catch (error) {
        if (chatServer?.server.listening) {
            await new Promise(resolve => chatServer.server.close(resolve));
        }
        if (mongoose.connection.readyState !== 0) await disconnectDatabase();
        throw error;
    }
}
if (require.main === module) {
    startServer().catch(error => {
        const safeErrors = new Set([
            "MONGODB_URI must be set.",
            "JWT_SECRET must be set to a random value of at least 32 bytes.",
            "PORT must be an integer between 1 and 65535.",
            "JWT_EXPIRES_IN must be a valid jsonwebtoken duration.",
            "Could not connect to MongoDB. Check MONGODB_URI and database availability."
        ]);
        if (error.code === "EADDRINUSE") {
            console.error(`Server startup failed: port ${process.env.PORT || 3000} is already in use.`);
        } else if (safeErrors.has(error.message)) {
            console.error(`Server startup failed: ${error.message}`);
        } else {
            console.error("Server startup failed due to an unexpected configuration or runtime error.");
        }
        process.exitCode = 1;
    });
}
module.exports = {
    createChatServer,
    startServer,
    validateRegistration,
    serializeMessage,
    conversationQuery
};
