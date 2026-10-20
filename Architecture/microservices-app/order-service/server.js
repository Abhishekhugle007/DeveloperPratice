require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const orderRoutes = require("./routes/orderRoutes");

const app = express();
const port = Number(process.env.PORT) || 3002;

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "order-service",
    endpoints: ["/health", "/orders"],
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "order-service" });
});
app.use("/orders", orderRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON body" });
  }
  if (err.name === "ValidationError" || err.name === "CastError") {
    return res.status(400).json({ error: err.message });
  }
  return res.status(500).json({ error: "Internal server error" });
});

mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/orders")
  .then(() => {
    app.listen(port, () => {
      console.log(`Order service listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
