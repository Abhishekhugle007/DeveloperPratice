# Private Chat

A small Express, Socket.IO, MongoDB, and vanilla JavaScript private chat application. Account identities come from verified JWTs; the browser cannot choose a sender ID.

## Requirements

- Node.js 20 or newer
- MongoDB 6.0 or newer (a local service or hosted MongoDB URI)

## Setup

From this directory:

```powershell
npm install
Copy-Item .env.example .env
```

Edit `.env` and set:

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection URI |
| `JWT_SECRET` | Yes | Random secret of at least 32 bytes; do not commit it |
| `PORT` | No | HTTP port (default `3000`) |
| `JWT_EXPIRES_IN` | No | `jsonwebtoken` expiry value (default `8h`) |

Create a strong secret rather than using the example value. For example, in PowerShell:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```

Start MongoDB, then run:

```powershell
npm start
```

The HTTP server starts only after a successful MongoDB connection. Visit `http://localhost:3000`, register an account, and sign in. Sign-out invalidates the current account's existing tokens, including its active chat sockets.

## Administrator actions

New registrations receive the regular-user role. To grant the administrator role to an existing account, set `MONGODB_URI` in `.env` and run:

```powershell
npm run admin:set -- admin@example.com
```

Administrators can download an import template and import `.xlsx` files (maximum 2 MB and 1,000 rows) with `name`, `email`, and `password` columns, or export the safe user fields `name`, `email`, and registration date. Exports intentionally omit passwords and cannot be imported unchanged; fill in a password for each new account first. Duplicate emails are skipped and explained in the import summary. Import passwords are hashed before storage. The upload is kept in memory and never placed under `public/`.

## Private file and video sharing

In a selected conversation, use **Attach** to upload PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT/CSV, JPG/JPEG, PNG, GIF, WebP, MP4, MOV, or WebM files up to 25 MB. The server checks the extension and declared MIME type, then checks file signatures (and required ZIP entries for Office Open XML documents). Multer keeps the bounded upload in memory during validation; validated file bytes are written to `private_uploads/` (or the directory configured by `ATTACHMENTS_DIR`), outside `public/`. MongoDB stores attachment metadata and a random storage name, not file contents.

Attachment messages are saved like other private messages and delivered to an online recipient by the authenticated Socket.IO `privateMessage` event; offline recipients see them in their conversation history later. The metadata URL `/api/attachments/:messageId` requires a valid JWT and only serves the file if the requesting account is that message's sender or recipient. Image and video previews and downloads use authenticated fetch requests. Back up the MongoDB database and private attachment directory together; removing stored files leaves their message metadata without downloadable content.

## Message and file management

Use the three-dot menu on a message to edit your own text, delete your own message/file, forward a message to another registered person, or copy text. Edits persist with an edited timestamp and appear as **Edited**. Deletions are soft-deleted in conversation history; attached bytes are moved out of reach and removed from private storage. Forwarding copies text or makes a separate private stored copy for attachments, so deleting one shared copy does not delete the other. Message edit/delete and attachment forwarding APIs verify conversation membership and ownership on the server.

The **Shared files** view lists files from conversations the signed-in account participates in, with type, size, upload time, uploader, recipient, preview/download actions, and deletion controls only for files the current account uploaded. File picker uploads remain available in a conversation, and files can also be dropped onto the message history. `GET /api/files` is authenticated; attachment deletion uses the authenticated message-delete endpoint and removes both the attachment metadata and stored bytes.

## Tests

```powershell
npm test
```

The integration tests use `mongodb-memory-server` and Socket.IO clients, so the test database does not need a running local MongoDB service. The first test run may download a MongoDB test binary.

## Chat events and data protection

- Socket.IO authenticates the handshake using `auth.token`; its user ID is taken only from the verified token.
- `fetchMessages`, `privateMessage`, `messageDelivered`, and `markConversationRead` are authenticated server events. Attachment uploads use authenticated `POST /api/attachments`; file retrieval uses authenticated `GET /api/attachments/:messageId` and checks conversation participation. A successful history render in an open conversation confirms read; merely receiving or delivering a message does not. Message states progress independently through `sent`, `delivered`, and `read`.
- New messages in either direction are persisted before the recipient receives `privateMessage`, a per-user `unreadCount` update, and one `messageNotification` event per active user session; the notification contains sender name and a short preview and is never broadcast to unrelated users. Offline unread counts are calculated from MongoDB and included in `/api/users` after login/reconnect. Socket notifications go to only one of the recipient's connected tabs to avoid duplicate toast/browser notifications across tabs.
- The UI shows clickable in-app notification toasts and per-user unread badges. Browser notification permission is requested only from the explicit “Enable browser notifications” button; system notifications are used only when permission is granted and the page is hidden or unfocused. Notifications are not delivered when the browser is closed.
- The registered-user API returns only user ID, name, online status, and unread count. Presence remains online while any of a user's tabs is connected.
- HTTP auth errors use `{ "ok": false, "error": "..." }`. Registration and login share an in-memory limit of 20 attempts per IP per 15 minutes.

## Spreadsheet dependency advisory

`npm audit --omit=dev` currently reports high-severity prototype-pollution and ReDoS advisories for the requested `xlsx` package version, with no npm fix available. Imports are admin-only and capped at 2 MB and 1,000 rows, but these limits are mitigations rather than a substitute for a patched parser. Review the SheetJS advisory before exposing imports to untrusted administrators and update the dependency when a maintained fixed release is available.

## Existing message history

Existing messages use string-valued `from` and `to` fields and are not deleted or rewritten by this update. New authenticated conversations use registered MongoDB user IDs in those fields. Arbitrary IDs formerly typed into the chat cannot be safely equated to accounts based on email, name, or message text. The application therefore does not automatically expose those records to newly registered accounts.

To migrate a known legacy ID, first verify the mapping against an authoritative roster or other trusted source, back up the database, and then update the `messages` collection's matching `from` and/or `to` values to the selected account's MongoDB `_id` string. For example, after replacing the placeholders and confirming the mapping:

```javascript
db.messages.updateMany({ from: "verified-old-id" }, { $set: { from: "verified-user-object-id" } });
db.messages.updateMany({ to: "verified-old-id" }, { $set: { to: "verified-user-object-id" } });
```

Do not run these updates when an old ID cannot be mapped unambiguously; retain the records and handle them as an operator-reviewed migration.
