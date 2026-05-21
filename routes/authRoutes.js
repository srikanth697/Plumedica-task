const express = require("express");
const multer = require("multer");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const {
    registerDoctor,
    loginDoctor,
} = require("../controllers/authController");

const handleMulterError = (err, res) => {
    if (!err) {
        return false;
    }

    return res.status(400).json({
        message: err.message,
        field: err.field || null,
        hint: err.code === "LIMIT_UNEXPECTED_FILE"
            ? "Remove extra file fields or use only text fields in form-data"
            : "Check form-data keys and file uploads",
    });
};

// Accept all text + file fields (Postman often sends document uploads)
const handleRegisterUpload = (req, res, next) => {
    upload.any()(req, res, (err) => {
        if (handleMulterError(err, res)) {
            return;
        }

        if (req.files?.length) {
            const file = req.files[0];
            req.body.document = file.originalname;
        }

        next();
    });
};

const handleLoginUpload = (req, res, next) => {
    upload.any()(req, res, (err) => {
        if (handleMulterError(err, res)) {
            return;
        }
        next();
    });
};

router.post("/register", handleRegisterUpload, registerDoctor);

router.post("/login", handleLoginUpload, loginDoctor);

module.exports = router;