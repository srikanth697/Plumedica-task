const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^\d{10}$/;

exports.isValidEmail = (email) => {
    if (!email || typeof email !== "string") return false;
    return EMAIL_REGEX.test(email.trim().toLowerCase());
};

exports.isValidPassword = (password, minLength = 6) => {
    if (!password || typeof password !== "string") return false;
    return password.length >= minLength;
};

exports.isValidMobile = (mobile) => {
    if (!mobile || typeof mobile !== "string") return false;
    const digits = mobile.replace(/\D/g, "");
    return MOBILE_REGEX.test(digits);
};

exports.sanitizeString = (value) => {
    if (value == null) return "";
    return String(value).trim();
};

exports.validateRegisterInput = (body) => {
    const errors = [];
    const fullName = exports.sanitizeString(body.fullName);
    const email = exports.sanitizeString(body.email).toLowerCase();
    const mobile = exports.sanitizeString(body.mobile);
    const password = body.password ? String(body.password) : "";
    const licenseNumber = exports.sanitizeString(body.licenseNumber);

    if (!fullName) errors.push("fullName is required");
    if (!email) errors.push("email is required");
    else if (!exports.isValidEmail(email)) errors.push("email format is invalid");
    if (!mobile) errors.push("mobile is required");
    else if (!exports.isValidMobile(mobile)) errors.push("mobile must be a valid 10-digit number");
    if (!password) errors.push("password is required");
    else if (!exports.isValidPassword(password)) errors.push("password must be at least 6 characters");
    if (!licenseNumber) errors.push("licenseNumber is required");

    return { valid: errors.length === 0, errors, normalized: { fullName, email, mobile, password, licenseNumber } };
};
