import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const PORT = 3004;
const publicPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve HTML/CSS/JS from public folder
app.use(express.static(publicPath));

// JSON API
app.post("/api/user", (req, res) => {
    console.log("JSON Body:", req.body);

    res.json({
        msg: "JSON data received",
        data: req.body
    });
});

// HTML Form
app.post("/register", (req, res) => {
    console.log("Body:", req.body);

    console.log("Username:", req.body.USERNAME);
    console.log("Email:", req.body.email);

    res.send("Registration successful");
});

// GET route
app.get("/", (req, res) => {
    res.send("Hello from the Express Server!");
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
