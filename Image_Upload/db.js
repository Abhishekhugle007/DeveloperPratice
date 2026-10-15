
const mongoose = require('mongoose');

require('dotenv').config();

const mongoURL = process.env.MONGODB_URI;

mongoose.connect(mongoURL).catch((err) => {
    console.error('MongoDB connection error:', err);
});

const db = mongoose.connection;

db.on('connected', () => {
    console.log('Connected to mongodb server');
});

db.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

db.on('disconnected', () => {
    console.log('Mongodb disconnected');
});

module.exports = db;