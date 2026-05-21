require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const seedAdmin = require("./utils/seedAdmin");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const requiredEnv = ["MONGO_URI", "JWT_SECRET", "RESEND_API_KEY"];

for (const key of requiredEnv) {
    if (!process.env[key]?.trim()) {
        console.error(`Missing required env: ${key}`);
    }
}

mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("MongoDB connected");
        await seedAdmin();
        console.log("Admin ready");
    })
    .catch((err) => console.error("MongoDB error:", err.message));

app.get("/", (_, res) => {
    res.status(200).send("Plumedica Backend Running");
});

app.get("/health", (_, res) => {
    res.status(200).json({
        success: true,
        message: "Plumedica API is healthy",
        timestamp: new Date().toISOString(),
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);

    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || "field";
        return res.status(400).json({ success: false, message: `${field} already exists` });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error",
    });
});

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection:", reason);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
