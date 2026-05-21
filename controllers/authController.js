const Doctor = require("../models/Doctor");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.registerDoctor = async (req, res) => {

    try {

        const {
            fullName,
            email,
            mobile,
            password,
            qualification,
            yearsOfExperience,
            clinicAddress,
            specialization,
            licenseNumber,
            availability,
            document,
        } = req.body;

        const emailExists = await Doctor.findOne({ email });

        if (emailExists) {
            return res.status(400).json({
                message: "Email already exists",
            });
        }

        const licenseExists = await Doctor.findOne({
            licenseNumber,
        });

        if (licenseExists) {
            return res.status(400).json({
                message: "License already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const doctor = new Doctor({
            fullName,
            email,
            mobile,
            password: hashedPassword,
            qualification,
            yearsOfExperience,
            clinicAddress,
            specialization,
            licenseNumber,
            availability,
            document,
            status: "PENDING",
        });

        await doctor.save();

        res.status(201).json({
            success: true,
            message: "Registration Successful. Waiting for admin approval.",
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }

};

exports.loginDoctor = async (req, res) => {

    try {

        const { email, password } = req.body;

        const doctor = await Doctor.findOne({ email });

        if (!doctor) {
            return res.status(404).json({
                message: "Doctor not found",
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            doctor.password
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid Password",
            });
        }

        if (doctor.status === "PENDING") {
            return res.status(403).json({
                message: "Your profile is under review",
            });
        }

        if (doctor.status === "REJECTED") {
            return res.status(403).json({
                message: doctor.rejectionReason,
            });
        }

        const token = jwt.sign(
            { id: doctor._id },
            process.env.JWT_SECRET
        );

        res.json({
            success: true,
            token,
            doctorId: doctor.doctorId,
            doctor,
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }

};