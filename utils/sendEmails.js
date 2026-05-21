const nodemailer = require("nodemailer");

let cachedTransporter = null;

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
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
        pool: true,
        maxConnections: 1,
        family: 4,
        tls: {
            minVersion: "TLSv1.2",
            rejectUnauthorized: true,
        },
    });
};

const getTransporter = async () => {
    const { user, pass } = getEmailConfig();

    if (!user || !pass) {
        throw new Error("EMAIL_USER and EMAIL_PASS must be set in environment variables");
    }

    if (cachedTransporter) {
        return cachedTransporter;
    }

    const configs = [
        { port: 465, secure: true },
        { port: 587, secure: false },
    ];

    let lastError = null;

    for (const cfg of configs) {
        try {
            const transporter = createGmailTransporter(cfg.port, cfg.secure);
            await transporter.verify();
            cachedTransporter = transporter;
            console.log(`Email ready via smtp.gmail.com:${cfg.port}`);
            return transporter;
        } catch (error) {
            lastError = error;
            console.error(`SMTP port ${cfg.port} failed:`, error.message);
        }
    }

    throw lastError || new Error("Could not connect to Gmail SMTP");
};

const verifyEmailConnection = async () => {
    try {
        await getTransporter();
        return { ok: true, message: "Email service connected" };
    } catch (error) {
        return { ok: false, message: error.message };
    }
};

const sendViaGmail = async ({ to, subject, text, html }) => {
    const transporter = await getTransporter();
    const from = process.env.EMAIL_USER?.trim();

    const info = await transporter.sendMail({
        from: `"Plumedica" <${from}>`,
        to,
        subject,
        text,
        html,
    });

    return { messageId: info.messageId, provider: "gmail" };
};

const sendViaResend = async ({ to, subject, text, html }) => {
    const apiKey = process.env.RESEND_API_KEY?.trim();

    if (!apiKey) {
        throw new Error("RESEND_API_KEY not configured");
    }

    const from = process.env.EMAIL_FROM || `Plumedica <${process.env.EMAIL_USER}>`;

    const response = await fetch("https://api.resend.com/emails", {
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
    });

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

sendEmail.withRetry = async (to, subject, text, html = null, retries = 3) => {
    let lastError = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await sendEmail(to, subject, text, html);
        } catch (error) {
            lastError = error;
            cachedTransporter = null;
            console.error(`Email attempt ${attempt}/${retries} failed:`, error.message);

            if (attempt < retries) {
                await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
            }
        }
    }

    throw lastError;
};

module.exports = sendEmail;
module.exports.verifyEmailConnection = verifyEmailConnection;
