const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        mobile: { type: String, required: true, trim: true },
        password: { type: String, required: true },
        qualification: { type: String, trim: true },
        experience: { type: String, trim: true },
        clinicAddress: { type: String, trim: true },
        specialization: { type: String, trim: true },
        licenseNumber: { type: String, required: true, unique: true, trim: true },
        availability: { type: String, trim: true },
        doctorId: { type: String, trim: true },
        profilePhoto: { type: String, trim: true },
        documents: [{ type: String, trim: true }],
        rejectionReason: { type: String, trim: true },
        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED"],
            default: "PENDING",
        },
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date },
        deletedReason: { type: String, trim: true },
    },
    { timestamps: true }
);

doctorSchema.index({ email: 1, isDeleted: 1 });
doctorSchema.index({ licenseNumber: 1, isDeleted: 1 });

module.exports = mongoose.model("Doctor", doctorSchema);
