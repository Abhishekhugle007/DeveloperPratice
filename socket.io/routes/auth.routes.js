"use strict";
function registerRoutes(dependencies){
 const {app,authRateLimit,validateRegistration,normalizeEmail,EMAIL_PATTERN,UserModel,onlineUsers,io,bcrypt,BCRYPT_ROUNDS,safeUser,createAccessToken,authenticateHttp}=dependencies;

    app.post("/api/auth/register", authRateLimit, async (req, res) => {
        const validation = validateRegistration(req.body || {});
        if (validation.error) {
            return res.status(400).json({ ok: false, error: validation.error });
        }
        try {
            const { name, email, password } = validation.value;
            const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
            const user = await UserModel.create({ name, email, password: passwordHash });
            return res.status(201).json({
                ok: true,
                token: createAccessToken(user),
                user: safeUser(user)
            });
        } catch (error) {
            if (error && error.code === 11000) {
                return res.status(409).json({ ok: false, error: "That email is already registered." });
            }
            console.error("Registration failed.");
            return res.status(500).json({ ok: false, error: "Could not create the account." });
        }
    });

    app.post("/api/auth/login", authRateLimit, async (req, res) => {
        const email = normalizeEmail(req.body?.email);
        const password = req.body?.password;
        if (
            !email ||
            email.length > 254 ||
            !EMAIL_PATTERN.test(email) ||
            typeof password !== "string" ||
            password.length === 0 ||
            Buffer.byteLength(password, "utf8") > 72
        ) {
            return res.status(400).json({ ok: false, error: "Enter a valid email and password." });
        }
        try {
            const user = await UserModel.findOne({ email }).select("+password +tokenVersion").exec();
            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({ ok: false, error: "Email or password is incorrect." });
            }
            return res.json({
                ok: true,
                token: createAccessToken(user),
                user: safeUser(user)
            });
        } catch (error) {
            console.error("Login failed.");
            return res.status(500).json({ ok: false, error: "Could not sign in." });
        }
    });

    app.get("/api/auth/me", authenticateHttp, async (req, res) => {
        try {
            const user = await UserModel.findById(req.user.id).exec();
            if (!user) return res.status(401).json({ ok: false, error: "Account no longer exists." });
            res.json({ ok: true, user: safeUser(user) });
        } catch (error) {
            console.error("Could not load account.");
            res.status(500).json({ ok: false, error: "Could not load your account." });
        }
    });

    app.post("/api/auth/logout", authenticateHttp, async (req, res) => {
        try {
            await UserModel.findByIdAndUpdate(req.user.id, { $inc: { tokenVersion: 1 } }).exec();
            const sockets = onlineUsers.get(req.user.id);
            if (sockets) {
                for (const socketId of sockets) {
                    const socket = io.sockets.sockets.get(socketId);
                    if (socket) {
                        socket.emit("authError", { error: "You have been signed out." });
                        socket.disconnect(true);
                    }
                }
            }
            res.json({ ok: true });
        } catch (error) {
            console.error("Logout failed.");
            res.status(500).json({ ok: false, error: "Could not sign out." });
        }
    });

}
module.exports=registerRoutes;
