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

        try {
            await sendEmail(
                doctor.email,
                "Doctor Approved",
                `Your account approved successfully. Doctor ID: ${doctorId}`
            );
        } catch (emailError) {
            console.error("Approval email failed:", emailError.message);
        }

        res.json({
            success: true,
            message: "Doctor approved successfully",
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
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

        try {
            await sendEmail(
                doctor.email,
                "Application Rejected",
                `Reason: ${rejectionReason}`
            );
        } catch (emailError) {
            console.error("Rejection email failed:", emailError.message);
        }

        res.json({
            success: true,
            message: "Doctor rejected successfully",
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }

};