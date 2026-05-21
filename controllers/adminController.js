const Doctor = require("../models/Doctor");
const sendEmail = require("../utils/sendEmails");
const { parseDoctorId } = require("../utils/parseDoctorId");
const {
    approvalEmail,
    rejectionEmail,
} = require("../utils/emailTemplates");

const findDoctorByParamId = async (id, res) => {
    const doctorId = parseDoctorId(id);

    if (!doctorId) {
        res.status(400).json({
            message: "Invalid doctor ID. Copy _id from GET /api/admin/doctors without extra spaces.",
        });
        return null;
    }

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
        res.status(404).json({
            message: "Doctor not found",
        });
        return null;
    }

    return doctor;
};

const trySendEmailSync = async (doctor, templateFn, extraArg) => {
    const template = templateFn(doctor.fullName, extraArg);

    return sendEmail.safe(
        doctor.email,
        template.subject,
        template.text,
        template.html
    );
};

const queueDoctorEmail = (doctor, templateFn, extraArg) => {
    const template = templateFn(doctor.fullName, extraArg);

    sendEmail.sendInBackground(
        doctor.email,
        template.subject,
        template.text,
        template.html
    );
};

exports.getDoctors = async (req, res) => {

    try {

        const doctors = await Doctor.find().sort({
            createdAt: -1,
        });

        res.json(doctors);

    } catch (error) {

        console.error("Get doctors error:", error);

        res.status(500).json({
            message: error.message,
        });

    }

};

exports.approveDoctor = async (req, res) => {

    try {

        const doctor = await findDoctorByParamId(req.params.id, res);

        if (!doctor) {
            return;
        }

        const doctorId = "DOC" + Date.now();

        doctor.status = "APPROVED";
        doctor.doctorId = doctorId;

        await doctor.save();

        const emailResult = await trySendEmailSync(doctor, approvalEmail, doctorId);

        if (!emailResult.emailSent) {
            queueDoctorEmail(doctor, approvalEmail, doctorId);
        }

        res.json({
            success: true,
            message: emailResult.emailSent
                ? "Doctor approved successfully. Email sent."
                : "Doctor approved successfully. Email will be retried in background.",
            emailSent: emailResult.emailSent,
            emailError: emailResult.emailError,
            messageId: emailResult.messageId,
            doctorEmail: doctor.email,
            doctorId,
        });

    } catch (error) {

        console.error("Approve doctor error:", error);

        res.status(500).json({
            message: error.message || "Failed to approve doctor",
        });

    }

};

exports.resendApprovalEmail = async (req, res) => {

    try {

        const doctor = await findDoctorByParamId(req.params.id, res);

        if (!doctor) {
            return;
        }

        if (doctor.status !== "APPROVED") {
            return res.status(400).json({
                message: "Doctor must be approved before sending approval email",
            });
        }

        const emailResult = await trySendEmailSync(
            doctor,
            approvalEmail,
            doctor.doctorId
        );

        if (!emailResult.emailSent) {
            return res.status(200).json({
                success: false,
                message: "Failed to send approval email",
                emailSent: false,
                emailError: emailResult.emailError,
                doctorEmail: doctor.email,
            });
        }

        res.json({
            success: true,
            message: "Approval email sent successfully",
            emailSent: true,
            messageId: emailResult.messageId,
            doctorEmail: doctor.email,
        });

    } catch (error) {

        console.error("Resend approval email error:", error);

        res.status(500).json({
            message: error.message || "Failed to send approval email",
            emailSent: false,
            emailError: error.message,
        });

    }

};

exports.rejectDoctor = async (req, res) => {

    try {

        const { rejectionReason } = req.body;

        if (!rejectionReason) {
            return res.status(400).json({
                message: "rejectionReason is required",
            });
        }

        const doctor = await findDoctorByParamId(req.params.id, res);

        if (!doctor) {
            return;
        }

        doctor.status = "REJECTED";
        doctor.rejectionReason = rejectionReason;

        await doctor.save();

        const emailResult = await trySendEmailSync(
            doctor,
            rejectionEmail,
            rejectionReason
        );

        if (!emailResult.emailSent) {
            queueDoctorEmail(doctor, rejectionEmail, rejectionReason);
        }

        res.json({
            success: true,
            message: emailResult.emailSent
                ? "Doctor rejected successfully. Email sent."
                : "Doctor rejected successfully. Email will be retried in background.",
            emailSent: emailResult.emailSent,
            emailError: emailResult.emailError,
            messageId: emailResult.messageId,
            doctorEmail: doctor.email,
        });

    } catch (error) {

        console.error("Reject doctor error:", error);

        res.status(500).json({
            message: error.message || "Failed to reject doctor",
        });

    }

};

exports.testEmail = async (req, res) => {

    try {

        const { to } = req.body;
        const testTo = to || process.env.EMAIL_USER;

        const emailResult = await sendEmail.safe(
            testTo,
            "Plumedica - Email Test",
            "This is a test email from Plumedica backend. If you received this, email is working.",
            "<p>This is a <strong>test email</strong> from Plumedica backend.</p><p>If you received this, email is working.</p>"
        );

        if (!emailResult.emailSent) {
            return res.status(200).json({
                success: false,
                message: "Test email failed",
                emailSent: false,
                emailError: emailResult.emailError,
            });
        }

        res.json({
            success: true,
            message: "Test email sent successfully",
            to: testTo,
            emailSent: true,
            messageId: emailResult.messageId,
            provider: emailResult.provider,
        });

    } catch (error) {

        console.error("Test email error:", error);

        res.status(500).json({
            success: false,
            message: "Test email failed",
            emailError: error.message,
        });

    }

};
