"use strict";

function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 20 } = {}) {
    const attempts = new Map();
    return (req, res, next) => {
        const now = Date.now();
        const key = req.ip;
        let entry = attempts.get(key);
        if (!entry || now - entry.startedAt >= windowMs) {
            entry = { startedAt: now, count: 0 };
            attempts.set(key, entry);
        }
        entry.count += 1;
        if (entry.count > max) {
            return res.status(429).json({
                ok: false,
                error: "Too many attempts. Please try again later."
            });
        }
        if (attempts.size > 10000) {
            for (const [ip, item] of attempts) {
                if (now - item.startedAt >= windowMs) attempts.delete(ip);
            }
        }
        next();
    };
}

module.exports=createRateLimiter;
