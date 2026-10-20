require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "user-service",
    endpoints: ["/health", "/users"],
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "user-service" });
});
app.use("/users", userRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON body" });
  }
  if (err.name === "ValidationError" || err.name === "CastError") {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: "A user with that email already exists" });
  }
  return res.status(500).json({ error: "Internal server error" });
});

mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/users")
  .then(() => {
    app.listen(port, () => {
      console.log(`User service listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
