import express from "express";
import morgan from "morgan";
import cors from "cors";
import rateLimit from "express-rate-limit";

const app = express();
const PORT = 3003;

const limiter = rateLimit({
    windowMs: 5 * 1000, // 5 seconds
    max: 5, // 5 requests per IP
    message: "Too many requests from this IP. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.use("/api", limiter);
app.use(morgan("dev"));
app.use(cors());

// Routes
app.get("/", (req, res) => {
    res.send("Hello 3rd party middleware!");
});

app.get("/api/data", (req, res) => {
    res.json({
        data: "Some protected data"
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
