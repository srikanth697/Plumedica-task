const ALLOWED_UPLOAD_FIELDS = ["profilePhoto", "profilephoto", "photo", "documents", "document", "files"];

const mapFilePath = (filename) => `/uploads/${filename}`;

exports.parseRegistrationFiles = (files = []) => {
    let profilePhoto = null;
    const documents = [];

    for (const file of files) {
        if (!file?.filename) continue;

        const field = String(file.fieldname || "").toLowerCase();
        const filePath = mapFilePath(file.filename);

        if (field.includes("profile") || field === "photo") {
            profilePhoto = filePath;
        } else if (
            field.includes("document") ||
            field === "files" ||
            ALLOWED_UPLOAD_FIELDS.includes(field)
        ) {
            documents.push(filePath);
        } else {
            documents.push(filePath);
        }
    }

    return { profilePhoto, documents };
};
