import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let gmailTransporter = null;
let brevoSmtpTransporter = null;

// Initialize Brevo SMTP Relay if configured
const brevoKey = process.env.BREVO_SMTP_KEY || process.env.BREVO_API_KEY;
if (brevoKey && (brevoKey.startsWith('xsmtpsib-') || process.env.BREVO_SMTP_KEY)) {
  const smtpLogin = process.env.BREVO_SMTP_LOGIN || 'c548e9001@smtp-brevo.com';
  brevoSmtpTransporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // STARTTLS for port 587
    auth: {
      user: smtpLogin,
      pass: brevoKey
    }
  });
}

// Fallback: Initialize Gmail SMTP
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  gmailTransporter = nodemailer.createTransport({
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
 * Send email via Brevo REST API (Ultra-fast, ~200ms)
 */
async function sendViaBrevoApi(email, subjectText, textContent, htmlContent) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey || apiKey.startsWith('xsmtpsib-')) return false;

  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || 'rahulekhar18@gmail.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'CampusVault';

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'accept': 'application/json'
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail
      },
      to: [
        { email }
      ],
      subject: subjectText,
      textContent,
      htmlContent
    })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(`Brevo REST API Error (${res.status}): ${errData.message || res.statusText}`);
  }

  const data = await res.json();
  console.log(`✓ OTP delivered via Brevo REST API to ${email} (messageId: ${data.messageId})`);
  return true;
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

  const textContent = `${headingText}\n\nHello,\n\n${actionText}\n\n${otp}\n\nThis verification code will expire in 10 minutes. If you did not request this, please ignore this email.\n\nCampusVault • College Notes & Resources`;

  const htmlContent = `
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
  `;

  // 1. Try Brevo REST API (Fastest if using xkeysib- API key)
  if (process.env.BREVO_API_KEY && !process.env.BREVO_API_KEY.startsWith('xsmtpsib-')) {
    try {
      const ok = await sendViaBrevoApi(email, subjectText, textContent, htmlContent);
      if (ok) return true;
    } catch (err) {
      console.warn(`Brevo REST API delivery failed: ${err.message}. Trying Brevo SMTP relay...`);
    }
  }

  // 2. Try Brevo SMTP Relay (if using xsmtpsib- SMTP key)
  if (brevoSmtpTransporter) {
    try {
      await brevoSmtpTransporter.sendMail({
        from: `"CampusVault" <${process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || 'rahulekhar18@gmail.com'}>`,
        to: email,
        subject: subjectText,
        priority: 'high',
        text: textContent,
        html: htmlContent
      });
      console.log(`✓ OTP delivered via Brevo SMTP Relay to ${email}`);
      return true;
    } catch (err) {
      console.warn(`Brevo SMTP Relay failed: ${err.message}. Trying Gmail SMTP...`);
    }
  }

  // 3. Fallback to Gmail SMTP
  if (gmailTransporter) {
    try {
      await gmailTransporter.sendMail({
        from: `"CampusVault" <${process.env.EMAIL_USER || 'no-reply@campusvault.ycce.in'}>`,
        to: email,
        subject: subjectText,
        priority: 'high',
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high'
        },
        text: textContent,
        html: htmlContent
      });
      console.log(`✓ OTP sent via Gmail SMTP to ${email}`);
      return true;
    } catch (err) {
      console.warn(`Gmail SMTP sending notice for ${email}: ${err.message}. (OTP generated: ${otp})`);
      return false;
    }
  } else {
    console.log(`[Dev Mail Mock] OTP for ${email}: ${otp}`);
    return true;
  }
}
