const mongoose = require("mongoose");

exports.parseMongoId = (id) => {
    const cleaned = String(id || "").trim();
    return mongoose.Types.ObjectId.isValid(cleaned) ? cleaned : null;
};
