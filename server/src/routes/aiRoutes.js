import { Router } from 'express';
import { documentAssist } from '../controllers/aiController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Requires logged-in student authentication
router.post('/document-assist', authenticateToken, documentAssist);

export default router;
