const express = require("express");
const multer = require("multer");

const router = express.Router();
const upload = multer();

const {
    registerDoctor,
    loginDoctor,
} = require("../controllers/authController");

router.post("/register", upload.none(), registerDoctor);

router.post("/login", upload.none(), loginDoctor);

module.exports = router;