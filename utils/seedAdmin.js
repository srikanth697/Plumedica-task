const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

const seedAdmin = async () => {
    const email = (process.env.ADMIN_EMAIL || "admin@plumedica.com").trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || "Plumedica@admin123";
    const hashed = await bcrypt.hash(password, 10);

    const admin = await Admin.findOne({ email });

    if (!admin) {
        await Admin.create({ email, password: hashed });
        console.log(`Admin created: ${email}`);
        return;
    }

    const match = await bcrypt.compare(password, admin.password);

    if (!match) {
        admin.password = hashed;
        await admin.save();
        console.log(`Admin password updated: ${email}`);
    }
};

module.exports = seedAdmin;
