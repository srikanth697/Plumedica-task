const nodemailer = require("nodemailer");

const getTransporter = () => {
    const user = process.env.EMAIL_USER?.trim();
    const pass = process.env.EMAIL_PASS?.replace(/\s/g, "");

    if (!user || !pass) {
        throw new Error("EMAIL_USER and EMAIL_PASS must be set in environment variables");
    }

    return nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
    });
};

const sendEmail = async (to, subject, text) => {
    const from = process.env.EMAIL_USER?.trim();

    await getTransporter().sendMail({
        from,
        to,
        subject,
        text,
    });
};

module.exports = sendEmail;