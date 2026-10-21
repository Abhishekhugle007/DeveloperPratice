const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { cookieName, getTokenSecret } = require("../middleware/authenticate");

const tokenLifetimeMs = 15 * 60 * 1000;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setAuthCookie(response, userId) {
    const token = jwt.sign({}, getTokenSecret(), {
        algorithm: "HS256",
        subject: userId.toString(),
        issuer: "todo-auth-api",
        audience: "todo-app",
        expiresIn: "15m"
    });

    response.cookie(cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: tokenLifetimeMs
    });
}

function publicUser(user) {
    return {
        id: user._id.toString(),
        email: user.email,
        role: user.role
    };
}

async function register(request, response, next) {
    const body = request.body && typeof request.body === "object" ? request.body : {};
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = body.password;

    if (!emailPattern.test(email) || email.length > 254) {
        return response.status(400).json({ message: "Enter a valid email address." });
    }

    if (typeof password !== "string" || password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
        return response.status(400).json({ message: "Password must be at least 8 characters and no more than 72 UTF-8 bytes." });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({ email, passwordHash });
        setAuthCookie(response, user._id);
        return response.status(201).json({ user: publicUser(user) });
    } catch (error) {
        if (error.code === 11000) {
            return response.status(409).json({ message: "An account with that email already exists." });
        }

        if (error.name === "ValidationError") {
            return response.status(400).json({ message: "Account details are invalid." });
        }

        return next(error);
    }
}

async function login(request, response, next) {
    const body = request.body && typeof request.body === "object" ? request.body : {};
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = body.password;

    if (!email || typeof password !== "string") {
        return response.status(400).json({ message: "Email and password are required." });
    }

    try {
        const user = await User.findOne({ email }).select("+passwordHash");
        const passwordMatches = user && await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatches) {
            return response.status(401).json({ message: "Invalid email or password." });
        }

        setAuthCookie(response, user._id);
        return response.json({ user: publicUser(user) });
    } catch (error) {
        return next(error);
    }
}

function logout(request, response) {
    response.clearCookie(cookieName, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/"
    });
    return response.status(204).end();
}

function currentUser(request, response) {
    return response.json({ user: publicUser(request.user) });
}

module.exports = { register, login, logout, currentUser };
