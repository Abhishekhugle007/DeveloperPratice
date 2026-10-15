"use strict";

const PAGE_SIZE = 50;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_RECIPIENTS = 50;
const MAX_IMPORT_FILE_SIZE = 2 * 1024 * 1024;
const MAX_IMPORT_ROWS = 1000;
const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024;
const BCRYPT_ROUNDS = 12;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
const JWT_ISSUER = "private-chat";
const JWT_AUDIENCE = "private-chat";
const ATTACHMENT_TYPES = Object.freeze({
    ".pdf": { mimeTypes: ["application/pdf"], kind: "document" },
    ".doc": { mimeTypes: ["application/msword"], kind: "document" },
    ".docx": {
        mimeTypes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        kind: "document",
        archiveEntry: "word/document.xml"
    },
    ".xls": { mimeTypes: ["application/vnd.ms-excel"], kind: "document" },
    ".xlsx": {
        mimeTypes: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
        kind: "document",
        archiveEntry: "xl/workbook.xml"
    },
    ".ppt": { mimeTypes: ["application/vnd.ms-powerpoint"], kind: "document" },
    ".pptx": {
        mimeTypes: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
        kind: "document",
        archiveEntry: "ppt/presentation.xml"
    },
    ".txt": { mimeTypes: ["text/plain"], kind: "document" },
    ".csv": { mimeTypes: ["text/csv", "application/vnd.ms-excel"], kind: "document" },
    ".jpg": { mimeTypes: ["image/jpeg"], kind: "image" },
    ".jpeg": { mimeTypes: ["image/jpeg"], kind: "image" },
    ".png": { mimeTypes: ["image/png"], kind: "image" },
    ".gif": { mimeTypes: ["image/gif"], kind: "image" },
    ".webp": { mimeTypes: ["image/webp"], kind: "image" },
    ".mp4": { mimeTypes: ["video/mp4"], kind: "video" },
    ".mov": { mimeTypes: ["video/quicktime"], kind: "video" },
    ".webm": { mimeTypes: ["video/webm"], kind: "video" }
});

module.exports={PAGE_SIZE,MAX_MESSAGE_LENGTH,MAX_RECIPIENTS,MAX_IMPORT_FILE_SIZE,MAX_IMPORT_ROWS,MAX_ATTACHMENT_SIZE,BCRYPT_ROUNDS,EMAIL_PATTERN,OBJECT_ID_PATTERN,JWT_ISSUER,JWT_AUDIENCE,ATTACHMENT_TYPES};
