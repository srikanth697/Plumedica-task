const nodemailer = require("nodemailer");

const EMAIL_TIMEOUT_MS = Number(process.env.EMAIL_TIMEOUT_MS || 10000);
const EMAIL_MAX_RETRIES = 1;

let cachedTransporter = null;

const withTimeout = (promise, ms, label = "Operation") =>
    Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
        }),
    ]);

const getEmailConfig = () => {
    const user = process.env.EMAIL_USER?.trim();
    const pass = process.env.EMAIL_PASS?.replace(/\s/g, "");

    return { user, pass };
};

const createGmailTransporter = (port, secure) => {
    const { user, pass } = getEmailConfig();

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port,
        secure,
        auth: { user, pass },
        connectionTimeout: EMAIL_TIMEOUT_MS,
        greetingTimeout: EMAIL_TIMEOUT_MS,
        socketTimeout: EMAIL_TIMEOUT_MS,
        pool: false,
        family: 4,
        tls: {
            minVersion: "TLSv1.2",
            rejectUnauthorized: true,
        },
    });
};

const getTransporter = () => {
    const { user, pass } = getEmailConfig();

    if (!user || !pass) {
        throw new Error("EMAIL_USER and EMAIL_PASS must be set in environment variables");
    }

    if (cachedTransporter) {
        return cachedTransporter;
    }

    cachedTransporter = createGmailTransporter(465, true);
    return cachedTransporter;
};

const verifyEmailConnection = async () => {
    try {
        const transporter = getTransporter();
        await withTimeout(transporter.verify(), EMAIL_TIMEOUT_MS, "SMTP verify");
        return { ok: true, message: "Email service connected" };
    } catch (error) {
        cachedTransporter = null;
        return { ok: false, message: error.message };
    }
};

const sendViaGmail = async ({ to, subject, text, html }) => {
    const transporter = getTransporter();
    const from = process.env.EMAIL_USER?.trim();

    const info = await withTimeout(
        transporter.sendMail({
            from: `"Plumedica" <${from}>`,
            to,
            subject,
            text,
            html,
        }),
        EMAIL_TIMEOUT_MS,
        "sendMail"
    );

    return { messageId: info.messageId, provider: "gmail" };
};

const sendViaResend = async ({ to, subject, text, html }) => {
    const apiKey = process.env.RESEND_API_KEY?.trim();

    if (!apiKey) {
        throw new Error("RESEND_API_KEY not configured");
    }

    const from = process.env.EMAIL_FROM || `Plumedica <${process.env.EMAIL_USER}>`;

    const response = await withTimeout(
        fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from,
                to: [to],
                subject,
                text,
                html,
            }),
        }),
        EMAIL_TIMEOUT_MS,
        "Resend API"
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || data.error || "Resend API failed");
    }

    return { messageId: data.id, provider: "resend" };
};

const sendEmail = async (to, subject, text, html = null) => {
    const payload = {
        to,
        subject,
        text,
        html: html || text.replace(/\n/g, "<br>"),
    };

    if (process.env.RESEND_API_KEY?.trim()) {
        try {
            return await sendViaResend(payload);
        } catch (error) {
            console.error("Resend failed, trying Gmail:", error.message);
        }
    }

    return sendViaGmail(payload);
};

sendEmail.withRetry = async (to, subject, text, html = null) => {
    let lastError = null;

    for (let attempt = 1; attempt <= EMAIL_MAX_RETRIES; attempt++) {
        try {
            return await withTimeout(
                sendEmail(to, subject, text, html),
                EMAIL_TIMEOUT_MS,
                "Email send"
            );
        } catch (error) {
            lastError = error;
            cachedTransporter = null;
            console.error(`Email attempt ${attempt}/${EMAIL_MAX_RETRIES} failed:`, error.message);
        }
    }

    throw lastError;
};

sendEmail.safe = async (to, subject, text, html = null) => {
    try {
        const result = await sendEmail.withRetry(to, subject, text, html);
        return { emailSent: true, emailError: null, ...result };
    } catch (error) {
        console.error("Email safe send failed:", error.message);
        return { emailSent: false, emailError: error.message, messageId: null, provider: null };
    }
};

sendEmail.sendInBackground = (to, subject, text, html = null) => {
    setImmediate(async () => {
        try {
            const result = await sendEmail.withRetry(to, subject, text, html);
            console.log(`Background email sent to ${to}:`, result.messageId);
        } catch (error) {
            console.error(`Background email failed for ${to}:`, error.message);
        }
    });
};

module.exports = sendEmail;
module.exports.verifyEmailConnection = verifyEmailConnection;
