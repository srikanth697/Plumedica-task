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

const parseSender = () => {
    const email = get("BREVO_SENDER_EMAIL") || "srikanthparimisetty93@gmail.com";
    const name = get("BREVO_SENDER_NAME") || "Plumedica";

    return { name, email };
};

const env = {
    port: get("PORT") || "5000",
    mongoUri: get("MONGO_URI"),
    jwtSecret: get("JWT_SECRET"),
    brevoApiKey: get("BREVO_API_KEY"),
    brevoSender: parseSender(),
    adminEmail: get("ADMIN_EMAIL") || "admin@plumedica.com",
    adminPassword: get("ADMIN_PASSWORD") || "Plumedica@admin123",
    nodeEnv: get("NODE_ENV") || "development",
};

const maskKey = (key) => {
    if (!key) return "MISSING";
    if (key.length <= 10) return "***";
    return `${key.slice(0, 8)}...${key.slice(-4)}`;
};

const logEnvStatus = () => {
    console.log("========== ENV STATUS ==========");
    console.log(`NODE_ENV: ${env.nodeEnv}`);
    console.log(`MONGO_URI: ${env.mongoUri ? "loaded" : "MISSING"}`);
    console.log(`JWT_SECRET: ${env.jwtSecret ? "loaded" : "MISSING"}`);
    console.log(`BREVO_API_KEY: ${maskKey(env.brevoApiKey)}`);
    console.log(`BREVO_SENDER: ${env.brevoSender.name} <${env.brevoSender.email}>`);
    console.log("================================");

    if (!env.brevoApiKey) {
        console.error(
            "[EMAIL] BREVO_API_KEY missing. Add it in Render Environment, then redeploy."
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
