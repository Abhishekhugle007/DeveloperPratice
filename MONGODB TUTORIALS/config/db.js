import mongoose from "mongoose";

const connectDB = async () => {
    await mongoose.connect("mongodb://localhost:27017/myFirstDB");
    console.log("Connected to MongoDB");
};

export default connectDB;