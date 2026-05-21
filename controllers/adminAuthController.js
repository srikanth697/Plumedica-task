const jwt = require("jsonwebtoken");
const { normalizeLoginBody } = require("../utils/normalizeBody");

exports.loginAdmin = async (req, res) => {

    try {

        const { email, password } = normalizeLoginBody(req.body);

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            return res.status(500).json({
                message: "Admin credentials not configured on server",
            });
        }

        if (
            email.trim().toLowerCase() !== adminEmail ||
            password !== adminPassword
        ) {
            return res.status(401).json({
                message: "Invalid admin email or password",
            });
        }

        const token = jwt.sign(
            { role: "admin", email: adminEmail },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            message: "Admin login successful",
            token,
            role: "admin",
            email: adminEmail,
        });

    } catch (error) {

        res.status(500).json({
            message: error.message || "Admin login failed",
        });

    }

};
