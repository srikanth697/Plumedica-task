const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Doctor = require("../models/Doctor");
const { normalizeRegisterBody, normalizeLoginBody } = require("../utils/normalizeBody");

exports.register = async (req, res) => {
    try {
        const body = normalizeRegisterBody(req.body);
        const {
            fullName, email, mobile, password,
            qualification, experience, clinicAddress,
            specialization, licenseNumber, availability,
        } = body;

        if (!fullName || !email || !mobile || !password || !licenseNumber) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
                required: ["fullName", "email", "mobile", "password", "licenseNumber"],
            });
        }

        if (await Doctor.findOne({ email })) {
            return res.status(400).json({ success: false, message: "Email already exists" });
        }

        if (await Doctor.findOne({ licenseNumber })) {
            return res.status(400).json({ success: false, message: "License already exists" });
        }

        const doctor = await Doctor.create({
            fullName,
            email,
            mobile,
            password: await bcrypt.hash(password, 10),
            qualification,
            experience,
            clinicAddress,
            specialization,
            licenseNumber,
            availability,
            status: "PENDING",
        });

        return res.status(201).json({
            success: true,
            message: "Registration successful. Waiting for admin approval.",
            doctorId: doctor._id,
        });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0] || "field";
            return res.status(400).json({ success: false, message: `${field} already exists` });
        }

        console.error("Register error:", error);
        return res.status(500).json({ success: false, message: "Registration failed" });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = normalizeLoginBody(req.body);

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const doctor = await Doctor.findOne({ email });

        if (!doctor) {
            return res.status(404).json({ success: false, message: "Doctor not found" });
        }

        const validPassword = await bcrypt.compare(password, doctor.password);

        if (!validPassword) {
            return res.status(400).json({ success: false, message: "Invalid password" });
        }

        if (doctor.status === "PENDING") {
            return res.status(403).json({
                success: false,
                message: "Your profile is under review",
            });
        }

        if (doctor.status === "REJECTED") {
            return res.status(403).json({
                success: false,
                message: doctor.rejectionReason || "Your application was rejected",
            });
        }

        const token = jwt.sign(
            { id: doctor._id, role: "doctor", email: doctor.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            role: "doctor",
            doctorId: doctor.doctorId,
            doctor: {
                _id: doctor._id,
                fullName: doctor.fullName,
                email: doctor.email,
                mobile: doctor.mobile,
                status: doctor.status,
                doctorId: doctor.doctorId,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ success: false, message: "Login failed" });
    }
};
