const jwt = require("jsonwebtoken");

const getBearerToken = (req) => {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
        return null;
    }

    return header.split(" ")[1];
};

exports.protectAdmin = (req, res, next) => {
    const token = getBearerToken(req);

    if (!token) {
        return res.status(401).json({ message: "Access denied. Bearer token required." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== "admin") {
            return res.status(403).json({ message: "Admin access required" });
        }

        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
