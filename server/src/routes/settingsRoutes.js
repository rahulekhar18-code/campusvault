import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// Publicly accessible so anyone/any page can read app branding & theme
router.get('/', getSettings);

// Admin only to customize app name, logo, theme, storage paths
router.put('/', authenticateToken, requireAdmin, updateSettings);

export default router;
