"use strict";
const mongoose = require("mongoose");
async function connectDatabase(uri) {
  try {
    await mongoose.connect(uri);
  } catch (error) {
    throw new Error(
      "Could not connect to MongoDB. Check MONGODB_URI and database availability.",
    );
  }
}
async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}
module.exports = { connectDatabase, disconnectDatabase };
