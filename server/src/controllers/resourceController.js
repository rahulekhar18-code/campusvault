import { prisma } from '../config/db.js';
import { uploadPrivateFile, downloadPrivateFile, deletePrivateFile, movePrivateFile, BUCKET_NAME } from '../config/storage.js';

function sanitizePathSegment(val) {
  if (!val) return 'unknown';
  return val.toString().trim().replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Get all admin-approved files (Read Files Page)
 */
export async function getApprovedResources(req, res) {
  try {
    const { search, branch, semester, subject, category } = req.query;

    const where = {
      status: 'APPROVED'
    };

    if (branch && branch !== 'all') {
      where.branch = { equals: branch, mode: 'insensitive' };
    }
    if (semester && semester !== 'all') {
      where.semester = { equals: semester.toString() };
    }
    if (subject && subject !== 'all') {
      where.subject = { equals: subject, mode: 'insensitive' };
    }
    if (category && category !== 'all') {
      where.category = { equals: category, mode: 'insensitive' };
    }
    if (req.query.topperOnly === 'true') {
      where.isTopperVerified = true;
    }
    if (req.query.bookmarksOnly === 'true' && req.user?.id) {
      where.bookmarks = { some: { userId: req.user.id } };
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { originalName: { contains: q, mode: 'insensitive' } },
        { branch: { contains: q, mode: 'insensitive' } }
      ];
    }

    const resources = await prisma.resource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        branch: true,
        semester: true,
        subject: true,
        category: true,
        originalName: true,
        fileSize: true,
        mimeType: true,
        isLocked: true,
        isTopperVerified: true,
        isProfVerified: true,
        createdAt: true,
        uploader: {
          select: { email: true }
        },
        bookmarks: req.user?.id ? {
          where: { userId: req.user.id },
          select: { id: true }
        } : false
      }
    });

    const mapped = resources.map((item) => ({
      ...item,
      isBookmarked: Array.isArray(item.bookmarks) && item.bookmarks.length > 0,
      bookmarks: undefined
    }));

    return res.json(mapped);
  } catch (error) {
    console.error('getApprovedResources error:', error);
    return res.status(500).json({ error: 'Failed to retrieve resources' });
  }
}

/**
 * Upload a file (Student -> PENDING, Admin -> APPROVED)
 */
export async function uploadResource(req, res) {
  try {
    const { title, branch, semester, subject, category } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'File selection is required' });
    }
    if (!title || !branch || !semester || !subject || !category) {
      return res.status(400).json({ error: 'All fields (title, branch, semester, subject, category) are required' });
    }

    // Retrieve storage naming convention from AppSettings
    const settings = await prisma.appSettings.findUnique({
      where: { id: 'global' }
    });

    const root = settings?.storageRoot || 'vault';
    let folder = settings?.folderFormat || '{branch}/{semester}/{subject}/{category}';

    folder = folder
      .replace('{branch}', sanitizePathSegment(branch))
      .replace('{semester}', sanitizePathSegment(semester))
      .replace('{subject}', sanitizePathSegment(subject))
      .replace('{category}', sanitizePathSegment(category));

    const cleanName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storageKey = `${root}/${folder}/${cleanName}`.replace(/\/+/g, '/');

    // Upload to private Supabase storage
    await uploadPrivateFile(file.buffer, storageKey, file.mimetype, file.originalname);

    // Initial approval status: Admin uploads are auto-approved, student uploads are pending
    const initialStatus = req.user.role === 'ADMIN' ? 'APPROVED' : 'PENDING';

    const resource = await prisma.resource.create({
      data: {
        title: title.trim(),
        branch: branch.trim(),
        semester: semester.toString().trim(),
        subject: subject.trim(),
        category: category.trim(),
        originalName: file.originalname,
        storageKey,
        bucketName: BUCKET_NAME,
        fileSize: file.size,
        mimeType: file.mimetype,
        status: initialStatus,
        uploaderId: req.user.id
      },
      include: {
        uploader: {
          select: { email: true }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: initialStatus === 'APPROVED' ? 'File uploaded and automatically approved' : 'File uploaded successfully and submitted for admin approval',
      resource
    });
  } catch (error) {
    console.error('uploadResource error:', error);
    return res.status(500).json({ error: `File upload failed: ${error.message}` });
  }
}

/**
 * Get the current student's own submissions
 */
