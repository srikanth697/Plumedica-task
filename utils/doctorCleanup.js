const Doctor = require("../models/Doctor");
const { deleteDoctorFiles } = require("./fileCleanup");
const {
    isInvalidDoctorRecord,
    isDummyEmail,
    isDummyName,
} = require("./doctorQuality");

exports.removeDoctorCompletely = async (doctor) => {
    if (!doctor) return { files: { attempted: 0, deleted: 0 }, removed: false };

    const files = deleteDoctorFiles(doctor);
    await Doctor.findByIdAndDelete(doctor._id);

    return { files, removed: true, email: doctor.email };
};

exports.cleanupInvalidDoctors = async () => {
    const candidates = await Doctor.find({});

    const results = [];

    for (const doctor of candidates) {
        const shouldRemove =
            doctor.isDeleted ||
            isInvalidDoctorRecord(doctor) ||
            isDummyEmail(doctor.email) ||
            isDummyName(doctor.fullName);

        if (!shouldRemove) continue;

        const result = await exports.removeDoctorCompletely(doctor);
        results.push({
            id: doctor._id,
            email: doctor.email,
            reason: doctor.isDeleted ? "soft-deleted" : "invalid-or-dummy",
            ...result,
        });
    }

    return {
        scanned: candidates.length,
        removed: results.length,
        results,
    };
};
