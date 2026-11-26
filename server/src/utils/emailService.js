import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

/**
 * Generate a 6-digit numeric OTP
 */
export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP verification email
 */
export async function sendOtpEmail(email, otp, purpose = 'registration') {
  const isReset = purpose === 'reset';
  const subjectText = isReset
    ? 'CampusVault Password Reset Code (OTP)'
    : 'CampusVault Verification Code (OTP)';
  const headingText = isReset
    ? 'Password Reset Code'
    : 'CampusVault Verification';
  const actionText = isReset
    ? 'Your one-time verification code to reset your password is:'
    : 'Your one-time verification code for CampusVault registration is:';

  const mailOptions = {
    from: `"CampusVault" <${process.env.EMAIL_USER || 'no-reply@campusvault.ycce.in'}>`,
    to: email,
    subject: subjectText,
    priority: 'high',
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high'
    },
    text: `${headingText}\n\nHello,\n\n${actionText}\n\n${otp}\n\nThis verification code will expire in 10 minutes. If you did not request this, please ignore this email.\n\nCampusVault • College Notes & Resources`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb; margin-top: 0;">${headingText}</h2>
        <p>Hello,</p>
        <p>${actionText}</p>
        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #1e293b; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">CampusVault • College Notes & Resources</p>
      </div>
    `
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`✓ OTP sent via email to ${email}`);
      return true;
    } catch (err) {
      console.warn(`Email sending notice for ${email}: ${err.message}. (OTP generated: ${otp})`);
      return false;
    }
  } else {
    console.log(`[Dev Mail Mock] OTP for ${email}: ${otp}`);
    return true;
  }
}
