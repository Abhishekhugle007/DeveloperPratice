const express = require("express");
const {
    register,
    login,
    logout,
    currentUser
} = require("../controllers/authController");
const { authenticate } = require("../middleware/authenticate");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authenticate, currentUser);

module.exports = router;
