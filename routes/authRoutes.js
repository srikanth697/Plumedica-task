const express = require("express");
const multer = require("multer");

const router = express.Router();
const upload = multer();

const {
    registerDoctor,
    loginDoctor,
} = require("../controllers/authController");

const handleUpload = (req, res, next) => {
    upload.none()(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};

router.post("/register", handleUpload, registerDoctor);

router.post("/login", handleUpload, loginDoctor);

module.exports = router;