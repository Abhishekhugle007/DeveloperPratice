const express = require("express");
const path = require("node:path");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message: "Too many authentication attempts. Try again later." }
});

app.get("/api/health", (request, response) => {
    response.json({ status: "ok" });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/admin", adminRoutes);

app.use((error, request, response, next) => {
    if (response.headersSent) {
        return next(error);
    }

    if (error.type === "entity.parse.failed") {
        return response.status(400).json({ message: "Request body must be valid JSON." });
    }

    console.error("Unhandled API error:", error);
    return response.status(500).json({ message: "An unexpected server error occurred." });
});

module.exports = app;
