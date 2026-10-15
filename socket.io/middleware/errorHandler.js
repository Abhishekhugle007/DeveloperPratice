"use strict";
const multer=require("multer");

function errorHandler(error, req, res, next) {
        if (res.headersSent) return next(error);
        if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
            const maxSize = req.path === "/api/attachments" ? "25 MB" : "2 MB";
            return res.status(413).json({ ok: false, error: `The upload must be ${maxSize} or smaller.` });
        }
        if (error instanceof multer.MulterError) {
            return res.status(400).json({ ok: false, error: "The upload request is invalid." });
        }
        if (error.status === 415) {
            return res.status(415).json({ ok: false, error: error.message });
        }
        if (error.type === "entity.too.large") {
            return res.status(413).json({ ok: false, error: "The request body is too large." });
        }
        if (error.type === "entity.parse.failed") {
            return res.status(400).json({ ok: false, error: "The request body must contain valid JSON." });
        }
        console.error("Request failed.");
        res.status(500).json({ ok: false, error: "An unexpected server error occurred." });
    }
module.exports=errorHandler;
