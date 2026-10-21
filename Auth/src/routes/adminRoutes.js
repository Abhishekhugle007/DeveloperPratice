const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

const router = express.Router();

router.get("/", authenticate, authorize("admin"), (request, response) => {
    response.json({
        message: "Admin access granted.",
        user: {
            id: request.user._id.toString(),
            email: request.user.email,
            role: request.user.role
        }
    });
});

module.exports = router;
