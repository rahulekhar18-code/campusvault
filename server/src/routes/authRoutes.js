import { Router } from 'express';
import {
  sendOtp,
  register,
  login,
  getMe,
  forgotPasswordSendOtp,
  resetPassword
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/send-otp', sendOtp);
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password-otp', forgotPasswordSendOtp);
router.post('/reset-password', resetPassword);
router.get('/me', authenticateToken, getMe);

export default router;
