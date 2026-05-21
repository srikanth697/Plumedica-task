const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadsDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const ALLOWED_MIME_TYPES = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
    "application/octet-stream",
]);

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".pdf"]);

const isAllowedFile = (file) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.has(ext)) return true;
    return ALLOWED_MIME_TYPES.has(file.mimetype);
};

const storage = multer.diskStorage({
    destination: (_, __, cb) => cb(null, uploadsDir),
    filename: (_, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || "";
        const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
        const unique = `${Date.now()}-${base}${ext}`;
        cb(null, unique);
    },
});

const fileFilter = (_, file, cb) => {
    if (isAllowedFile(file)) {
        return cb(null, true);
    }

    cb(new Error("Only JPG, PNG, JPEG, and PDF files are allowed"));
};

const uploadOptional = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024, files: 10 },
});

const optionalUpload = (req, res, next) => {
    if (!req.is("multipart/form-data")) {
        return next();
    }

    uploadOptional.any()(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || "File upload failed",
            });
        }
        next();
    });
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024, files: 10 },
});

const handleUpload = (req, res, next) => {
    upload.any()(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || "File upload failed",
            });
        }
        next();
    });
};

exports.parseFormData = handleUpload;
exports.parseRegistrationUpload = handleUpload;
exports.optionalMultipart = optionalUpload;
