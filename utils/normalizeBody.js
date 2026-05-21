const FIELD_MAP = {
    fullname: "fullName",
    "full name": "fullName",
    email: "email",
    "email address": "email",
    mobile: "mobile",
    "mobile number": "mobile",
    password: "password",
    qualification: "qualification",
    experience: "experience",
    "years of experience": "experience",
    clinicaddress: "clinicAddress",
    "clinic address": "clinicAddress",
    specialization: "specialization",
    licensenumber: "licenseNumber",
    "medical license number": "licenseNumber",
    availability: "availability",
};

const normalize = (body, keys) => {
    if (!body || typeof body !== "object") return {};

    const result = {};

    for (const key of keys) {
        if (body[key] != null && String(body[key]).trim() !== "") {
            result[key] = String(body[key]).trim();
        }
    }

    for (const [key, value] of Object.entries(body)) {
        if (value == null || String(value).trim() === "") continue;
        const mapped = FIELD_MAP[key.trim().toLowerCase()];
        if (mapped) result[mapped] = String(value).trim();
    }

    return result;
};

const REGISTER_KEYS = [
    "fullName", "email", "mobile", "password", "qualification",
    "experience", "clinicAddress", "specialization", "licenseNumber", "availability",
];

exports.normalizeRegisterBody = (body) => normalize(body, REGISTER_KEYS);

exports.normalizeLoginBody = (body) =>
    normalize(body, ["email", "password"]);

const REJECT_FIELD_MAP = {
    rejectionreason: "rejectionReason",
    "rejection reason": "rejectionReason",
    reason: "rejectionReason",
    rejectreason: "rejectionReason",
};

exports.normalizeRejectBody = (body) => {
    if (!body || typeof body !== "object") {
        return { rejectionReason: "" };
    }

    const result = normalize(body, ["rejectionReason"]);

    for (const [key, value] of Object.entries(body)) {
        if (value == null || String(value).trim() === "") continue;
        const mapped = REJECT_FIELD_MAP[key.trim().toLowerCase()];
        if (mapped) result[mapped] = String(value).trim();
    }

    return result;
};
