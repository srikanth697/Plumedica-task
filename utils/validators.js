const {
    isDummyEmail,
    isDummyName,
    isValidEmailFormat,
    isValidMobileFormat,
    isValidNameFormat,
} = require("./doctorQuality");

const MIN_PASSWORD_LENGTH = 6;

exports.sanitizeString = (value) => {
    if (value == null) return "";
    return String(value).replace(/\s+/g, " ").trim();
};

exports.isValidEmail = (email) => isValidEmailFormat(email) && !isDummyEmail(email);

exports.isValidPassword = (password, minLength = MIN_PASSWORD_LENGTH) => {
    if (!password || typeof password !== "string") return false;
    const value = password.trim();
    if (value.length < minLength) return false;
    if (/^(.)\1+$/.test(value)) return false;
    if (value === "123456" || value === "password" || value === "12345678") return false;
    return true;
};

exports.isValidMobile = (mobile) => isValidMobileFormat(mobile);

exports.isValidFullName = (name) => isValidNameFormat(name) && !isDummyName(name);

exports.validateRegisterInput = (body) => {
    const errors = [];

    const fullName = exports.sanitizeString(body.fullName);
    const email = exports.sanitizeString(body.email).toLowerCase();
    const mobile = exports.sanitizeString(body.mobile);
    const password = body.password ? String(body.password) : "";
    const qualification = exports.sanitizeString(body.qualification);
    const clinicAddress = exports.sanitizeString(body.clinicAddress);
    const licenseNumber = exports.sanitizeString(body.licenseNumber);
    const experience = exports.sanitizeString(body.experience);
    const specialization = exports.sanitizeString(body.specialization);
    const availability = exports.sanitizeString(body.availability);

    if (!fullName) errors.push("fullName is required");
    else if (!exports.isValidFullName(fullName)) errors.push("fullName must be a valid name (min 2 letters)");

    if (!email) errors.push("email is required");
    else if (!isValidEmailFormat(email)) errors.push("email format is invalid");
    else if (isDummyEmail(email)) errors.push("email is not allowed for registration");

    if (!mobile) errors.push("mobile is required");
    else if (!exports.isValidMobile(mobile)) errors.push("mobile must be a valid 10-digit number");

    if (!password) errors.push("password is required");
    else if (!exports.isValidPassword(password)) errors.push(`password must be at least ${MIN_PASSWORD_LENGTH} characters and not a common value`);

    if (!qualification) errors.push("qualification is required");
    if (!clinicAddress) errors.push("clinicAddress is required");
    if (!licenseNumber) errors.push("licenseNumber is required");
    else if (licenseNumber.length < 4) errors.push("licenseNumber is invalid");

    return {
        valid: errors.length === 0,
        errors,
        normalized: {
            fullName,
            email,
            mobile: mobile.replace(/\D/g, "").slice(-10),
            password,
            qualification,
            clinicAddress,
            licenseNumber,
            experience,
            specialization,
            availability,
        },
    };
};
