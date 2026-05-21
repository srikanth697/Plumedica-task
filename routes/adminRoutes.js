const express = require("express");
const { login } = require("../controllers/adminAuthController");
const {
    getDoctors,
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
            "PUT    /api/admin/approve/:id",
            "PUT    /api/admin/reject/:id",
            "POST   /api/admin/reject/:id",
            "DELETE /api/admin/delete/:id",
        ],
    });
});

router.get("/doctors", getDoctors);
router.put("/approve/:id", approveDoctor);
router.put("/reject/:id", rejectDoctor);
router.post("/reject/:id", rejectDoctor);
router.delete("/delete/:id", parseFormData, deleteDoctor);

module.exports = router;
