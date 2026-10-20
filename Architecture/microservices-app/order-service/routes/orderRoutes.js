const express = require("express");
const Order = require("../models/Order");

const router = express.Router();

router.post("/", async (req, res) => {
  const order = await Order.create(req.body);
  res.status(201).json(order);
});

router.get("/", async (req, res) => {
  const filter = req.query.userId ? { userId: req.query.userId } : {};
  const orders = await Order.find(filter).sort({ createdAt: -1 });
  res.json(orders);
});

router.get("/:id", async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  return res.json(order);
});

router.patch("/:id/status", async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true },
  );
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  return res.json(order);
});

router.delete("/:id", async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  return res.status(204).end();
});

module.exports = router;
