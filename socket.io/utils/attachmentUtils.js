"use strict";

const path=require("node:path");
const yauzl=require("yauzl");
const {ATTACHMENT_TYPES}=require("../config/constants");

function validateAttachmentHeader(file) {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const type = ATTACHMENT_TYPES[extension];
    if (!type || !type.mimeTypes.includes(file.mimetype)) {
        return { error: "This file extension and MIME type are not supported." };
    }
    const data = file.buffer;
    if (!Buffer.isBuffer(data) || data.length === 0) {
        return { error: "The uploaded file is empty or invalid." };
    }
    const startsWith = signature => data.length >= signature.length &&
        data.subarray(0, signature.length).equals(signature);
    const validSignatures = {
        ".pdf": () => data.subarray(0, 5).toString("ascii") === "%PDF-",
        ".doc": () => startsWith(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])),
        ".xls": () => startsWith(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])),
        ".ppt": () => startsWith(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])),
        ".jpg": () => startsWith(Buffer.from([0xff, 0xd8, 0xff])),
        ".jpeg": () => startsWith(Buffer.from([0xff, 0xd8, 0xff])),
        ".png": () => startsWith(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
        ".gif": () => ["GIF87a", "GIF89a"].includes(data.subarray(0, 6).toString("ascii")),
        ".webp": () => data.length >= 12 &&
            data.subarray(0, 4).toString("ascii") === "RIFF" &&
            data.subarray(8, 12).toString("ascii") === "WEBP",
        ".mp4": () => data.length >= 12 && data.subarray(4, 8).toString("ascii") === "ftyp",
        ".mov": () => data.length >= 12 && data.subarray(4, 8).toString("ascii") === "ftyp",
        ".webm": () => startsWith(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])),
        ".txt": () => !data.includes(0),
        ".csv": () => !data.includes(0)
    };
    if (type.archiveEntry) return { type, extension };
    if (!validSignatures[extension]?.()) {
        return { error: "The file contents do not match the selected file type." };
    }
    return { type, extension };
}

function hasRequiredOfficeEntry(buffer, expectedEntry) {
    return new Promise((resolve, reject) => {
        yauzl.fromBuffer(buffer, { lazyEntries: true, autoClose: true }, (error, zipFile) => {
            if (error) return reject(error);
            let entryCount = 0;
            let hasContentTypes = false;
            let hasExpectedEntry = false;
            zipFile.on("entry", entry => {
                entryCount += 1;
                if (entryCount > 2048) {
                    zipFile.close();
                    return reject(new Error("Office archive contains too many entries."));
                }
                if (entry.fileName === "[Content_Types].xml") hasContentTypes = true;
                if (entry.fileName === expectedEntry) hasExpectedEntry = true;
                zipFile.readEntry();
            });
            zipFile.on("end", () => resolve(hasContentTypes && hasExpectedEntry));
            zipFile.on("error", reject);
            zipFile.readEntry();
        });
    });
}

function sanitizeOriginalFilename(filename) {
    return String(filename || "")
        .split(/[\\/]/)
        .pop()
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .trim()
        .slice(0, 255);
}

function attachmentStorageName(message) {
    const storageName = message?.attachment?.storageName;
    return typeof storageName === "string" &&
        /^[a-f\d-]{36}\.[a-z\d]{2,5}$/i.test(storageName) &&
        path.basename(storageName) === storageName
        ? storageName
        : null;
}

module.exports={validateAttachmentHeader,hasRequiredOfficeEntry,sanitizeOriginalFilename,attachmentStorageName};
