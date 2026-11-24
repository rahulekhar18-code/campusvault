import { prisma } from '../config/db.js';

// Public: Get all academic metadata in a structured format
export async function getAcademicStructure(req, res) {
  try {
    const [branches, semesters, categories, subjects] = await Promise.all([
      prisma.academicBranch.findMany({ orderBy: { code: 'asc' } }),
      prisma.academicSemester.findMany({ orderBy: { number: 'asc' } }),
      prisma.academicCategory.findMany({ orderBy: { name: 'asc' } }),
      prisma.academicSubject.findMany({ orderBy: [{ branch: 'asc' }, { semester: 'asc' }, { name: 'asc' }] })
    ]);

    res.json({
      branches,
      semesters,
      categories,
      subjects
    });
  } catch (error) {
    console.error('Error fetching academic structure:', error);
    res.status(500).json({ error: 'Failed to fetch academic structure' });
  }
}

// ----------------- BRANCHES CRUD -----------------
export async function createBranch(req, res) {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Branch name and code are required' });
    }

    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();

    const existing = await prisma.academicBranch.findFirst({
      where: {
        OR: [
          { code: cleanCode },
          { name: cleanName }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'A branch with this code or name already exists' });
    }

    const branch = await prisma.academicBranch.create({
      data: { name: cleanName, code: cleanCode }
    });

    res.status(201).json(branch);
  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(500).json({ error: error.message || 'Failed to create branch' });
  }
}

export async function updateBranch(req, res) {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    if (!name && !code) {
      return res.status(400).json({ error: 'Name or code must be provided' });
    }

    const data = {};
    if (name) data.name = name.trim();
    if (code) data.code = code.trim().toUpperCase();

    const branch = await prisma.academicBranch.update({
      where: { id },
      data
    });

    res.json(branch);
  } catch (error) {
    console.error('Error updating branch:', error);
    res.status(500).json({ error: error.message || 'Failed to update branch' });
  }
}

export async function deleteBranch(req, res) {
  try {
    const { id } = req.params;
    await prisma.academicBranch.delete({
      where: { id }
    });
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({ error: error.message || 'Failed to delete branch' });
  }
}

// ----------------- SEMESTERS CRUD -----------------
export async function createSemester(req, res) {
  try {
    const { name, number } = req.body;
    if (!name || !number) {
      return res.status(400).json({ error: 'Semester name and number are required' });
    }

    const cleanNumber = String(number).trim();
    const cleanName = name.trim();

    const existing = await prisma.academicSemester.findFirst({
      where: {
        OR: [
          { number: cleanNumber },
          { name: cleanName }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'A semester with this number or name already exists' });
    }

    const semester = await prisma.academicSemester.create({
      data: { name: cleanName, number: cleanNumber }
    });

    res.status(201).json(semester);
  } catch (error) {
    console.error('Error creating semester:', error);
    res.status(500).json({ error: error.message || 'Failed to create semester' });
  }
}

export async function updateSemester(req, res) {
  try {
    const { id } = req.params;
    const { name, number } = req.body;

    if (!name && !number) {
      return res.status(400).json({ error: 'Name or number must be provided' });
    }

    const data = {};
    if (name) data.name = name.trim();
    if (number) data.number = String(number).trim();

    const semester = await prisma.academicSemester.update({
      where: { id },
      data
    });

    res.json(semester);
  } catch (error) {
    console.error('Error updating semester:', error);
    res.status(500).json({ error: error.message || 'Failed to update semester' });
  }
}

export async function deleteSemester(req, res) {
  try {
    const { id } = req.params;
    await prisma.academicSemester.delete({
      where: { id }
    });
    res.json({ message: 'Semester deleted successfully' });
  } catch (error) {
    console.error('Error deleting semester:', error);
    res.status(500).json({ error: error.message || 'Failed to delete semester' });
  }
}

// ----------------- CATEGORIES CRUD -----------------
export async function createCategory(req, res) {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const cleanName = name.trim();
    const existing = await prisma.academicCategory.findUnique({
      where: { name: cleanName }
    });

    if (existing) {
      return res.status(400).json({ error: 'A category with this name already exists' });
    }

    const category = await prisma.academicCategory.create({
      data: { name: cleanName }
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: error.message || 'Failed to create category' });
  }
}

export async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const category = await prisma.academicCategory.update({
      where: { id },
      data: { name: name.trim() }
    });

    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: error.message || 'Failed to update category' });
  }
}

export async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    await prisma.academicCategory.delete({
      where: { id }
    });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: error.message || 'Failed to delete category' });
  }
}

// ----------------- SUBJECTS CRUD -----------------
export async function createSubject(req, res) {
  try {
    const { name, branch, semester } = req.body;
    if (!name || !branch || !semester) {
      return res.status(400).json({ error: 'Subject name, branch, and semester are required' });
    }

    const cleanName = name.trim();
    const cleanBranch = branch.trim().toUpperCase();
    const cleanSemester = String(semester).trim();

    const existing = await prisma.academicSubject.findUnique({
      where: {
        name_branch_semester: {
          name: cleanName,
          branch: cleanBranch,
          semester: cleanSemester
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'This subject already exists for the selected branch and semester' });
    }

    const subject = await prisma.academicSubject.create({
      data: {
        name: cleanName,
        branch: cleanBranch,
        semester: cleanSemester
      }
    });

    res.status(201).json(subject);
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(500).json({ error: error.message || 'Failed to create subject' });
  }
}

export async function updateSubject(req, res) {
  try {
    const { id } = req.params;
    const { name, branch, semester } = req.body;

    const data = {};
    if (name) data.name = name.trim();
    if (branch) data.branch = branch.trim().toUpperCase();
    if (semester) data.semester = String(semester).trim();

    const subject = await prisma.academicSubject.update({
      where: { id },
      data
    });

    res.json(subject);
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(500).json({ error: error.message || 'Failed to update subject' });
  }
}

export async function deleteSubject(req, res) {
  try {
    const { id } = req.params;
    await prisma.academicSubject.delete({
      where: { id }
    });
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ error: error.message || 'Failed to delete subject' });
  }
}
