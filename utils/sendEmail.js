const nodemailer = require("nodemailer");
const { env } = require("../config/env");
const { approvalTemplate, rejectionTemplate } = require("./emailTemplates");

const EMAIL_TIMEOUT_MS = 15000;
let transporter = null;

const withTimeout = (promise, ms, label) =>
    Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
        }),
    ]);

const getTransporter = () => {
    if (!env.emailUser || !env.emailPass) {
        throw new Error(
            "EMAIL_USER and EMAIL_PASS are not configured. Add them in Render Environment, then redeploy."
        );
    }

    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: env.emailUser,
                pass: env.emailPass,
            },
            connectionTimeout: EMAIL_TIMEOUT_MS,
            greetingTimeout: EMAIL_TIMEOUT_MS,
            socketTimeout: EMAIL_TIMEOUT_MS,
        });
        console.log("[EMAIL] Gmail SMTP transporter ready");
    }

    return transporter;
};

const sendMail = async ({ to, subject, html, text }) => {
    const transport = getTransporter();

    console.log(`[EMAIL] Sending to: ${to} | subject: ${subject}`);

    const info = await withTimeout(
        transport.sendMail({
            from: `"Plumedica" <${env.emailUser}>`,
            to,
            subject,
            html,
            text,
        }),
        EMAIL_TIMEOUT_MS,
        "Gmail sendMail"
    );

    console.log("[EMAIL] Sent successfully | messageId:", info.messageId);

    return { messageId: info.messageId, provider: "gmail" };
};

const sendEmail = {
    safe: async ({ to, subject, html, text }) => {
        try {
            if (!env.emailUser || !env.emailPass) {
                console.error("[EMAIL] EMAIL_USER or EMAIL_PASS missing");
                return {
                    emailSent: false,
                    emailError: "Gmail credentials not configured on server",
                    messageId: null,
                };
            }

            const result = await sendMail({ to, subject, html, text });

            return {
                emailSent: true,
                emailError: null,
                messageId: result.messageId,
            };
        } catch (err) {
            transporter = null;
            console.error("[EMAIL] Send failed:", err.message);
            return {
                emailSent: false,
                emailError: err.message,
                messageId: null,
            };
        }
    },

    approval: async (to, fullName, doctorId) => {
        console.log(`[APPROVE EMAIL] Preparing for ${to} | doctorId: ${doctorId}`);

        const template = approvalTemplate(fullName, doctorId);
        const result = await sendEmail.safe({ to, ...template });

        if (result.emailSent) {
            console.log(`[APPROVE EMAIL] Success for ${to}`);
        } else {
            console.error(`[APPROVE EMAIL] Failed for ${to}:`, result.emailError);
        }

        return result;
    },

    rejection: async (to, fullName, rejectionReason) => {
        console.log(`[REJECT EMAIL] Preparing for ${to}`);

        const template = rejectionTemplate(fullName, rejectionReason);
        const result = await sendEmail.safe({ to, ...template });

        if (result.emailSent) {
            console.log(`[REJECT EMAIL] Success for ${to}`);
        } else {
            console.error(`[REJECT EMAIL] Failed for ${to}:`, result.emailError);
        }

        return result;
    },

    isConfigured: () => Boolean(env.emailUser && env.emailPass),
};

module.exports = sendEmail;
