const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const get = (key) => {
    const value = process.env[key];

    if (value == null) {
        return "";
    }

    return String(value).trim();
};

const env = {
    port: get("PORT") || "5000",
    mongoUri: get("MONGO_URI"),
    jwtSecret: get("JWT_SECRET"),
    emailHost: get("EMAIL_HOST") || "smtp-relay.brevo.com",
    emailPort: Number(get("EMAIL_PORT") || "587"),
    emailUser: get("EMAIL_USER"),
    emailPass: get("EMAIL_PASS"),
    emailFrom: get("EMAIL_FROM") || "Plumedica <noreply@plumedica.com>",
    adminEmail: get("ADMIN_EMAIL") || "admin@plumedica.com",
    adminPassword: get("ADMIN_PASSWORD") || "Plumedica@admin123",
    nodeEnv: get("NODE_ENV") || "development",
};

const logEnvStatus = () => {
    console.log("========== ENV STATUS ==========");
    console.log(`NODE_ENV: ${env.nodeEnv}`);
    console.log(`MONGO_URI: ${env.mongoUri ? "loaded" : "MISSING"}`);
    console.log(`JWT_SECRET: ${env.jwtSecret ? "loaded" : "MISSING"}`);
    console.log(`EMAIL_HOST: ${env.emailHost}`);
    console.log(`EMAIL_PORT: ${env.emailPort}`);
    console.log(`EMAIL_USER: ${env.emailUser || "MISSING"}`);
    console.log(`EMAIL_PASS: ${env.emailPass ? "loaded" : "MISSING"}`);
    console.log(`EMAIL_FROM: ${env.emailFrom}`);
    console.log("================================");

    if (!env.emailUser || !env.emailPass) {
        console.error(
            "[EMAIL] Set EMAIL_USER and EMAIL_PASS (Brevo SMTP) in Render Environment, then redeploy."
        );
    }
};

const validateRequired = () => {
    const missing = [];

    if (!env.mongoUri) missing.push("MONGO_URI");
    if (!env.jwtSecret) missing.push("JWT_SECRET");

    if (missing.length) {
        console.error(`[ENV] Missing required: ${missing.join(", ")}`);
    }

    return missing;
};

module.exports = { env, logEnvStatus, validateRequired };
