import { Router } from 'express';
import {
  getAcademicStructure,
  createBranch,
  updateBranch,
  deleteBranch,
  createSemester,
  updateSemester,
  deleteSemester,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubject,
  updateSubject,
  deleteSubject
} from '../controllers/academicController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// Public: Get all academic structure
router.get('/', getAcademicStructure);

// Protected Admin Academic Management routes
router.use(authenticateToken, requireAdmin);

// Branches
router.post('/branches', createBranch);
router.put('/branches/:id', updateBranch);
router.delete('/branches/:id', deleteBranch);

// Semesters
router.post('/semesters', createSemester);
router.put('/semesters/:id', updateSemester);
router.delete('/semesters/:id', deleteSemester);

// Categories
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Subjects
router.post('/subjects', createSubject);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

export default router;
