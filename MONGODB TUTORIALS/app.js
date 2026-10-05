import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";

//Initialize express app

const app = express();
const port = 3000;
const appDirectory = path.dirname(fileURLToPath(import.meta.url));

app.set("views", path.join(appDirectory, "views"));
app.set("view engine", "ejs");

//MongoDB connection URL and database name
const url = "mongodb://localhost:27017";
const dbName = "myFirstDB";

//Create a new MongoClient
const client = new MongoClient(url);

//MIDDLEWARE to parse JSON request bodies'
app.use(express.json());

//routes
app.get("/data", async (req, res) => {
    try {
        //Connect to the MongoDB server
        await client.connect();
        console.log("Connected successfully to MongoDB server");

        const db = client.db(dbName);
        const collection = db.collection("students");

        //fetch data from the collection
        const data = await collection.find({}).toArray();
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