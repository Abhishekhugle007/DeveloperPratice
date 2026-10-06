import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    age: {
        type: Number,
    },
    course: String
});

const User = mongoose.model("students", userSchema);
export default User;
