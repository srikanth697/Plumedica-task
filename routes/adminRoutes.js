const express = require("express");

const router = express.Router();

const {
    getDoctors,
    approveDoctor,
    rejectDoctor,
    resendApprovalEmail,
} = require("../controllers/adminController");

router.get("/doctors", getDoctors);

router.put("/approve/:id", approveDoctor);

router.post("/resend-approval/:id", resendApprovalEmail);

router.put("/reject/:id", rejectDoctor);

module.exports = router;