const express = require("express");
const { login } = require("../controllers/adminAuthController");
const { getDoctors, approveDoctor, rejectDoctor } = require("../controllers/adminController");
const { protectAdmin } = require("../middleware/auth");
const { parseFormData } = require("../middleware/upload");

const router = express.Router();

router.post("/login", parseFormData, login);

router.use(protectAdmin);

router.get("/doctors", getDoctors);
router.put("/approve/:id", approveDoctor);
router.put("/reject/:id", rejectDoctor);

module.exports = router;
