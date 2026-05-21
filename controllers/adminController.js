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

        const email = await sendEmail.approval(
            doctor.email,
            doctor.fullName,
            generatedDoctorId
        );

        return res.status(200).json({
            success: true,
            message: email.emailSent
                ? "Doctor approved successfully"
                : "Doctor approved successfully but email failed",
            emailSent: email.emailSent,
            emailError: email.emailError,
            doctorEmail: doctor.email,
            doctorId: generatedDoctorId,
        });
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

        const email = await sendEmail.rejection(
            doctor.email,
            doctor.fullName,
            rejectionReason.trim()
        );

        return res.status(200).json({
            success: true,
            message: email.emailSent
                ? "Doctor rejected successfully"
                : "Doctor rejected successfully but email failed",
            emailSent: email.emailSent,
            emailError: email.emailError,
            doctorEmail: doctor.email,
        });
    } catch (error) {
        console.error("Reject error:", error);
        return res.status(500).json({ success: false, message: "Failed to reject doctor" });
    }
};
