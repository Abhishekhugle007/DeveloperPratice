import express from "express";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = 3000;

const appDirectory = path.dirname(
    fileURLToPath(import.meta.url)
);

app.set("views", path.join(appDirectory, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(appDirectory, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Schema
const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    course: String
});

// Model
const Student = mongoose.model("Student", studentSchema);

// Routes 
app.get("/students", async (req, res) => {
    try {
        const students = await Student.find({});
        res.json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Unable to fetch students" });
    }
});

// Start server + MongoDB connection
async function startServer() {
    try {
        await mongoose.connect("mongodb://localhost:27017/myFirstDB");
        const students = await Student.find({});
        console.log("Students in the database:", students);
        console.log("Connected to MongoDB");

        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });

    } catch (error) {
        console.error("MongoDB connection failed:", error);
    }
}

startServer();
