const nodemailer = require("nodemailer");
const { env } = require("../config/env");
const { approvalTemplate, rejectionTemplate } = require("./emailTemplates");

const API_EMAIL_TIMEOUT_MS = 20000;
const SMTP_TIMEOUT_MS = 45000;
const MAX_RETRIES = 2;

let transporter = null;
let verified = false;

const ok = (extra = {}) => ({ success: true, error: null, ...extra });
const fail = (error, extra = {}) => ({ success: false, error, ...extra });

const withTimeout = (promise, ms, label) =>
    Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
        }),
    ]);

const createTransporter = () =>
    nodemailer.createTransport({
        host: env.emailHost,
        port: env.emailPort,
        secure: false,
        requireTLS: true,
        auth: {
            user: env.emailUser,
            pass: env.emailPass,
        },
        pool: true,
        maxConnections: 2,
        maxMessages: 50,
        connectionTimeout: SMTP_TIMEOUT_MS,
        greetingTimeout: SMTP_TIMEOUT_MS,
        socketTimeout: SMTP_TIMEOUT_MS,
        family: 4,
        tls: {
            minVersion: "TLSv1.2",
            rejectUnauthorized: true,
        },
    });

const safeCloseTransporter = () => {
    if (!transporter) {
        return;
    }

    try {
        const closeResult = transporter.close();

        if (closeResult && typeof closeResult.then === "function") {
            closeResult.catch((err) => {
                console.warn("[EMAIL] Transporter close warning:", err.message);
            });
        }
    } catch (err) {
        console.warn("[EMAIL] Transporter close warning:", err.message);
    }
};

const resetTransporter = () => {
    safeCloseTransporter();
    transporter = null;
    verified = false;
};

const getTransporter = () => {
    if (!env.emailUser || !env.emailPass) {
        throw new Error("EMAIL_USER and EMAIL_PASS are not configured");
    }

    if (!transporter) {
        transporter = createTransporter();
        console.log(`[EMAIL] Brevo SMTP pool ready (${env.emailHost}:${env.emailPort})`);
    }

    return transporter;
};

const verifyConnection = async () => {
    const transport = getTransporter();

    console.log("[EMAIL] Verifying Brevo SMTP connection...");

    await withTimeout(transport.verify(), SMTP_TIMEOUT_MS, "Brevo SMTP verify");

    verified = true;
    console.log("[EMAIL] Brevo SMTP verified successfully");
};

const initEmailService = async () => {
    if (!env.emailUser || !env.emailPass) {
        console.error("[EMAIL] Skipping verify — Brevo credentials missing");
        return false;
    }

    try {
        await verifyConnection();
        return true;
    } catch (err) {
        console.error("[EMAIL] Brevo verify failed:", err.message);
        resetTransporter();
        return false;
    }
};

const sendMailOnce = async ({ to, subject, html, text }) => {
    const transport = getTransporter();

    console.log(`[EMAIL] Sending via Brevo to: ${to} | subject: ${subject}`);

    const info = await transport.sendMail({
        from: env.emailFrom,
        to,
        subject,
        html,
        text,
    });

    console.log("[EMAIL] Brevo sent successfully | messageId:", info.messageId);

    return { messageId: info.messageId, provider: "brevo" };
};

const sendMailWithRetry = async (payload, timeoutMs = SMTP_TIMEOUT_MS) => {
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            return await withTimeout(sendMailOnce(payload), timeoutMs, "Brevo sendMail");
        } catch (err) {
            lastError = err;
            console.error(`[EMAIL] Attempt ${attempt}/${MAX_RETRIES} failed:`, err.message);
            resetTransporter();

            if (attempt < MAX_RETRIES) {
                await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
            }
        }
    }

    throw lastError;
};

const runBackgroundSend = (payload, label) => {
    setImmediate(async () => {
        try {
            const result = await sendMailWithRetry(payload, SMTP_TIMEOUT_MS);
            console.log(`[EMAIL] Background ${label} success:`, result.messageId);
        } catch (err) {
            console.error(`[EMAIL] Background ${label} failed:`, err.message);
        }
    });
};

const sendEmail = async (mailPayload, options = {}) => {
    const timeoutMs = options.timeoutMs || API_EMAIL_TIMEOUT_MS;

    try {
        if (!env.emailUser || !env.emailPass) {
            console.error("[EMAIL] Brevo EMAIL_USER or EMAIL_PASS missing");
            return fail("Brevo SMTP credentials not configured on server", {
                emailSent: false,
                messageId: null,
            });
        }

        const result = await sendMailWithRetry(mailPayload, timeoutMs);

        return ok({
            emailSent: true,
            messageId: result.messageId,
            provider: result.provider,
        });
    } catch (err) {
        console.error("[EMAIL] Brevo send failed:", err.message);

        if (options.backgroundRetry) {
            runBackgroundSend(mailPayload, options.backgroundRetry);
        }

        return fail(err.message, {
            emailSent: false,
            messageId: null,
            emailQueued: Boolean(options.backgroundRetry),
        });
    }
};

sendEmail.init = initEmailService;

sendEmail.approval = async (to, fullName, doctorId) => {
    console.log(`[APPROVE EMAIL] Preparing for ${to} | doctorId: ${doctorId}`);

    const template = approvalTemplate(fullName, doctorId);
    const result = await sendEmail(
        { to, ...template },
        { timeoutMs: API_EMAIL_TIMEOUT_MS, backgroundRetry: "approval" }
    );

    if (result.success) {
        console.log(`[APPROVE EMAIL] Success for ${to}`);
    } else {
        console.error(`[APPROVE EMAIL] Failed for ${to}:`, result.error);
    }

    return {
        success: result.success,
        error: result.error,
        emailSent: result.emailSent ?? result.success,
        emailError: result.error,
        messageId: result.messageId ?? null,
        emailQueued: result.emailQueued ?? false,
    };
};

sendEmail.rejection = async (to, fullName, rejectionReason) => {
    console.log(`[REJECT EMAIL] Preparing for ${to}`);

    const template = rejectionTemplate(fullName, rejectionReason);
    const result = await sendEmail(
        { to, ...template },
        { timeoutMs: API_EMAIL_TIMEOUT_MS, backgroundRetry: "rejection" }
    );

    if (result.success) {
        console.log(`[REJECT EMAIL] Success for ${to}`);
    } else {
        console.error(`[REJECT EMAIL] Failed for ${to}:`, result.error);
    }

    return {
        success: result.success,
        error: result.error,
        emailSent: result.emailSent ?? result.success,
        emailError: result.error,
        messageId: result.messageId ?? null,
        emailQueued: result.emailQueued ?? false,
    };
};

sendEmail.isConfigured = () => Boolean(env.emailUser && env.emailPass);
sendEmail.isVerified = () => verified;

module.exports = sendEmail;
