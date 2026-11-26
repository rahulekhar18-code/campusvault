import { prisma } from '../config/db.js';

/**
 * Get all files awaiting approval
 */
export async function getPendingResources(req, res) {
  try {
    const pending = await prisma.resource.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: {
          select: { email: true }
        }
      }
    });

    return res.json(pending);
  } catch (error) {
    console.error('getPendingResources error:', error);
    return res.status(500).json({ error: 'Failed to retrieve pending resources' });
  }
}

/**
 * Approve a student submitted file
 */
export async function approveResource(req, res) {
  try {
    const { id } = req.params;

    const resource = await prisma.resource.findUnique({
      where: { id }
    });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const updated = await prisma.resource.update({
      where: { id },
      data: {
        status: 'APPROVED',
        rejectionReason: null
      }
    });

    return res.json({
      success: true,
      message: 'File approved and published to Read Files',
      resource: updated
    });
  } catch (error) {
    console.error('approveResource error:', error);
    return res.status(500).json({ error: 'Failed to approve resource' });
  }
}

/**
 * Reject a student submitted file with optional reason
 */
export async function rejectResource(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const resource = await prisma.resource.findUnique({
      where: { id }
    });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const updated = await prisma.resource.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason ? reason.trim() : 'Does not meet college submission criteria'
      }
    });

    return res.json({
      success: true,
      message: 'File submission rejected',
      resource: updated
    });
  } catch (error) {
    console.error('rejectResource error:', error);
    return res.status(500).json({ error: 'Failed to reject resource' });
  }
}

/**
 * Toggle lock status of a resource (Free Download vs Locked Read-Only)
 */
export async function toggleResourceLock(req, res) {
  try {
    const { id } = req.params;

    const resource = await prisma.resource.findUnique({
      where: { id }
    });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const updated = await prisma.resource.update({
      where: { id },
      data: {
        isLocked: !resource.isLocked
      }
    });

    return res.json({
      success: true,
      message: updated.isLocked
        ? 'File locked: restricted to in-app reading only'
        : 'File unlocked: free for offline download',
      resource: updated
    });
  } catch (error) {
    console.error('toggleResourceLock error:', error);
    return res.status(500).json({ error: 'Failed to toggle resource lock' });
  }
}

/**
 * Get all files across all statuses for Admin File Manager (CRUD & Move)
 */
export async function getAllResources(req, res) {
  try {
    const { status, search, branch, semester, category } = req.query;
    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (branch && branch !== 'all') {
      where.branch = { equals: branch, mode: 'insensitive' };
    }
    if (semester && semester !== 'all') {
      where.semester = { equals: semester.toString() };
    }
    if (category && category !== 'all') {
      where.category = { equals: category, mode: 'insensitive' };
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { originalName: { contains: q, mode: 'insensitive' } }
      ];
    }

    const resources = await prisma.resource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: {
          select: { email: true }
        }
      }
    });

    return res.json(resources);
  } catch (error) {
    console.error('getAllResources error:', error);
    return res.status(500).json({ error: 'Failed to retrieve all resources' });
  }
}

/**
 * Get all registered users for Admin Users section
 */
export async function getAllUsers(req, res) {
  try {
    const { search } = req.query;
    const where = {};
    if (search && search.trim()) {
      where.email = { contains: search.trim(), mode: 'insensitive' };
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: { resources: true }
        }
      }
    });

    return res.json(users);
  } catch (error) {
    console.error('getAllUsers error:', error);
    return res.status(500).json({ error: 'Failed to retrieve registered users' });
  }
}
