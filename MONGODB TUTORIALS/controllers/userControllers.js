import mongoose from "mongoose";
import User from "../models/userModel.js";


// get api all students
export const getAllStudents = async (req, res) => {
    try {
        const students = await User.find({});
        res.json(students);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Unable to fetch students" });
    }
};

// post api to create a new student
export const createStudent = async (req, res) => {
    try {
        const newStudent = new User(req.body);
        const savedStudent = await newStudent.save();
        res.status(201).json(savedStudent);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Unable to create student" });
    }
};

// put api to update a student by ID
export const updateStudent = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.status(400).json({ error: "Invalid student ID." });
    }

    if (!updates || typeof updates !== "object" || Array.isArray(updates) ||
        Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "Request body must contain student fields to update." });
    }

    try {
        const updatedStudent = await User.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        });

        if (!updatedStudent) {
            return res.status(404).json({ error: "Student not found" });
        }

        res.json(updatedStudent);
    } catch (error) {
        console.error(error);

        if (error instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: "Unable to update student" });
    }
};


// delete api to delete a student by ID
export const deleteStudent = async (req, res) => {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.status(400).json({ error: "Invalid student ID." });
    }

    try {
        const deletedStudent = await User.findByIdAndDelete(id);

        if (!deletedStudent) {
            return res.status(404).json({ error: "Student not found" });
        }

        res.json({ message: "Student deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Unable to delete student" });
    }
};