export async function getMyUploads(req, res) {
  try {
    const uploads = await prisma.resource.findMany({
      where: { uploaderId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(uploads);
  } catch (error) {
    console.error('getMyUploads error:', error);
    return res.status(500).json({ error: 'Failed to retrieve your uploads' });
  }
}

/**
 * Edit a resource (Student can only edit own PENDING; Admin can edit any and move storage location)
 */
export async function updateResource(req, res) {
  try {
    const { id } = req.params;
    const { title, branch, semester, subject, category, status } = req.body;

    const resource = await prisma.resource.findUnique({
      where: { id }
    });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const isAdmin = req.user.role === 'ADMIN';
    const isOwner = resource.uploaderId === req.user.id;

    if (!isAdmin) {
      if (!isOwner) {
        return res.status(403).json({ error: 'You do not have permission to edit this file' });
      }
      if (resource.status !== 'PENDING') {
        return res.status(400).json({ error: 'Only pending files can be edited' });
      }
    }

    const newBranch = branch !== undefined ? branch.trim() : resource.branch;
    const newSemester = semester !== undefined ? semester.toString().trim() : resource.semester;
    const newSubject = subject !== undefined ? subject.trim() : resource.subject;
    const newCategory = category !== undefined ? category.trim() : resource.category;

    let storageKey = resource.storageKey;
    const pathChanged = newBranch !== resource.branch ||
      newSemester !== resource.semester ||
      newSubject !== resource.subject ||
      newCategory !== resource.category;

    if (pathChanged) {
      const settings = await prisma.appSettings.findUnique({
        where: { id: 'global' }
      });
      const root = settings?.storageRoot || 'vault';
      let folder = settings?.folderFormat || '{branch}/{semester}/{subject}/{category}';
      folder = folder
        .replace('{branch}', sanitizePathSegment(newBranch))
        .replace('{semester}', sanitizePathSegment(newSemester))
        .replace('{subject}', sanitizePathSegment(newSubject))
        .replace('{category}', sanitizePathSegment(newCategory));

      const filename = resource.storageKey.split('/').pop() || `${Date.now()}-${resource.originalName}`;
      const newKey = `${root}/${folder}/${filename}`.replace(/\/+/g, '/');

      if (newKey !== resource.storageKey) {
        try {
          await movePrivateFile(resource.storageKey, newKey, resource.mimeType, resource.originalName);
          storageKey = newKey;
        } catch (moveErr) {
          console.warn('Storage file move error:', moveErr.message);
        }
      }
    }

    const updated = await prisma.resource.update({
      where: { id },
      data: {
        ...(title ? { title: title.trim() } : {}),
        branch: newBranch,
        semester: newSemester,
        subject: newSubject,
        category: newCategory,
        storageKey,
        ...(isAdmin && status ? { status } : {}),
        ...(isAdmin && typeof req.body.isLocked === 'boolean' ? { isLocked: req.body.isLocked } : {}),
        ...(isAdmin && typeof req.body.isTopperVerified === 'boolean' ? { isTopperVerified: req.body.isTopperVerified } : {}),
        ...(isAdmin && typeof req.body.isProfVerified === 'boolean' ? { isProfVerified: req.body.isProfVerified } : {})
      }
    });

    return res.json({
      success: true,
      message: 'Resource details and storage location updated successfully',
      resource: updated
    });
  } catch (error) {
    console.error('updateResource error:', error);
    return res.status(500).json({ error: 'Failed to update resource' });
  }
}

/**
 * Delete a resource (Student can only delete own PENDING; Admin can delete any)
 */
export async function deleteResource(req, res) {
  try {
    const { id } = req.params;

    const resource = await prisma.resource.findUnique({
      where: { id }
    });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const isAdmin = req.user.role === 'ADMIN';
    const isOwner = resource.uploaderId === req.user.id;

    if (!isAdmin) {
      if (!isOwner) {
        return res.status(403).json({ error: 'You do not have permission to delete this file' });
      }
      if (resource.status !== 'PENDING') {
        return res.status(400).json({ error: 'Only pending files can be deleted by students' });
      }
    }

    // Delete from private storage
    if (resource.storageKey) {
      await deletePrivateFile(resource.storageKey);
    }

    // Delete from PostgreSQL
    await prisma.resource.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: 'Resource deleted successfully'
    });
  } catch (error) {
    console.error('deleteResource error:', error);
    return res.status(500).json({ error: 'Failed to delete resource' });
  }
}

/**
 * Securely download/preview a file from private storage
 */
export async function downloadResource(req, res) {
  try {
    const { id } = req.params;

    const resource = await prisma.resource.findUnique({
      where: { id }
    });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const isAdmin = req.user.role === 'ADMIN';
    const isOwner = resource.uploaderId === req.user.id;

    // Security check: Only approved files are accessible to everyone; pending/rejected files require owner or admin
    if (resource.status !== 'APPROVED' && !isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Access denied: This file has not been approved' });
    }

    const mode = req.query.mode || 'download'; // 'download' | 'preview'

    // If resource is locked (read-only): students can preview/read, but offline download is restricted
    if (resource.isLocked && !isAdmin && !isOwner && mode === 'download') {
      return res.status(403).json({
        error: 'This resource is locked for in-app reading only. Direct offline download is restricted by admin.'
      });
    }

    const buffer = await downloadPrivateFile(resource.storageKey);

    res.setHeader('Content-Type', resource.mimeType || 'application/octet-stream');
    if (mode === 'preview') {
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(resource.originalName)}"`);
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(resource.originalName)}"`);
    }
    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);
  } catch (error) {
    console.error('downloadResource error:', error);
    return res.status(500).json({ error: 'Failed to download file from private storage' });
  }
}

/**
 * Toggle bookmark for a resource (Student & Admin)
 */
export async function toggleBookmark(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const resource = await prisma.resource.findUnique({
      where: { id }
    });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_resourceId: {
          userId,
          resourceId: id
        }
      }
    });

    if (existing) {
      await prisma.bookmark.delete({
        where: { id: existing.id }
      });
      return res.json({
        success: true,
        isBookmarked: false,
        message: 'Removed from Bookmarks'
      });
    } else {
      await prisma.bookmark.create({
        data: {
          userId,
          resourceId: id
        }
      });
      return res.json({
        success: true,
        isBookmarked: true,
        message: 'Saved to Bookmarks'
      });
    }
  } catch (error) {
    console.error('toggleBookmark error:', error);
    return res.status(500).json({ error: 'Failed to toggle bookmark' });
  }
}
