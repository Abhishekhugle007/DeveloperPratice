import express from "express";

import { getAllStudents, createStudent, updateStudent , deleteStudent} from "../controllers/userControllers.js";

const router = express.Router();

router.get("/users", getAllStudents);
router.post("/users", createStudent);
router.put("/users/:id", updateStudent);
router.delete("/users/:id", deleteStudent);

export default router;
