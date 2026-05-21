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

const maskKey = (key) => {
    if (!key) return "NOT_SET";
    if (key.length <= 8) return "***";
    return `${key.slice(0, 6)}...${key.slice(-4)}`;
};

const env = {
    port: get("PORT") || "5000",
    mongoUri: get("MONGO_URI"),
    jwtSecret: get("JWT_SECRET"),
    resendApiKey: get("RESEND_API_KEY"),
    emailFrom: get("EMAIL_FROM") || "Plumedica <onboarding@resend.dev>",
    adminEmail: get("ADMIN_EMAIL") || "admin@plumedica.com",
    adminPassword: get("ADMIN_PASSWORD") || "Plumedica@admin123",
    nodeEnv: get("NODE_ENV") || "development",
    isProduction: get("NODE_ENV") === "production",
};

const logEnvStatus = () => {
    console.log("========== ENV STATUS ==========");
    console.log(`NODE_ENV: ${env.nodeEnv}`);
    console.log(`MONGO_URI: ${env.mongoUri ? "loaded" : "MISSING"}`);
    console.log(`JWT_SECRET: ${env.jwtSecret ? "loaded" : "MISSING"}`);
    console.log(`RESEND_API_KEY: ${env.resendApiKey ? maskKey(env.resendApiKey) : "MISSING"}`);
    console.log(`EMAIL_FROM: ${env.emailFrom}`);
    console.log("================================");

    if (!env.resendApiKey) {
        console.error(
            "[EMAIL] RESEND_API_KEY is not set. Add it in Render Dashboard → Environment → RESEND_API_KEY, then redeploy."
        );
    }
};

const validateRequired = () => {
    const missing = [];

    if (!env.mongoUri) missing.push("MONGO_URI");
    if (!env.jwtSecret) missing.push("JWT_SECRET");

    if (missing.length) {
        console.error(`[ENV] Missing required variables: ${missing.join(", ")}`);
    }

    return missing;
};

module.exports = { env, logEnvStatus, validateRequired, maskKey };
