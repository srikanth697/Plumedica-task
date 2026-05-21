const express = require("express");
const { login } = require("../controllers/adminAuthController");
const {
    getDoctors,
    getPendingDoctors,
    getApprovedDoctors,
    getRejectedDoctors,
    approveDoctor,
    rejectDoctor,
    deleteDoctor,
} = require("../controllers/adminController");
const { protectAdmin } = require("../middleware/auth");
const { parseFormData } = require("../middleware/upload");

const router = express.Router();

router.post("/login", parseFormData, login);

router.use(protectAdmin);

router.get("/", (_, res) => {
    res.status(200).json({
        success: true,
        message: "Plumedica Admin API",
        routes: [
            "GET    /api/admin/doctors",
            "GET    /api/admin/doctors/pending",
            "GET    /api/admin/doctors/approved",
            "GET    /api/admin/doctors/rejected",
            "PUT    /api/admin/approve/:id",
            "PUT    /api/admin/reject/:id",
            "POST   /api/admin/reject/:id",
            "DELETE /api/admin/delete/:id",
        ],
    });
});

router.get("/doctors/pending", getPendingDoctors);
router.get("/doctors/approved", getApprovedDoctors);
router.get("/doctors/rejected", getRejectedDoctors);
router.get("/doctors", getDoctors);
router.put("/approve/:id", approveDoctor);
router.put("/reject/:id", rejectDoctor);
router.post("/reject/:id", rejectDoctor);
router.delete("/delete/:id", parseFormData, deleteDoctor);

module.exports = router;
