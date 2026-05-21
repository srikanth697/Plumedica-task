const Doctor = require("../models/Doctor");
const sendEmail = require("../utils/sendEmails");

exports.getDoctors = async (req, res) => {

    try {

        const doctors = await Doctor.find().sort({
            createdAt: -1,
        });

        res.json(doctors);

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }

};

exports.approveDoctor = async (req, res) => {

    try {

        const { id } = req.params;

        const doctor = await Doctor.findById(id);

        if (!doctor) {
            return res.status(404).json({
                message: "Doctor not found",
            });
        }

        const doctorId = "DOC" + Date.now();

        doctor.status = "APPROVED";
        doctor.doctorId = doctorId;

        await doctor.save();

        let emailSent = false;

        try {
            await sendEmail(
                doctor.email,
                "Plumedica - Doctor Account Approved",
                `Dear ${doctor.fullName},\n\nYour doctor registration has been approved.\n\nDoctor ID: ${doctorId}\n\nYou can now log in to the Plumedica app.\n\nRegards,\nPlumedica Team`
            );
            emailSent = true;
        } catch (emailError) {
            console.error("Approval email failed:", emailError.message);
        }

        res.json({
            success: true,
            message: "Doctor approved successfully",
            emailSent,
            doctorEmail: doctor.email,
            doctorId,
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }

};

exports.resendApprovalEmail = async (req, res) => {

    try {

        const { id } = req.params;

        const doctor = await Doctor.findById(id);

        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        if (doctor.status !== "APPROVED") {
            return res.status(400).json({
                message: "Doctor must be approved before sending approval email",
            });
        }

        await sendEmail(
            doctor.email,
            "Plumedica - Doctor Account Approved",
            `Dear ${doctor.fullName},\n\nYour doctor registration has been approved.\n\nDoctor ID: ${doctor.doctorId}\n\nYou can now log in to the Plumedica app.\n\nRegards,\nPlumedica Team`
        );

        res.json({
            success: true,
            message: "Approval email sent successfully",
            doctorEmail: doctor.email,
        });

    } catch (error) {

        console.error("Resend approval email failed:", error.message);

        res.status(500).json({
            message: error.message || "Failed to send approval email",
        });

    }

};

exports.rejectDoctor = async (req, res) => {

    try {

        const { id } = req.params;

        const { rejectionReason } = req.body;

        const doctor = await Doctor.findById(id);

        if (!doctor) {
            return res.status(404).json({
                message: "Doctor not found",
            });
        }

        doctor.status = "REJECTED";
        doctor.rejectionReason = rejectionReason;

        await doctor.save();

        let emailSent = false;

        try {
            await sendEmail(
                doctor.email,
                "Plumedica - Application Rejected",
                `Dear ${doctor.fullName},\n\nYour registration was rejected.\n\nReason: ${rejectionReason}\n\nRegards,\nPlumedica Team`
            );
            emailSent = true;
        } catch (emailError) {
            console.error("Rejection email failed:", emailError.message);
        }

        res.json({
            success: true,
            message: "Doctor rejected successfully",
            emailSent,
            doctorEmail: doctor.email,
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }

};