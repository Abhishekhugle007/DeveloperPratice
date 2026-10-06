import User from "../models/userModel.js";

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
