const express = require("express");
const {
    register,
    login,
    checkStatus,
    getProfile,
} = require("../controllers/authController");
const { parseRegistrationUpload, optionalMultipart } = require("../middleware/upload");
const { protectDoctor } = require("../middleware/auth");

const router = express.Router();

router.post("/register", parseRegistrationUpload, register);
router.post("/login", optionalMultipart, login);

router.get("/check-status", checkStatus);
router.post("/check-status", optionalMultipart, checkStatus);
router.get(/^\/check-status\/(.+)$/, (req, res) => {
    req.params.email = req.params[0];
    return checkStatus(req, res);
});

router.get("/profile", protectDoctor, getProfile);

module.exports = router;
