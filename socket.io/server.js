const http = require("http");
const express = require("express");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    socket.on("join", (userId) => {
        if (typeof userId !== "string") {
            return;
        }

        const trimmedUserId = userId.trim();

        if (!trimmedUserId) {
            return;
        }

        socket.data.userId = trimmedUserId;
        socket.join(trimmedUserId);
        console.log(`${trimmedUserId} joined`);
    });

    socket.on("privateMessage", (data) => {
        if (
            !data ||
            typeof data.to !== "string" ||
            typeof data.message !== "string"
        ) {
            return;
        }

        const to = data.to.trim();
        const message = data.message.trim();
        const from = typeof data.from === "string" ? data.from.trim() : socket.data.userId;

        if (!to || !message || message.length > 2000 || !from) {
            return;
        }

        io.to(to).emit("privateMessage", {
            from,
            message
        });
    });

    socket.on("disconnect", () => {
        console.log("Disconnected:", socket.id);
    });
});

server.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});