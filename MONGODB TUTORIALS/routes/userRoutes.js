import express from "express";

import { getAllStudents } from "../controllers/userControllers.js";

const router = express.Router();

router.get("/users", getAllStudents);
export default router;
