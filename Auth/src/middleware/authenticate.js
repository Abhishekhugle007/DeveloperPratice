const jwt = require("jsonwebtoken");
const User = require("../models/User");

const cookieName = "todo_auth";

function getTokenSecret() {
    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
        throw new Error("JWT_SECRET must contain at least 32 characters.");
    }

    return secret;
}

async function authenticate(request, response, next) {
    const token = request.cookies[cookieName];

    if (!token) {
        return response.status(401).json({ message: "Authentication is required." });
    }

    try {
        const payload = jwt.verify(token, getTokenSecret(), {
            algorithms: ["HS256"],
            issuer: "todo-auth-api",
            audience: "todo-app"
        });

        const user = await User.findById(payload.sub).select("_id email role");

        if (!user) {
            response.clearCookie(cookieName, { path: "/" });
            return response.status(401).json({ message: "Authentication is required." });
        }

        request.user = user;
        return next();
    } catch (error) {
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            response.clearCookie(cookieName, { path: "/" });
            return response.status(401).json({ message: "Authentication is required." });
        }

        return next(error);
    }
}

module.exports = { authenticate, cookieName, getTokenSecret };
