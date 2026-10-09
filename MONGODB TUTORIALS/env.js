import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const App_NAME = process.env.APP_NAME || "My App";

app.get("/", (req, res) => {
    res.send(`
        <h1>Welcome to ${App_NAME}</h1>
        <p>Server is running on port ${port}</p>
    `);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});