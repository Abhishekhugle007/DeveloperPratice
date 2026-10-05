const http = require("http");
const express = require("express");
const app = express();
const path = require("path");
const socketio = require("socket.io");

const server = http.createServer(app);
const io = socketio(server);

io.on("connection", (socket) => {
    socket.on("sendMessage", (message) => {
        if (typeof message !== "string") {
            return;
        }

        const trimmedMessage = message.trim();
        if (trimmedMessage === "") {
            return;
        }

        socket.broadcast.emit("message", trimmedMessage);
    });
});

app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

server.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
