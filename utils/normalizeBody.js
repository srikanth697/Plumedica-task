const REGISTER_FIELDS = {
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
    "license number": "licenseNumber",
    availability: "availability",
    document: "document",
    "medical document": "document",
    "upload document": "document",
    "profile photo": "document",
    photo: "document",
    file: "document",
};

const REGISTER_KEYS = [
    "fullName",
    "email",
    "mobile",
    "password",
    "qualification",
    "experience",
    "clinicAddress",
    "specialization",
    "licenseNumber",
    "availability",
    "document",
];

const normalizeFields = (body, fieldMap, directKeys) => {
    if (!body || typeof body !== "object") {
        return {};
    }

    const result = {};

    for (const key of directKeys) {
        if (body[key] != null && String(body[key]).trim() !== "") {
            result[key] = String(body[key]).trim();
        }
    }

    for (const [key, value] of Object.entries(body)) {
        if (value == null || String(value).trim() === "") {
            continue;
        }

        const mappedKey = fieldMap[key.trim().toLowerCase()];

        if (mappedKey) {
            result[mappedKey] = String(value).trim();
        }
    }

    return result;
};

exports.normalizeRegisterBody = (body) =>
    normalizeFields(body, REGISTER_FIELDS, REGISTER_KEYS);

exports.normalizeLoginBody = (body) => {
    const normalized = normalizeFields(
        body,
        {
            email: "email",
            "email address": "email",
            password: "password",
        },
        ["email", "password"]
    );

    return normalized;
};
