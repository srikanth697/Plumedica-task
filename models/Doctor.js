const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({

    fullName: {
        type: String,
        required: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
    },

    mobile: {
        type: String,
        required: true,
    },

    password: {
        type: String,
        required: true,
    },

    qualification: String,

    yearsOfExperience: String,

    clinicAddress: String,

    specialization: String,

    licenseNumber: {
        type: String,
        required: true,
        unique: true,
    },

    availability: String,

    document: String,

    doctorId: String,

    rejectionReason: String,

    status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        default: "PENDING",
    },

}, {
    timestamps: true,
});

module.exports = mongoose.model("Doctor", doctorSchema);