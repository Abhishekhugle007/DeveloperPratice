require("dotenv").config();

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const port = Number(process.env.PORT) || 3000;
const userServiceUrl = process.env.USER_SERVICE_URL || "http://localhost:3001";
const orderServiceUrl = process.env.ORDER_SERVICE_URL || "http://localhost:3002";

app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "api-gateway",
    endpoints: ["/health", "/api/users", "/api/orders"],
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "api-gateway" });
});

app.use(
  createProxyMiddleware({
    pathFilter: ["/api/users", "/api/users/**"],
    target: userServiceUrl,
    changeOrigin: true,
    pathRewrite: (path, req) => req.originalUrl.replace(/^\/api\/users/, "/users"),
  }),
);

app.use(
  createProxyMiddleware({
    pathFilter: ["/api/orders", "/api/orders/**"],
    target: orderServiceUrl,
    changeOrigin: true,
    pathRewrite: (path, req) => req.originalUrl.replace(/^\/api\/orders/, "/orders"),
  }),
);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(port, () => {
  console.log(`API gateway listening on port ${port}`);
});
