const Doctor = require("../models/Doctor");
const sendEmail = require("../utils/sendEmails");
const {
    approvalEmail,
    rejectionEmail,
} = require("../utils/emailTemplates");

const sendDoctorEmail = async (doctor, templateFn, extraArg) => {
    const template = templateFn(doctor.fullName, extraArg);
    const result = await sendEmail.withRetry(
        doctor.email,
        template.subject,
        template.text,
        template.html
    );

    return result;
};

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
        let emailError = null;
        let messageId = null;

        try {
            const result = await sendDoctorEmail(doctor, approvalEmail, doctorId);
            emailSent = true;
            messageId = result.messageId;
        } catch (error) {
            emailError = error.message;
            console.error("Approval email failed:", emailError);
        }

        res.json({
            success: true,
            message: emailSent
                ? "Doctor approved successfully. Email sent."
                : "Doctor approved but email failed to send.",
            emailSent,
            emailError,
            messageId,
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

        const result = await sendDoctorEmail(doctor, approvalEmail, doctor.doctorId);

        res.json({
            success: true,
            message: "Approval email sent successfully",
            emailSent: true,
            messageId: result.messageId,
            doctorEmail: doctor.email,
        });

    } catch (error) {

        console.error("Resend approval email failed:", error.message);

        res.status(500).json({
            message: error.message || "Failed to send approval email",
            emailSent: false,
            emailError: error.message,
        });

    }

};

exports.rejectDoctor = async (req, res) => {

    try {

        const { id } = req.params;

        const { rejectionReason } = req.body;

        if (!rejectionReason) {
            return res.status(400).json({
                message: "rejectionReason is required",
            });
        }

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
        let emailError = null;
        let messageId = null;

        try {
            const result = await sendDoctorEmail(
                doctor,
                rejectionEmail,
                rejectionReason
            );
            emailSent = true;
            messageId = result.messageId;
        } catch (error) {
            emailError = error.message;
            console.error("Rejection email failed:", emailError);
        }

        res.json({
            success: true,
            message: emailSent
                ? "Doctor rejected successfully. Email sent."
                : "Doctor rejected but email failed to send.",
            emailSent,
            emailError,
            messageId,
            doctorEmail: doctor.email,
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }

};

exports.testEmail = async (req, res) => {

    try {

        const { to } = req.body;
        const testTo = to || process.env.EMAIL_USER;

        const result = await sendEmail.withRetry(
            testTo,
            "Plumedica - Email Test",
            "This is a test email from Plumedica backend. If you received this, email is working.",
            "<p>This is a <strong>test email</strong> from Plumedica backend.</p><p>If you received this, email is working.</p>"
        );

        res.json({
            success: true,
            message: "Test email sent successfully",
            to: testTo,
            messageId: result.messageId,
            provider: result.provider,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Test email failed",
            emailError: error.message,
        });

    }

};
