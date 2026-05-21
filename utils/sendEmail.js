const nodemailer = require("nodemailer");
const { env } = require("../config/env");
const { approvalTemplate, rejectionTemplate } = require("./emailTemplates");

const SMTP_HOST = "smtp.gmail.com";
const API_EMAIL_TIMEOUT_MS = 20000;
const SMTP_TIMEOUT_MS = 60000;
const MAX_RETRIES = 2;

let transporter = null;
let verified = false;

const withTimeout = (promise, ms, label) =>
    Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
        }),
    ]);

const createTransporter = () =>
    nodemailer.createTransport({
        host: SMTP_HOST,
        port: 465,
        secure: true,
        auth: {
            user: env.emailUser,
            pass: env.emailPass,
        },
        pool: true,
        maxConnections: 3,
        maxMessages: 100,
        connectionTimeout: SMTP_TIMEOUT_MS,
        greetingTimeout: SMTP_TIMEOUT_MS,
        socketTimeout: SMTP_TIMEOUT_MS,
        family: 4,
        tls: {
            minVersion: "TLSv1.2",
            rejectUnauthorized: true,
        },
    });

const resetTransporter = () => {
    if (transporter) {
        transporter.close().catch(() => {});
    }
    transporter = null;
    verified = false;
};

const getTransporter = () => {
    if (!env.emailUser || !env.emailPass) {
        throw new Error("EMAIL_USER and EMAIL_PASS are not configured");
    }

    if (!transporter) {
        transporter = createTransporter();
        console.log(`[EMAIL] SMTP pool created (${SMTP_HOST}:465 secure)`);
    }

    return transporter;
};

const verifyConnection = async () => {
    const transport = getTransporter();

    console.log("[EMAIL] Verifying SMTP connection...");

    await withTimeout(transport.verify(), SMTP_TIMEOUT_MS, "SMTP verify");

    verified = true;
    console.log("[EMAIL] SMTP connection verified successfully");
};

const initEmailService = async () => {
    if (!env.emailUser || !env.emailPass) {
        console.error("[EMAIL] Skipping verify — credentials missing");
        return false;
    }

    try {
        await verifyConnection();
        return true;
    } catch (err) {
        console.error("[EMAIL] SMTP verify failed:", err.message);
        resetTransporter();
        return false;
    }
};

const sendMailOnce = async ({ to, subject, html, text }) => {
    const transport = getTransporter();

    if (!verified) {
        try {
            await verifyConnection();
        } catch (err) {
            console.warn("[EMAIL] Pre-send verify failed, attempting send anyway:", err.message);
        }
    }

    console.log(`[EMAIL] Sending to: ${to} | subject: ${subject}`);

    const info = await transport.sendMail({
        from: `"Plumedica" <${env.emailUser}>`,
        to,
        subject,
        html,
        text,
    });

    console.log("[EMAIL] Sent successfully | messageId:", info.messageId);

    return { messageId: info.messageId, provider: "gmail" };
};

const sendMailWithRetry = async (payload, timeoutMs = SMTP_TIMEOUT_MS) => {
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            return await withTimeout(sendMailOnce(payload), timeoutMs, "Gmail sendMail");
        } catch (err) {
            lastError = err;
            console.error(`[EMAIL] Attempt ${attempt}/${MAX_RETRIES} failed:`, err.message);
            resetTransporter();

            if (attempt < MAX_RETRIES) {
                await new Promise((r) => setTimeout(r, 2000 * attempt));
            }
        }
    }

    throw lastError;
};

const sendInBackground = (payload, label) => {
    setImmediate(async () => {
        try {
            const result = await sendMailWithRetry(payload, SMTP_TIMEOUT_MS);
            console.log(`[EMAIL] Background ${label} success:`, result.messageId);
        } catch (err) {
            console.error(`[EMAIL] Background ${label} failed:`, err.message);
        }
    });
};

const sendEmail = {
    init: initEmailService,

    safe: async (mailPayload, options = {}) => {
        const timeoutMs = options.timeoutMs || API_EMAIL_TIMEOUT_MS;

        try {
            if (!env.emailUser || !env.emailPass) {
                return {
                    emailSent: false,
                    emailError: "Gmail credentials not configured on server",
                    messageId: null,
                };
            }

            const result = await sendMailWithRetry(mailPayload, timeoutMs);

            return {
                emailSent: true,
                emailError: null,
                messageId: result.messageId,
            };
        } catch (err) {
            if (options.backgroundRetry) {
                sendInBackground(mailPayload, options.backgroundRetry);
            }

            return {
                emailSent: false,
                emailError: err.message,
                messageId: null,
                emailQueued: Boolean(options.backgroundRetry),
            };
        }
    },

    approval: async (to, fullName, doctorId) => {
        console.log(`[APPROVE EMAIL] Preparing for ${to} | doctorId: ${doctorId}`);

        const template = approvalTemplate(fullName, doctorId);
        const result = await sendEmail.safe(
            { to, ...template },
            { timeoutMs: API_EMAIL_TIMEOUT_MS, backgroundRetry: "approval" }
        );

        if (result.emailSent) {
            console.log(`[APPROVE EMAIL] Success for ${to}`);
        } else {
            console.error(`[APPROVE EMAIL] Failed for ${to}:`, result.emailError);
            if (result.emailQueued) {
                console.log(`[APPROVE EMAIL] Queued background retry for ${to}`);
            }
        }

        return result;
    },

    rejection: async (to, fullName, rejectionReason) => {
        console.log(`[REJECT EMAIL] Preparing for ${to}`);

        const template = rejectionTemplate(fullName, rejectionReason);
        const result = await sendEmail.safe(
            { to, ...template },
            { timeoutMs: API_EMAIL_TIMEOUT_MS, backgroundRetry: "rejection" }
        );

        if (result.emailSent) {
            console.log(`[REJECT EMAIL] Success for ${to}`);
        } else {
            console.error(`[REJECT EMAIL] Failed for ${to}:`, result.emailError);
            if (result.emailQueued) {
                console.log(`[REJECT EMAIL] Queued background retry for ${to}`);
            }
        }

        return result;
    },

    isConfigured: () => Boolean(env.emailUser && env.emailPass),
    isVerified: () => verified,
};

module.exports = sendEmail;
