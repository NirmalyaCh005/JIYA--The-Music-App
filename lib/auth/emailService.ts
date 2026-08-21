import nodemailer from 'nodemailer';

export async function sendOtpEmail(toEmail: string, otp: string): Promise<boolean> {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  // HTML Email Template
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #070A10; color: #ffffff; padding: 40px 20px; border-radius: 24px; max-w: 500px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.15);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #3b82f6; font-size: 28px; font-weight: 900; margin: 0; tracking: -0.5px;">JIYA MUSIC</h1>
        <p style="color: #ec4899; font-size: 12px; font-weight: 700; margin-top: 4px;">High-Fidelity Audio Engine</p>
      </div>

      <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.1); padding: 32px; border-radius: 20px; text-align: center;">
        <h2 style="font-size: 18px; font-weight: 800; margin-bottom: 8px;">Your Verification Code</h2>
        <p style="color: #94a3b8; font-size: 13px; margin-bottom: 24px;">Use the following 6-digit OTP code to complete your login. This code is valid for 5 minutes.</p>

        <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 16px 24px; border-radius: 16px; display: inline-block; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #ffffff; box-shadow: 0 10px 25px rgba(37,99,235,0.3);">
          ${otp}
        </div>

        <p style="color: #64748b; font-size: 11px; margin-top: 24px;">If you did not request this verification code, please ignore this email.</p>
      </div>

      <div style="text-align: center; margin-top: 24px; color: #475569; font-size: 11px;">
        <p>© ${new Date().getFullYear()} Jiya Music Engine. All rights reserved.</p>
      </div>
    </div>
  `;

  if (!user || !pass) {
    console.log(`[EMAIL DISPATCH SIMULATION] Credentials missing. Target: ${toEmail} | OTP Code: ${otp}`);
    return true; // Gracefully continue in development mode
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"Jiya Music Auth" <${user}>`,
      to: toEmail,
      subject: `[${otp}] Your Jiya Music Login OTP Passcode`,
      html: htmlContent,
    });

    console.log(`[EMAIL DISPATCH SUCCESS] OTP sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('[EMAIL DISPATCH ERROR]', error);
    return false;
  }
}
