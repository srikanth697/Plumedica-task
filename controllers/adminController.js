const Doctor = require("../models/Doctor");
const sendEmail = require("../utils/sendEmail");
const { parseMongoId } = require("../utils/parseId");
const { normalizeRejectBody, normalizeDeleteBody } = require("../utils/normalizeBody");
const { fetchDoctorList } = require("../utils/doctorList");

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

const respondDoctorList = async (req, res, fixedStatus = null) => {
    try {
        const result = await fetchDoctorList(req.query, fixedStatus);

        return res.status(200).json({
            success: true,
            ...result,
        });
    } catch (error) {
        console.error("Get doctors error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch doctors" });
    }
};

exports.getDoctors = (req, res) => respondDoctorList(req, res);
exports.getPendingDoctors = (req, res) => respondDoctorList(req, res, "PENDING");
exports.getApprovedDoctors = (req, res) => respondDoctorList(req, res, "APPROVED");
exports.getRejectedDoctors = (req, res) => respondDoctorList(req, res, "REJECTED");

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
        const { rejectionReason } = normalizeRejectBody(req.body);

        if (!rejectionReason) {
            return res.status(400).json({
                success: false,
                message: "rejectionReason is required in request body",
            });
        }

        const doctor = await getDoctorOrRespond(req.params.id, res);

        if (!doctor) return;

        doctor.status = "REJECTED";
        doctor.rejectionReason = rejectionReason;
        doctor.doctorId = undefined;
        await doctor.save();

        console.log(`[REJECT] Doctor saved: ${doctor.email} | reason: ${rejectionReason}`);

        const emailResult = await sendEmail.rejection(
            doctor.email,
            doctor.fullName,
            rejectionReason
        );

        if (!emailResult.success) {
            console.error("[REJECT] Email failed:", emailResult.error);
        }

        return res.status(200).json(
            buildEmailResponse("Doctor rejected", emailResult, {
                doctorEmail: doctor.email,
                rejectionReason,
            })
        );
    } catch (error) {
        console.error("Reject error:", error);
        return res.status(500).json({ success: false, message: "Failed to reject doctor" });
    }
};

exports.deleteDoctor = async (req, res) => {
    try {
        const { deletionReason: bodyReason } = normalizeDeleteBody(req.body);
        const deletionReason = (
            bodyReason ||
            req.query?.deletionReason ||
            req.query?.reason ||
            ""
        ).trim();

        if (!deletionReason) {
            return res.status(400).json({
                success: false,
                message: "deletionReason is required (JSON body or ?deletionReason= query)",
            });
        }

        const mongoId = parseMongoId(req.params.id);

        if (!mongoId) {
            return res.status(400).json({ success: false, message: "Invalid doctor ID" });
        }

        const doctor = await Doctor.findById(mongoId);

        if (!doctor) {
            return res.status(404).json({ success: false, message: "Doctor not found" });
        }

        const doctorEmail = doctor.email;
        const doctorName = doctor.fullName;

        console.log("Delete email started");
        console.log("Doctor email:", doctorEmail);

        const emailResult = await sendEmail.deletion(
            doctorEmail,
            doctorName,
            deletionReason
        );

        if (!emailResult.success) {
            console.log("Delete email failed:", emailResult.error);
        } else {
            console.log("Delete email sent successfully");
        }

        await Doctor.findByIdAndDelete(mongoId);

        console.log(`[DELETE] Doctor removed: ${doctorEmail} (${mongoId})`);

        return res.status(200).json({
            success: true,
            message: "Doctor deleted successfully",
            emailSent: Boolean(emailResult.success),
            emailQueued: Boolean(emailResult.emailQueued),
            emailError: emailResult.error || null,
            deletedId: mongoId,
            doctorEmail,
            deletionReason,
        });
    } catch (error) {
        console.error("Delete doctor error:", error);
        return res.status(500).json({ success: false, message: "Failed to delete doctor" });
    }
};
