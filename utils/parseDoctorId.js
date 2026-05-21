const mongoose = require("mongoose");

exports.parseDoctorId = (id) => {
    const cleaned = String(id || "").trim();

    if (!mongoose.Types.ObjectId.isValid(cleaned)) {
        return null;
    }

    return cleaned;
};
