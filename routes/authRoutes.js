const express = require("express");
const { register, login } = require("../controllers/authController");
const { parseFormData } = require("../middleware/upload");

const router = express.Router();

router.post("/register", parseFormData, register);
router.post("/login", parseFormData, login);

module.exports = router;
