const express = require("express");

const router = express.Router();

const {
    getDoctors,
    approveDoctor,
    rejectDoctor,
} = require("../controllers/adminController");

router.get("/doctors", getDoctors);

router.put("/approve/:id", approveDoctor);

router.put("/reject/:id", rejectDoctor);

module.exports = router;