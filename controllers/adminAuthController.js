const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const { normalizeLoginBody } = require("../utils/normalizeBody");

exports.login = async (req, res) => {
    try {
        const { email, password } = normalizeLoginBody(req.body);

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const admin = await Admin.findOne({ email: email.trim().toLowerCase() });

        if (!admin) {
            return res.status(401).json({ success: false, message: "Invalid admin credentials" });
        }

        const validPassword = await bcrypt.compare(password, admin.password);

        if (!validPassword) {
            return res.status(401).json({ success: false, message: "Invalid admin credentials" });
        }

        const token = jwt.sign(
            { id: admin._id, role: "admin", email: admin.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            success: true,
            message: "Admin login successful",
            token,
            role: "admin",
            email: admin.email,
        });
    } catch (error) {
        console.error("Admin login error:", error);
        return res.status(500).json({ success: false, message: "Admin login failed" });
    }
};
