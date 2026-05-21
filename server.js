const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { seedAdmin } = require("./utils/seedAdmin");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
    console.log("MongoDB Connected Successfully");
    try {
        await seedAdmin();
        console.log("Admin account ready");
    } catch (err) {
        console.error("Admin seed error:", err.message);
    }
})
.catch((err) => {
    console.log("Mongo Error:", err);
});

app.get("/", (req, res) => {
    res.send("Backend Running Successfully");
});

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);

    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || "field";
        return res.status(400).json({ message: `${field} already exists` });
    }

    res.status(err.status || 500).json({
        message: err.message || "Internal server error",
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server Running On ${PORT}`);
});
