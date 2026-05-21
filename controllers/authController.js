const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Doctor = require("../models/Doctor");
const { normalizeRegisterBody, normalizeLoginBody } = require("../utils/normalizeBody");
const { validateRegisterInput, sanitizeString } = require("../utils/validators");
const { parseRegistrationFiles } = require("../utils/parseFiles");
const { sendSuccess, sendError } = require("../utils/apiResponse");

const toPublicDoctor = (doctor) => ({
    _id: doctor._id,
    fullName: doctor.fullName,
    email: doctor.email,
    mobile: doctor.mobile,
    qualification: doctor.qualification,
    experience: doctor.experience,
    clinicAddress: doctor.clinicAddress,
    specialization: doctor.specialization,
    licenseNumber: doctor.licenseNumber,
    availability: doctor.availability,
    profilePhoto: doctor.profilePhoto,
    documents: doctor.documents || [],
    status: doctor.status,
    doctorId: doctor.doctorId || null,
    rejectionReason: doctor.rejectionReason || null,
    createdAt: doctor.createdAt,
    updatedAt: doctor.updatedAt,
});

exports.register = async (req, res) => {
    try {
        const body = normalizeRegisterBody(req.body);
        const validation = validateRegisterInput(body);

        if (!validation.valid) {
            return sendError(res, 400, validation.errors.join(", "));
        }

        const {
            fullName,
            email,
            mobile,
            password,
            licenseNumber,
        } = validation.normalized;

        const {
            qualification,
            experience,
            clinicAddress,
            specialization,
            availability,
        } = body;

        if (await Doctor.findOne({ email })) {
            return sendError(res, 400, "Email already exists");
        }

        if (await Doctor.findOne({ licenseNumber })) {
            return sendError(res, 400, "License number already exists");
        }

        const { profilePhoto, documents } = parseRegistrationFiles(req.files);

        const doctor = await Doctor.create({
            fullName,
            email,
            mobile: mobile.replace(/\D/g, "").slice(-10),
            password: await bcrypt.hash(password, 10),
            qualification: sanitizeString(qualification),
            experience: sanitizeString(experience),
            clinicAddress: sanitizeString(clinicAddress),
            specialization: sanitizeString(specialization),
            licenseNumber,
            availability: sanitizeString(availability),
            profilePhoto,
            documents,
            status: "PENDING",
        });

        return res.status(201).json({
            success: true,
            message: "Registration submitted successfully",
            status: "PENDING",
            data: { doctorId: doctor._id },
        });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0] || "field";
            return sendError(res, 400, `${field} already exists`);
        }

        console.error("Register error:", error);
        return sendError(res, 500, "Registration failed");
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = normalizeLoginBody(req.body);
        const normalizedEmail = sanitizeString(email).toLowerCase();

        if (!normalizedEmail || !password) {
            return sendError(res, 400, "Email and password are required");
        }

        const doctor = await Doctor.findOne({ email: normalizedEmail });

        if (!doctor) {
            return sendError(res, 404, "Doctor not found");
        }

        const validPassword = await bcrypt.compare(password, doctor.password);

        if (!validPassword) {
            return sendError(res, 400, "Invalid password");
        }

        if (doctor.status === "PENDING") {
            return res.status(403).json({
                success: false,
                status: "PENDING",
                message: "Your profile is under review",
            });
        }

        if (doctor.status === "REJECTED") {
            return res.status(403).json({
                success: false,
                status: "REJECTED",
                message: "Application rejected",
                rejectionReason: doctor.rejectionReason || "Application rejected",
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
            data: toPublicDoctor(doctor),
            doctor: toPublicDoctor(doctor),
        });
    } catch (error) {
        console.error("Login error:", error);
        return sendError(res, 500, "Login failed");
    }
};

const resolveCheckStatusEmail = (req) => {
    const raw =
        req.query?.email ||
        req.body?.email ||
        req.params?.email ||
        req.params?.[0] ||
        "";

    return decodeURIComponent(String(raw)).trim().toLowerCase();
};

exports.checkStatus = async (req, res) => {
    try {
        const email = resolveCheckStatusEmail(req);

        if (!email) {
            return sendError(res, 400, "Email is required");
        }

        const doctor = await Doctor.findOne({ email }).select("-password");

        if (!doctor) {
            return sendError(res, 404, "Doctor not found");
        }

        if (doctor.status === "PENDING") {
            return res.status(200).json({
                success: true,
                status: "PENDING",
                message: "Your profile is under review",
                data: { email: doctor.email, status: "PENDING" },
            });
        }

        if (doctor.status === "REJECTED") {
            return res.status(200).json({
                success: true,
                status: "REJECTED",
                message: "Application rejected",
                rejectionReason: doctor.rejectionReason || "Application rejected",
                data: {
                    email: doctor.email,
                    status: "REJECTED",
                    rejectionReason: doctor.rejectionReason,
                },
            });
        }

        return res.status(200).json({
            success: true,
            status: "APPROVED",
            message: "Your application is approved",
            data: {
                email: doctor.email,
                status: "APPROVED",
                doctorId: doctor.doctorId,
            },
        });
    } catch (error) {
        console.error("Check status error:", error);
        return sendError(res, 500, "Failed to check status");
    }
};

exports.getProfile = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.user.id).select("-password");

        if (!doctor) {
            return sendError(res, 404, "Doctor not found");
        }

        return sendSuccess(res, 200, "Profile fetched successfully", toPublicDoctor(doctor));
    } catch (error) {
        console.error("Profile error:", error);
        return sendError(res, 500, "Failed to fetch profile");
    }
};
