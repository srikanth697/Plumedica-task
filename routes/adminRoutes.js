const express = require("express");
const multer = require("multer");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const { loginAdmin } = require("../controllers/adminAuthController");
const {
    getDoctors,
    approveDoctor,
    rejectDoctor,
    resendApprovalEmail,
    testEmail,
} = require("../controllers/adminController");
const { protectAdmin } = require("../middleware/authMiddleware");

const handleLoginUpload = (req, res, next) => {
    upload.any()(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};

// Public
router.post("/login", handleLoginUpload, loginAdmin);

// Protected — requires Bearer token (admin)
router.use(protectAdmin);

router.get("/doctors", getDoctors);

router.put("/approve/:id", approveDoctor);

router.post("/resend-approval/:id", resendApprovalEmail);

router.put("/reject/:id", rejectDoctor);

router.post("/test-email", testEmail);

module.exports = router;
