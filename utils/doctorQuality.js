const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MOBILE_REGEX = /^\d{10}$/;
const NAME_REGEX = /^[a-zA-Z][a-zA-Z\s.'-]{1,98}$/;

const DUMMY_EMAIL_PATTERNS = [
    /^test@/i,
    /@test\.com$/i,
    /dummy/i,
    /fake@/i,
    /sample@/i,
    /abc@gmail$/i,
    /123456/,
    /^admin@/i,
    /^user@/i,
];

const DUMMY_NAME_PATTERNS = [
    /^test$/i,
    /^abc$/i,
    /^dummy$/i,
    /^fake$/i,
    /^asdf/i,
    /^123+$/,
    /^user$/i,
    /^doctor$/i,
];

const REQUIRED_FIELDS = [
    "fullName",
    "email",
    "mobile",
    "password",
    "qualification",
    "clinicAddress",
    "licenseNumber",
];

exports.isDummyEmail = (email) => {
    if (!email) return true;
    const value = String(email).trim().toLowerCase();
    return DUMMY_EMAIL_PATTERNS.some((pattern) => pattern.test(value));
};

exports.isDummyName = (name) => {
    if (!name) return true;
    const value = String(name).trim();
    if (value.length < 2) return true;
    return DUMMY_NAME_PATTERNS.some((pattern) => pattern.test(value));
};

exports.isValidEmailFormat = (email) => EMAIL_REGEX.test(String(email || "").trim().toLowerCase());

exports.isValidMobileFormat = (mobile) => MOBILE_REGEX.test(String(mobile || "").replace(/\D/g, ""));

exports.isValidNameFormat = (name) => NAME_REGEX.test(String(name || "").trim());

exports.isCompleteDoctor = (doctor) => {
    if (!doctor || doctor.isDeleted) return false;

    for (const field of REQUIRED_FIELDS) {
        if (field === "password") {
            if (!doctor.password) return false;
            continue;
        }

        const value = doctor[field];
        if (!value || !String(value).trim()) return false;
    }

    if (!exports.isValidEmailFormat(doctor.email)) return false;
    if (!exports.isValidMobileFormat(doctor.mobile)) return false;
    if (exports.isDummyEmail(doctor.email)) return false;
    if (exports.isDummyName(doctor.fullName)) return false;

    return true;
};

exports.isInvalidDoctorRecord = (doctor) => !exports.isCompleteDoctor(doctor);

exports.buildActiveDoctorFilter = (baseFilter = {}) => ({
    ...baseFilter,
    isDeleted: { $ne: true },
    fullName: { $exists: true, $nin: [null, ""] },
    email: { $exists: true, $nin: [null, ""] },
    mobile: { $exists: true, $nin: [null, ""] },
    password: { $exists: true, $nin: [null, ""] },
    qualification: { $exists: true, $nin: [null, ""] },
    clinicAddress: { $exists: true, $nin: [null, ""] },
    licenseNumber: { $exists: true, $nin: [null, ""] },
});

exports.findInvalidDoctorsQuery = () => ({
    isDeleted: { $ne: true },
    $or: [
        { fullName: { $in: [null, ""] } },
        { email: { $in: [null, ""] } },
        { mobile: { $in: [null, ""] } },
        { password: { $in: [null, ""] } },
        { qualification: { $in: [null, ""] } },
        { clinicAddress: { $in: [null, ""] } },
        { licenseNumber: { $in: [null, ""] } },
    ],
});
