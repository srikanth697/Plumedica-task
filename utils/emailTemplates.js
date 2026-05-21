const LOGIN_URL = "https://plumedica-doctor-app.vercel.app";

const baseLayout = (content) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:linear-gradient(135deg,#0d9488,#0f766e);padding:28px 32px;text-align:center">
            <h1 style="margin:0;color:#ffffff;font-size:26px;letter-spacing:1px">PLUMEDICA</h1>
            <p style="margin:8px 0 0;color:#ccfbf1;font-size:13px">Healthcare Platform</p>
          </td>
        </tr>
        <tr><td style="padding:32px">${content}</td></tr>
        <tr>
          <td style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0">
            <p style="margin:0;color:#64748b;font-size:12px">© ${new Date().getFullYear()} Plumedica Healthcare. All rights reserved.</p>
            <p style="margin:8px 0 0;color:#94a3b8;font-size:11px">This is an automated message. Please do not reply.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

exports.approvalTemplate = (fullName, doctorId) => {
    const subject = "Plumedica — Your Doctor Account is Approved";
    const text = `Dear ${fullName},\n\nYour Plumedica registration is approved.\n\nDoctor ID: ${doctorId}\n\nLogin: ${LOGIN_URL}\n\nRegards,\nPlumedica Team`;

    const html = baseLayout(`
      <h2 style="margin:0 0 16px;color:#16a34a;font-size:22px">Account Approved</h2>
      <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6">Dear <strong>${fullName}</strong>,</p>
      <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.6">
        Congratulations! Your doctor registration has been <strong style="color:#16a34a">approved</strong> by our admin team.
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:0 0 24px;text-align:center">
        <p style="margin:0 0 8px;color:#166534;font-size:13px;text-transform:uppercase;letter-spacing:1px">Your Doctor ID</p>
        <p style="margin:0;font-size:24px;font-weight:bold;color:#0d9488">${doctorId}</p>
      </div>
      <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6">
        You can now log in to the Plumedica doctor portal using your registered email and password.
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px">
        <tr>
          <td style="background:#0d9488;border-radius:8px">
            <a href="${LOGIN_URL}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold">
              Login to Plumedica
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:0;color:#64748b;font-size:13px;text-align:center">
        Or visit: <a href="${LOGIN_URL}" style="color:#0d9488">${LOGIN_URL}</a>
      </p>
    `);

    return { subject, text, html };
};

exports.rejectionTemplate = (fullName, rejectionReason) => {
    const subject = "Plumedica — Application Update";
    const text = `Dear ${fullName},\n\nYour registration was not approved.\n\nReason: ${rejectionReason}\n\nFor support, contact Plumedica admin.\n\nRegards,\nPlumedica Team`;

    const html = baseLayout(`
      <h2 style="margin:0 0 16px;color:#dc2626;font-size:22px">Application Not Approved</h2>
      <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6">Dear <strong>${fullName}</strong>,</p>
      <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.6">
        Thank you for applying to Plumedica. After review, we are unable to approve your registration at this time.
      </p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;margin:0 0 24px">
        <p style="margin:0 0 8px;color:#991b1b;font-size:13px;text-transform:uppercase;letter-spacing:1px">Reason</p>
        <p style="margin:0;color:#7f1d1d;font-size:15px;line-height:1.6">${rejectionReason}</p>
      </div>
      <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6">
        If you believe this was a mistake, you may re-apply with corrected documents or contact our support team.
      </p>
      <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:0 0 16px">
        <p style="margin:0;color:#475569;font-size:14px">
          <strong>Support:</strong> Reply to this email or contact Plumedica Admin with your registered email address.
        </p>
      </div>
      <p style="margin:0;color:#64748b;font-size:13px">We appreciate your interest in Plumedica Healthcare.</p>
    `);

    return { subject, text, html };
};

exports.deletionTemplate = (fullName, deletionReason) => {
    const subject = "Plumedica — Account Removed";
    const text = `Dear ${fullName},\n\nYour Plumedica doctor account has been removed from our system.\n\nReason: ${deletionReason}\n\nFor support, contact Plumedica admin.\n\nRegards,\nPlumedica Team`;

    const html = baseLayout(`
      <h2 style="margin:0 0 16px;color:#dc2626;font-size:22px">Account Removed</h2>
      <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6">Dear <strong>${fullName}</strong>,</p>
      <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.6">
        Your doctor account has been <strong>removed</strong> from the Plumedica Healthcare platform by our admin team.
      </p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;margin:0 0 24px">
        <p style="margin:0 0 8px;color:#991b1b;font-size:13px;text-transform:uppercase;letter-spacing:1px">Reason</p>
        <p style="margin:0;color:#7f1d1d;font-size:15px;line-height:1.6">${deletionReason}</p>
      </div>
      <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:0 0 16px">
        <p style="margin:0;color:#475569;font-size:14px">
          <strong>Support:</strong> Contact Plumedica Admin with your registered email if you have questions.
        </p>
      </div>
      <p style="margin:0;color:#64748b;font-size:13px">Thank you for your understanding.</p>
    `);

    return { subject, text, html };
};
