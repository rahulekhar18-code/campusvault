import { Router } from 'express';
import { sendOtp, register, login, getMe } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/send-otp', sendOtp);
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);

export default router;
