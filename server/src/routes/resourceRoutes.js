import { Router } from 'express';
import {
  getApprovedResources,
  uploadResource,
  getMyUploads,
  updateResource,
  deleteResource,
  downloadResource,
  toggleBookmark,
  unlockResource,
  getUnlockedResources
} from '../controllers/resourceController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

// Read approved files (student and admin)
router.get('/', authenticateToken, getApprovedResources);

// View personal unlocked files (Unlock Hub)
router.get('/unlocked-hub', authenticateToken, getUnlockedResources);

// Unlock a locked resource with study credits
router.post('/:id/unlock', authenticateToken, unlockResource);

// Toggle bookmark on a resource (student and admin)
router.post('/:id/bookmark', authenticateToken, toggleBookmark);

// Upload files (single or multiple batch upload)
router.post('/upload', authenticateToken, upload.any(), uploadResource);

// View personal uploads & statuses (student/admin)
router.get('/my-uploads', authenticateToken, getMyUploads);

// Edit pending submission (student) or any resource (admin)
router.put('/:id', authenticateToken, updateResource);

// Delete pending submission (student) or any resource (admin)
router.delete('/:id', authenticateToken, deleteResource);

// Secure private file download/preview
router.get('/:id/download', authenticateToken, downloadResource);

export default router;
