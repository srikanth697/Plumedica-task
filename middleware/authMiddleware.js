const jwt = require("jsonwebtoken");

const getTokenFromHeader = (req) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    return authHeader.split(" ")[1];
};

exports.protect = (req, res, next) => {
    const token = getTokenFromHeader(req);

    if (!token) {
        return res.status(401).json({
            message: "Access denied. Bearer token required.",
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
};

exports.protectAdmin = (req, res, next) => {
    exports.protect(req, res, () => {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                message: "Admin access required",
            });
        }
        next();
    });
};

exports.protectDoctor = (req, res, next) => {
    exports.protect(req, res, () => {
        if (req.user.role !== "doctor") {
            return res.status(403).json({
                message: "Doctor access required",
            });
        }
        next();
    });
};
