const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const { normalizeLoginBody } = require("../utils/normalizeBody");
const { seedAdmin } = require("../utils/seedAdmin");

exports.loginAdmin = async (req, res) => {

    try {

        const { email, password } = normalizeLoginBody(req.body);

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        let admin = await Admin.findOne({
            email: email.trim().toLowerCase(),
        });

        if (!admin) {
            await seedAdmin();
            admin = await Admin.findOne({
                email: email.trim().toLowerCase(),
            });
        }

        if (!admin) {
            return res.status(500).json({
                message: "Admin account not available. Contact support.",
            });
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid admin email or password",
            });
        }

        const token = jwt.sign(
            { role: "admin", email: admin.email, id: admin._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            message: "Admin login successful",
            token,
            role: "admin",
            email: admin.email,
        });

    } catch (error) {

        console.error("Admin login error:", error);

        res.status(500).json({
            message: error.message || "Admin login failed",
        });

    }

};
