import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient, ObjectId } from "mongodb";

//Initialize express app

const app = express();
const port = 3000;
const appDirectory = path.dirname(fileURLToPath(import.meta.url));

app.set("views", path.join(appDirectory, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(appDirectory, "public")));

// middlEware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//MongoDB connection URL and database name
const url = "mongodb://localhost:27017";
const dbName = "myFirstDB";

//Create a new MongoClient
const client = new MongoClient(url);
let db;

async function connectToMongoDB() {
    await client.connect();
    console.log("Connected successfully to MongoDB server");
    db = client.db(dbName);
}

app.get("/students", async (req, res) => {
    await connectToMongoDB();
    const data = await db.collection("students").find({}).toArray();
    res.json(data);
});

app.post("/add-student", async (req, res) => {
    await connectToMongoDB();
    const newStudent = req.body;
    const result = await db.collection("students").insertOne(newStudent);
    res.json({ message: "Student added successfully", studentId: result.insertedId });
});

app.patch("/update-student/:id", async (req, res) => {
    const studentId = req.params.id;
    const updatedData = req.body;

    if (!ObjectId.isValid(studentId)) {
        return res.status(400).json({ error: "Invalid student ID" });
    }

    if (!updatedData || typeof updatedData !== "object" || Array.isArray(updatedData) ||
        Object.keys(updatedData).length === 0) {
        return res.status(400).json({ error: "Request body cannot be empty" });
    }

    try {
        await connectToMongoDB();
        const result = await db.collection("students").updateOne(
            { _id: new ObjectId(studentId) },
            { $set: updatedData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Student not found" });
        }

        res.json({ message: "Student updated successfully", modifiedCount: result.modifiedCount });
    } catch (error) {
        console.error("Error updating student:", error);
        res.status(500).json({ error: "Unable to update student." });
    }
});



app.delete("/delete-student/:id", async (req, res) => {
    const studentId = req.params.id;

    //step-1 : validate the studentId
    if (!ObjectId.isValid(studentId)) {
        return res.status(400).json({ error: "Invalid student ID" });
    }   

    const result = await db.collection("students").deleteOne({ _id: new ObjectId(studentId) });
    if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Student not found" });
    }
    res.json({ message: "Student deleted successfully" });
});

//routes
app.get("/data", async (req, res) => {
    try {
        //Connect to the MongoDB server
        await client.connect();
        console.log("Connected successfully to MongoDB server");

        const db = client.db(dbName);
        const collection = db.collection("students");

        //fetch data from the collection
        const data = await collection.find({ age: { $gt: 24 } }).toArray();
        res.render("index", { students: data });
    }catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({error: "Internal Server Error"});
    }
});

//start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});