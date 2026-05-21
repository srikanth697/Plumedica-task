const { Resend } = require("resend");

const getResendClient = () => {
    const apiKey = process.env.RESEND_API_KEY?.trim();

    if (!apiKey) {
        throw new Error("RESEND_API_KEY is not configured");
    }

    return new Resend(apiKey);
};

const getFromAddress = () =>
    process.env.EMAIL_FROM?.trim() || "Plumedica <onboarding@resend.dev>";

const sendEmail = async ({ to, subject, html, text }) => {
    const resend = getResendClient();

    const { data, error } = await resend.emails.send({
        from: getFromAddress(),
        to: [to],
        subject,
        html,
        text,
    });

    if (error) {
        throw new Error(error.message || "Failed to send email");
    }

    return { id: data?.id, provider: "resend" };
};

sendEmail.safe = async (payload) => {
    try {
        const result = await sendEmail(payload);
        return { emailSent: true, emailError: null, messageId: result.id };
    } catch (err) {
        console.error("Email error:", err.message);
        return { emailSent: false, emailError: err.message, messageId: null };
    }
};

sendEmail.approval = (to, fullName, doctorId) => {
    const subject = "Plumedica - Doctor Account Approved";
    const text = `Dear ${fullName},\n\nYour registration is approved.\n\nDoctor ID: ${doctorId}\n\nYou can now log in to Plumedica.\n\nRegards,\nPlumedica Team`;
    const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px">
            <h2 style="color:#0d9488">Account Approved</h2>
            <p>Dear <strong>${fullName}</strong>,</p>
            <p>Your doctor registration has been <strong style="color:green">approved</strong>.</p>
            <p><strong>Doctor ID:</strong> ${doctorId}</p>
            <p>You can now log in to the Plumedica app.</p>
            <p>Regards,<br><strong>Plumedica Team</strong></p>
        </div>`;

    return sendEmail.safe({ to, subject, text, html });
};

sendEmail.rejection = (to, fullName, rejectionReason) => {
    const subject = "Plumedica - Application Rejected";
    const text = `Dear ${fullName},\n\nYour registration was rejected.\n\nReason: ${rejectionReason}\n\nRegards,\nPlumedica Team`;
    const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px">
            <h2 style="color:#dc2626">Application Rejected</h2>
            <p>Dear <strong>${fullName}</strong>,</p>
            <p>Your registration was <strong style="color:red">rejected</strong>.</p>
            <p><strong>Reason:</strong> ${rejectionReason}</p>
            <p>Regards,<br><strong>Plumedica Team</strong></p>
        </div>`;

    return sendEmail.safe({ to, subject, text, html });
};

module.exports = sendEmail;
