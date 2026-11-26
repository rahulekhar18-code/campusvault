import { Router } from 'express';
import {
  getApprovedResources,
  uploadResource,
  getMyUploads,
  updateResource,
  deleteResource,
  downloadResource,
  toggleBookmark
} from '../controllers/resourceController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

// Read approved files (student and admin)
router.get('/', authenticateToken, getApprovedResources);

// Toggle bookmark on a resource (student and admin)
router.post('/:id/bookmark', authenticateToken, toggleBookmark);

// Upload a file (student -> PENDING, admin -> auto APPROVED)
router.post('/upload', authenticateToken, upload.single('file'), uploadResource);

// View personal uploads & statuses (student/admin)
router.get('/my-uploads', authenticateToken, getMyUploads);

// Edit pending submission (student) or any resource (admin)
router.put('/:id', authenticateToken, updateResource);

// Delete pending submission (student) or any resource (admin)
router.delete('/:id', authenticateToken, deleteResource);

// Secure private file download/preview
router.get('/:id/download', authenticateToken, downloadResource);

export default router;
