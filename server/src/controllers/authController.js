import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { generateOtp, sendOtpEmail } from '../utils/emailService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'campusvault_super_secret_jwt_key_2026_ycce';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '24071279@ycce.in').toLowerCase();

/**
 * Retrieves list of allowed email domains from AppSettings (defaulting to ycce.in)
 */
export async function getAllowedDomains() {
  try {
    const settings = await prisma.appSettings.findUnique({ where: { id: 'global' } });
    if (settings && settings.allowedEmailDomains) {
      return settings.allowedEmailDomains
        .split(',')
        .map(d => d.trim().toLowerCase().replace(/^@/, ''))
        .filter(Boolean);
    }
  } catch (err) {
    console.error('Failed to get allowed domains from settings:', err);
  }
  return ['ycce.in'];
}

/**
 * Validates that an email belongs to configured allowed college domains
 */
export async function isCollegeEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const cleanEmail = email.trim().toLowerCase();
  const allowed = await getAllowedDomains();
  return allowed.some(domain => cleanEmail.endsWith(`@${domain}`));
}

/**
 * Send OTP for registration or verification
 */
export async function sendOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'College email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!(await isCollegeEmail(cleanEmail))) {
      const allowed = await getAllowedDomains();
      return res.status(400).json({
        error: `Registration restricted: Only official college emails (${allowed.map(d => '@' + d).join(', ')}) are permitted`
      });
    }

    // Check if user is already verified
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existing && existing.isVerified) {
      return res.status(400).json({
        error: 'An account with this email is already registered. Please login.'
      });
    }

    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert unverified user record with OTP
    await prisma.user.upsert({
      where: { email: cleanEmail },
      update: {
        otp,
        otpExpiresAt
      },
      create: {
        email: cleanEmail,
        password: '', // Will be set on registration
        isVerified: false,
        otp,
        otpExpiresAt,
        role: cleanEmail === ADMIN_EMAIL ? 'ADMIN' : 'STUDENT'
      }
    });

    const sent = await sendOtpEmail(cleanEmail, otp);
    if (!sent) {
      return res.status(500).json({ error: 'Unable to deliver verification email. Please check your college email address or try again.' });
    }

    return res.json({
      success: true,
      message: `Verification code sent to ${cleanEmail}. Please check your college inbox or spam folder.`
    });
  } catch (error) {
    console.error('sendOtp error:', error);
    return res.status(500).json({ error: 'Failed to send verification code' });
  }
}

/**
 * Register a new user with verified OTP
 */
export async function register(req, res) {
  try {
    const { email, password, otp } = req.body;

    if (!email || !password || !otp) {
      return res.status(400).json({ error: 'Email, password, and OTP are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!(await isCollegeEmail(cleanEmail))) {
      const allowed = await getAllowedDomains();
      return res.status(400).json({ error: `Only official college emails (${allowed.map(d => '@' + d).join(', ')}) are allowed` });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      return res.status(400).json({ error: 'No OTP request found for this email. Please request OTP first.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Account already verified. Please login.' });
    }

    if (!user.otp || user.otp !== otp.toString().trim()) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (new Date() > new Date(user.otpExpiresAt)) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = cleanEmail === ADMIN_EMAIL ? 'ADMIN' : 'STUDENT';

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        isVerified: true,
        otp: null,
        otpExpiresAt: null,
        role: assignedRole
      },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true
      }
    });

    const token = jwt.sign(
      { id: updatedUser.id, email: updatedUser.email, role: updatedUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account successfully registered and verified',
      token,
      user: updatedUser
    });
  } catch (error) {
    console.error('register error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
}

/**
 * Login for both students and admin through the same portal
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!(await isCollegeEmail(cleanEmail))) {
      const allowed = await getAllowedDomains();
      return res.status(400).json({ error: `Access restricted to official college accounts (${allowed.map(d => '@' + d).join(', ')})` });
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: 'Account not verified. Please register or verify with OTP.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Secure backend role verification: Ensure admin role is accurate
    let currentRole = user.role;
    if (cleanEmail === ADMIN_EMAIL && user.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' }
      });
      currentRole = 'ADMIN';
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: currentRole },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: currentRole,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
}

/**
 * Get current authenticated user profile
 */
export async function getMe(req, res) {
  return res.json({ user: req.user });
}

/**
 * Send OTP for Password Reset (Forgot Password)
 */
export async function forgotPasswordSendOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'College email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!(await isCollegeEmail(cleanEmail))) {
      const allowed = await getAllowedDomains();
      return res.status(400).json({ error: `Only official college emails (${allowed.map(d => '@' + d).join(', ')}) are permitted` });
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email. Please register first.' });
    }

    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { email: cleanEmail },
      data: {
        otp,
        otpExpiresAt
      }
    });

    const sent = await sendOtpEmail(cleanEmail, otp, 'reset');
    if (!sent) {
      return res.status(500).json({ error: 'Unable to deliver password reset email. Please try again.' });
    }

    return res.json({
      success: true,
      message: `Password reset code sent to ${cleanEmail}. Please check your college inbox or spam folder.`
    });
  } catch (error) {
    console.error('forgotPasswordSendOtp error:', error);
    return res.status(500).json({ error: 'Failed to send password reset code' });
  }
}

/**
 * Verify OTP and Reset Password
 */
export async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, verification code, and new password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!(await isCollegeEmail(cleanEmail))) {
      const allowed = await getAllowedDomains();
      return res.status(400).json({ error: `Only official college emails (${allowed.map(d => '@' + d).join(', ')}) are allowed` });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.otp || user.otp !== otp.toString().trim()) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (new Date() > new Date(user.otpExpiresAt)) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpiresAt: null,
        isVerified: true
      },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true
      }
    });

    const token = jwt.sign(
      { id: updatedUser.id, email: updatedUser.email, role: updatedUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Password has been reset successfully! Logging you in...',
      token,
      user: updatedUser
    });
  } catch (error) {
    console.error('resetPassword error:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
}
