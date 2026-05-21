const { Resend } = require("resend");
const { env } = require("../config/env");

let resendClient = null;

const getResendClient = () => {
    if (!env.resendApiKey) {
        throw new Error(
            "RESEND_API_KEY is not configured. Add it in Render Dashboard → Environment, then redeploy."
        );
    }

    if (!resendClient) {
        resendClient = new Resend(env.resendApiKey);
        console.log("[EMAIL] Resend client initialized");
    }

    return resendClient;
};

const sendEmail = async ({ to, subject, html, text }) => {
    const resend = getResendClient();

    console.log(`[EMAIL] Sending to: ${to} | subject: ${subject}`);

    const { data, error } = await resend.emails.send({
        from: env.emailFrom,
        to: [to],
        subject,
        html,
        text,
    });

    if (error) {
        console.error("[EMAIL] Resend API error:", error);
        throw new Error(error.message || JSON.stringify(error));
    }

    console.log("[EMAIL] Sent successfully | id:", data?.id);

    return { id: data?.id, provider: "resend" };
};

sendEmail.safe = async (payload) => {
    try {
        if (!env.resendApiKey) {
            console.error("[EMAIL] Cannot send — RESEND_API_KEY missing");
            return {
                emailSent: false,
                emailError: "RESEND_API_KEY is not configured on server",
                messageId: null,
            };
        }

        const result = await sendEmail(payload);

        return {
            emailSent: true,
            emailError: null,
            messageId: result.id,
        };
    } catch (err) {
        console.error("[EMAIL] Send failed:", err.message);
        return {
            emailSent: false,
            emailError: err.message,
            messageId: null,
        };
    }
};

sendEmail.approval = async (to, fullName, doctorId) => {
    console.log(`[APPROVE EMAIL] Preparing for ${to} | doctorId: ${doctorId}`);

    const subject = "Plumedica - Doctor Account Approved";
    const text = `Dear ${fullName},\n\nYour registration is approved.\n\nDoctor ID: ${doctorId}\n\nYou can now log in to Plumedica.\n\nRegards,\nPlumedica Team`;
    const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <h2 style="color:#0d9488;border-bottom:2px solid #0d9488;padding-bottom:10px">
                Plumedica — Account Approved
            </h2>
            <p>Dear <strong>${fullName}</strong>,</p>
            <p>Your doctor registration has been <strong style="color:#16a34a">approved</strong>.</p>
            <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:12px;margin:16px 0">
                <p style="margin:0"><strong>Your Doctor ID:</strong></p>
                <p style="margin:8px 0 0;font-size:18px;color:#0d9488"><strong>${doctorId}</strong></p>
            </div>
            <p>You can now log in to the Plumedica app using your registered email and password.</p>
            <p style="color:#666;font-size:13px">Regards,<br><strong>Plumedica Team</strong></p>
        </div>`;

    const result = await sendEmail.safe({ to, subject, text, html });

    if (result.emailSent) {
        console.log(`[APPROVE EMAIL] Success for ${to}`);
    } else {
        console.error(`[APPROVE EMAIL] Failed for ${to}:`, result.emailError);
    }

    return result;
};

sendEmail.rejection = async (to, fullName, rejectionReason) => {
    console.log(`[REJECT EMAIL] Preparing for ${to}`);

    const subject = "Plumedica - Application Rejected";
    const text = `Dear ${fullName},\n\nYour registration was rejected.\n\nReason: ${rejectionReason}\n\nRegards,\nPlumedica Team`;
    const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <h2 style="color:#dc2626;border-bottom:2px solid #dc2626;padding-bottom:10px">
                Plumedica — Application Rejected
            </h2>
            <p>Dear <strong>${fullName}</strong>,</p>
            <p>Your doctor registration was <strong style="color:#dc2626">rejected</strong>.</p>
            <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px;margin:16px 0">
                <p style="margin:0"><strong>Reason:</strong></p>
                <p style="margin:8px 0 0">${rejectionReason}</p>
            </div>
            <p style="color:#666;font-size:13px">Regards,<br><strong>Plumedica Team</strong></p>
        </div>`;

    const result = await sendEmail.safe({ to, subject, text, html });

    if (result.emailSent) {
        console.log(`[REJECT EMAIL] Success for ${to}`);
    } else {
        console.error(`[REJECT EMAIL] Failed for ${to}:`, result.emailError);
    }

    return result;
};

sendEmail.isConfigured = () => Boolean(env.resendApiKey);

module.exports = sendEmail;
