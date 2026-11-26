import { Router } from 'express';
import {
  getPendingResources,
  getAllResources,
  getAllUsers,
  approveResource,
  rejectResource,
  toggleResourceLock,
  toggleVerificationBadge,
  sendResourceDigest
} from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// All routes here strictly require Admin authentication
router.use(authenticateToken, requireAdmin);

router.get('/pending', getPendingResources);
router.get('/all-resources', getAllResources);
router.get('/users', getAllUsers);
router.patch('/resources/:id/approve', approveResource);
router.patch('/resources/:id/reject', rejectResource);
router.patch('/resources/:id/toggle-lock', toggleResourceLock);
router.patch('/resources/:id/verification', toggleVerificationBadge);
router.post('/send-digest', sendResourceDigest);

export default router;
