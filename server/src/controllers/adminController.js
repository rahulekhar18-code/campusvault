import { prisma } from '../config/db.js';
import { sendResourceDigestEmail } from '../utils/emailService.js';

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

/**
 * Toggle verification badges (Topper Verified or Prof Recommended)
 */
export async function toggleVerificationBadge(req, res) {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'topper' | 'prof'

    const resource = await prisma.resource.findUnique({
      where: { id }
    });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const data = type === 'topper'
      ? { isTopperVerified: !resource.isTopperVerified }
      : { isProfVerified: !resource.isProfVerified };

    const updated = await prisma.resource.update({
      where: { id },
      data
    });

    return res.json({
      success: true,
      message: `Verification badge updated for "${updated.title}"`,
      resource: updated
    });
  } catch (error) {
    console.error('toggleVerificationBadge error:', error);
    return res.status(500).json({ error: 'Failed to update verification badge' });
  }
}

/**
 * Send resource digest email to students
 */
export async function sendResourceDigest(req, res) {
  try {
    const { branch, semester } = req.body;

    // Fetch top 5 recent approved resources for this branch/semester
    const where = { status: 'APPROVED' };
    if (branch && branch !== 'All') where.branch = { equals: branch, mode: 'insensitive' };
    if (semester && semester !== 'All') where.semester = { equals: semester.toString() };

    const resources = await prisma.resource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        subject: true,
        category: true,
        branch: true,
        semester: true,
        isTopperVerified: true
      }
    });

    if (resources.length === 0) {
      return res.status(400).json({ error: 'No approved resources found to send in digest' });
    }

    // Get active verified student emails
    const users = await prisma.user.findMany({
      where: { isVerified: true },
      select: { email: true }
    });

    if (users.length === 0) {
      return res.status(400).json({ error: 'No verified students found' });
    }

    let sentCount = 0;
    // Dispatch in batches or to all
    for (const u of users) {
      try {
        const ok = await sendResourceDigestEmail(u.email, branch, semester, resources);
        if (ok) sentCount++;
      } catch (e) {
        console.warn(`Digest send error for ${u.email}:`, e.message);
      }
    }

    return res.json({
      success: true,
      message: `Digest sent successfully to ${sentCount} student(s) via Brevo`,
      sentCount,
      resourcesCount: resources.length
    });
  } catch (error) {
    console.error('sendResourceDigest error:', error);
    return res.status(500).json({ error: 'Failed to send resource digest' });
  }
}
