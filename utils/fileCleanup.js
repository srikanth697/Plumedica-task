const fs = require("fs");
const path = require("path");

const uploadsDir = path.join(__dirname, "..", "uploads");

const toLocalPath = (fileUrl) => {
    if (!fileUrl || typeof fileUrl !== "string") return null;

    const normalized = fileUrl.trim();

    if (normalized.startsWith("/uploads/")) {
        return path.join(uploadsDir, path.basename(normalized));
    }

    if (normalized.includes("uploads")) {
        return path.join(uploadsDir, path.basename(normalized));
    }

    return null;
};

const safeUnlink = (filePath) => {
    if (!filePath || !fs.existsSync(filePath)) {
        return false;
    }

    try {
        fs.unlinkSync(filePath);
        console.log(`[FILE CLEANUP] Deleted: ${filePath}`);
        return true;
    } catch (error) {
        console.error(`[FILE CLEANUP] Failed: ${filePath}`, error.message);
        return false;
    }
};

exports.deleteDoctorFiles = (doctor) => {
    const paths = new Set();

    if (doctor?.profilePhoto) {
        const local = toLocalPath(doctor.profilePhoto);
        if (local) paths.add(local);
    }

    if (Array.isArray(doctor?.documents)) {
        for (const doc of doctor.documents) {
            const local = toLocalPath(doc);
            if (local) paths.add(local);
        }
    }

    let deleted = 0;

    for (const filePath of paths) {
        if (safeUnlink(filePath)) deleted += 1;
    }

    return { attempted: paths.size, deleted };
};
