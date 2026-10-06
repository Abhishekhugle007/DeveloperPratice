import express from "express";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";


const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.redirect("/api/users");
});

//user routes
app.use("/api", userRoutes);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start server because MongoDB connection failed:", error);
    process.exitCode = 1;
  }
}

startServer();
