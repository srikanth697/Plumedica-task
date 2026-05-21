const brevo = require("@getbrevo/brevo");
const { env } = require("../config/env");
const { approvalTemplate, rejectionTemplate } = require("./emailTemplates");

let apiInstance = null;

const ok = (extra = {}) => ({ success: true, error: null, ...extra });
const fail = (error, extra = {}) => ({ success: false, error, ...extra });

const getBrevoApi = () => {
    if (!env.brevoApiKey) {
        throw new Error("BREVO_API_KEY is not configured");
    }

    if (!apiInstance) {
        apiInstance = new brevo.TransactionalEmailsApi();
        apiInstance.setApiKey(
            brevo.TransactionalEmailsApiApiKeys.apiKey,
            env.brevoApiKey
        );
        console.log("[EMAIL] Brevo REST API client ready");
    }

    return apiInstance;
};

const sendViaBrevoApi = async ({ to, toName, subject, html, text }) => {
    const api = getBrevoApi();

    const email = new brevo.SendSmtpEmail();
    email.subject = subject;
    email.htmlContent = html;
    email.textContent = text;
    email.sender = {
        name: env.brevoSender.name,
        email: env.brevoSender.email,
    };
    email.to = [{ email: to, name: toName || to }];

    console.log(`[EMAIL] Brevo REST → ${to} | ${subject}`);

    const response = await api.sendTransacEmail(email);

    const messageId = response?.body?.messageId || response?.messageId || "sent";

    console.log("[EMAIL] Brevo REST success | messageId:", messageId);

    return { messageId, provider: "brevo-rest" };
};

const sendEmail = async (mailPayload, options = {}) => {
    try {
        if (!env.brevoApiKey) {
            console.error("[EMAIL] BREVO_API_KEY missing");
            return fail("BREVO_API_KEY is not configured on server", {
                emailSent: false,
                messageId: null,
            });
        }

        const result = await sendViaBrevoApi(mailPayload);

        return ok({
            emailSent: true,
            messageId: result.messageId,
            provider: result.provider,
        });
    } catch (err) {
        const message =
            err?.response?.body?.message ||
            err?.body?.message ||
            err?.message ||
            "Brevo API request failed";

        console.error("[EMAIL] Brevo REST failed:", message);

        if (options.backgroundRetry) {
            setImmediate(async () => {
                try {
                    const retry = await sendViaBrevoApi(mailPayload);
                    console.log(`[EMAIL] Background ${options.backgroundRetry} ok:`, retry.messageId);
                } catch (bgErr) {
                    console.error(`[EMAIL] Background ${options.backgroundRetry} failed:`, bgErr.message);
                }
            });
        }

        return fail(message, {
            emailSent: false,
            messageId: null,
            emailQueued: Boolean(options.backgroundRetry),
        });
    }
};

sendEmail.init = async () => {
    if (!env.brevoApiKey) {
        return false;
    }

    getBrevoApi();
    console.log("[EMAIL] Brevo REST API initialized (no SMTP)");
    return true;
};

sendEmail.approval = async (to, fullName, doctorId) => {
    console.log(`[APPROVE EMAIL] ${to} | doctorId: ${doctorId}`);

    const template = approvalTemplate(fullName, doctorId);
    const result = await sendEmail({
        to,
        toName: fullName,
        ...template,
    });

    if (!result.success) {
        console.error(`[APPROVE EMAIL] Failed:`, result.error);
    }

    return {
        success: result.success,
        error: result.error,
        emailSent: result.success,
        emailError: result.error,
        messageId: result.messageId ?? null,
        emailQueued: result.emailQueued ?? false,
    };
};

sendEmail.rejection = async (to, fullName, rejectionReason) => {
    console.log(`[REJECT EMAIL] ${to}`);

    const template = rejectionTemplate(fullName, rejectionReason);
    const result = await sendEmail({
        to,
        toName: fullName,
        ...template,
    });

    if (!result.success) {
        console.error(`[REJECT EMAIL] Failed:`, result.error);
    }

    return {
        success: result.success,
        error: result.error,
        emailSent: result.success,
        emailError: result.error,
        messageId: result.messageId ?? null,
        emailQueued: result.emailQueued ?? false,
    };
};

sendEmail.isConfigured = () => Boolean(env.brevoApiKey);
sendEmail.isVerified = () => Boolean(env.brevoApiKey);

module.exports = sendEmail;
