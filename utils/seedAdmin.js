const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

const getAdminCredentials = () => ({
    email: (process.env.ADMIN_EMAIL || "admin@plumedica.com").trim().toLowerCase(),
    password: process.env.ADMIN_PASSWORD || "Plumedica@admin123",
});

const seedAdmin = async () => {

    const { email, password } = getAdminCredentials();
    const hashedPassword = await bcrypt.hash(password, 10);

    const existing = await Admin.findOne({ email });

    if (!existing) {
        await Admin.create({ email, password: hashedPassword });
        console.log(`Admin user created: ${email}`);
        return;
    }

    const passwordMatch = await bcrypt.compare(password, existing.password);

    if (!passwordMatch) {
        existing.password = hashedPassword;
        await existing.save();
        console.log(`Admin password updated for: ${email}`);
    }

};

module.exports = { seedAdmin, getAdminCredentials };
