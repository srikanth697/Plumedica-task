const Doctor = require("../models/Doctor");
const sendEmail = require("../utils/sendEmail");
const { parseMongoId } = require("../utils/parseId");

const getDoctorOrRespond = async (id, res) => {
    const mongoId = parseMongoId(id);

    if (!mongoId) {
        res.status(400).json({ success: false, message: "Invalid doctor ID" });
        return null;
    }

    const doctor = await Doctor.findById(mongoId);

    if (!doctor) {
        res.status(404).json({ success: false, message: "Doctor not found" });
        return null;
    }

    return doctor;
};

const buildEmailResponse = (actionLabel, emailResult, extra = {}) => {
    let message = `${actionLabel} successfully`;

    if (!emailResult.success) {
        message = emailResult.emailQueued
            ? `${actionLabel} successfully. Email is being sent in background.`
            : `${actionLabel} successfully but email failed`;
    }

    return {
        success: true,
        message,
        emailSent: emailResult.success,
        emailQueued: emailResult.emailQueued || false,
        emailError: emailResult.error || null,
        ...extra,
    };
};

exports.getDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find()
            .select("-password")
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, count: doctors.length, doctors });
    } catch (error) {
        console.error("Get doctors error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch doctors" });
    }
};

exports.approveDoctor = async (req, res) => {
    try {
        const doctor = await getDoctorOrRespond(req.params.id, res);

        if (!doctor) return;

        const generatedDoctorId = `DOC${Date.now()}`;

        doctor.status = "APPROVED";
        doctor.doctorId = generatedDoctorId;
        doctor.rejectionReason = undefined;
        await doctor.save();

        console.log(`[APPROVE] Doctor saved: ${doctor.email} | id: ${generatedDoctorId}`);

        const emailResult = await sendEmail.approval(
            doctor.email,
            doctor.fullName,
            generatedDoctorId
        );

        if (!emailResult.success) {
            console.error("[APPROVE] Email failed:", emailResult.error);
        }

        return res.status(200).json(
            buildEmailResponse("Doctor approved", emailResult, {
                doctorEmail: doctor.email,
                doctorId: generatedDoctorId,
            })
        );
    } catch (error) {
        console.error("Approve error:", error);
        return res.status(500).json({ success: false, message: "Failed to approve doctor" });
    }
};

exports.rejectDoctor = async (req, res) => {
    try {
        const { rejectionReason } = req.body;

        if (!rejectionReason?.trim()) {
            return res.status(400).json({ success: false, message: "rejectionReason is required" });
        }

        const doctor = await getDoctorOrRespond(req.params.id, res);

        if (!doctor) return;

        doctor.status = "REJECTED";
        doctor.rejectionReason = rejectionReason.trim();
        doctor.doctorId = undefined;
        await doctor.save();

        console.log(`[REJECT] Doctor saved: ${doctor.email}`);

        const emailResult = await sendEmail.rejection(
            doctor.email,
            doctor.fullName,
            rejectionReason.trim()
        );

        if (!emailResult.success) {
            console.error("[REJECT] Email failed:", emailResult.error);
        }

        return res.status(200).json(
            buildEmailResponse("Doctor rejected", emailResult, {
                doctorEmail: doctor.email,
            })
        );
    } catch (error) {
        console.error("Reject error:", error);
        return res.status(500).json({ success: false, message: "Failed to reject doctor" });
    }
};
