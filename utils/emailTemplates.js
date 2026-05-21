exports.approvalEmail = (fullName, doctorId) => ({
    subject: "Plumedica - Doctor Account Approved",
    text: `Dear ${fullName},\n\nYour doctor registration has been approved.\n\nDoctor ID: ${doctorId}\n\nYou can now log in to the Plumedica app.\n\nRegards,\nPlumedica Team`,
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0d9488;">Plumedica - Account Approved</h2>
            <p>Dear <strong>${fullName}</strong>,</p>
            <p>Your doctor registration has been <strong style="color: green;">approved</strong>.</p>
            <p><strong>Doctor ID:</strong> ${doctorId}</p>
            <p>You can now log in to the Plumedica app.</p>
            <br>
            <p>Regards,<br><strong>Plumedica Team</strong></p>
        </div>
    `,
});

exports.rejectionEmail = (fullName, rejectionReason) => ({
    subject: "Plumedica - Application Rejected",
    text: `Dear ${fullName},\n\nYour registration was rejected.\n\nReason: ${rejectionReason}\n\nRegards,\nPlumedica Team`,
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Plumedica - Application Rejected</h2>
            <p>Dear <strong>${fullName}</strong>,</p>
            <p>Your registration was <strong style="color: red;">rejected</strong>.</p>
            <p><strong>Reason:</strong> ${rejectionReason}</p>
            <br>
            <p>Regards,<br><strong>Plumedica Team</strong></p>
        </div>
    `,
});
