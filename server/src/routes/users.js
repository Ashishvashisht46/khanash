const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');

const prisma = require('../lib/prisma');
const { authenticate, tenantGuard, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();
router.use(authenticate, tenantGuard);

// ─── Validation Schemas ───────────────────────────────────────────────────────
const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8).optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'COORDINATOR', 'USER']).default('USER'),
  locationId: z.string().uuid().optional().nullable(),
  officeId: z.string().uuid().optional().nullable(),
  assignedLocations: z.array(z.string().uuid()).default([]),
  assignedOffices: z.array(z.string().uuid()).default([]),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'COORDINATOR', 'USER']).optional(),
  locationId: z.string().uuid().optional().nullable(),
  officeId: z.string().uuid().optional().nullable(),
  assignedLocations: z.array(z.string().uuid()).optional(),
  assignedOffices: z.array(z.string().uuid()).optional(),
  photoUrl: z.string().url().optional().nullable(),
});

// ─── GET /api/users ───────────────────────────────────────────────────────────
router.get('/', authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { page = '1', limit = '50', search, role, active } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where = { tenantId };
    if (role) where.role = role;
    if (active !== undefined) where.active = active === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          tenantId: true,
          email: true,
          name: true,
          role: true,
          active: true,
          photoUrl: true,
          locationId: true,
          officeId: true,
          assignedLocations: true,
          assignedOffices: true,
          createdAt: true,
          updatedAt: true,
          location: { select: { id: true, name: true } },
          office: { select: { id: true, name: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/users/pending-requests ─────────────────────────────────────────
router.get('/pending-requests', authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { status = 'PENDING' } = req.query;

    const requests = await prisma.accessRequest.findMany({
      where: {
        OR: [{ tenantId }, { tenantId: null }],
        status,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ requests });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/users/:id ───────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    // Users can view their own profile; admins/managers can view any
    if (req.user.role === 'USER' || req.user.role === 'COORDINATOR') {
      if (id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    }

    const user = await prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        tenantId: true,
        email: true,
        name: true,
        role: true,
        active: true,
        photoUrl: true,
        locationId: true,
        officeId: true,
        assignedLocations: true,
        assignedOffices: true,
        createdAt: true,
        updatedAt: true,
        location: { select: { id: true, name: true } },
        office: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/users ──────────────────────────────────────────────────────────
router.post(
  '/',
  authorize('ADMIN'),
  validate(createUserSchema),
  async (req, res, next) => {
    try {
      const tenantId = req.user.tenantId;
      const { name, email, password, role, locationId, officeId, assignedLocations, assignedOffices } = req.body;

      const existing = await prisma.user.findFirst({ where: { tenantId, email } });
      if (existing) {
        return res.status(409).json({ error: 'A user with this email already exists.' });
      }

      const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

      const user = await prisma.user.create({
        data: {
          tenantId,
          email,
          name,
          password: hashedPassword,
          role,
          locationId,
          officeId,
          assignedLocations,
          assignedOffices,
          active: true,
        },
        select: {
          id: true, tenantId: true, email: true, name: true, role: true,
          active: true, locationId: true, officeId: true,
          assignedLocations: true, assignedOffices: true, createdAt: true,
        },
      });

      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user.id,
          userName: req.user.name,
          action: 'USER_CREATED',
          entityType: 'User',
          entityId: user.id,
          metadata: { email, role },
        },
      });

      res.status(201).json({ user });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PUT /api/users/:id ───────────────────────────────────────────────────────
router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  validate(updateUserSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenantId;

      const existing = await prisma.user.findFirst({ where: { id, tenantId } });
      if (!existing) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Managers cannot promote users to ADMIN
      if (req.user.role === 'MANAGER' && req.body.role === 'ADMIN') {
        return res.status(403).json({ error: 'Managers cannot assign the ADMIN role.' });
      }

      const user = await prisma.user.update({
        where: { id },
        data: req.body,
        select: {
          id: true, tenantId: true, email: true, name: true, role: true,
          active: true, locationId: true, officeId: true,
          assignedLocations: true, assignedOffices: true, updatedAt: true,
        },
      });

      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user.id,
          userName: req.user.name,
          action: 'USER_UPDATED',
          entityType: 'User',
          entityId: id,
          metadata: { changes: req.body },
        },
      });

      res.json({ user });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PUT /api/users/:id/toggle-active ────────────────────────────────────────
router.put('/:id/toggle-active', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    // Prevent self-deactivation
    if (id === req.user.id) {
      return res.status(400).json({ error: 'You cannot deactivate your own account.' });
    }

    const existing = await prisma.user.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { active: !existing.active },
      select: { id: true, email: true, name: true, active: true, role: true },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: req.user.id,
        userName: req.user.name,
        action: user.active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        entityType: 'User',
        entityId: id,
        metadata: { targetEmail: user.email },
      },
    });

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/users/:id ────────────────────────────────────────────────────
router.delete('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    if (id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    const existing = await prisma.user.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: req.user.id,
        userName: req.user.name,
        action: 'USER_DELETED',
        entityType: 'User',
        entityId: id,
        metadata: { email: existing.email },
      },
    });

    res.json({ message: 'User removed successfully.' });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/users/approve-request/:id ─────────────────────────────────────
router.post(
  '/approve-request/:id',
  authorize('ADMIN', 'MANAGER'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      const { role = 'USER' } = req.body;

      const request = await prisma.accessRequest.findUnique({ where: { id } });
      if (!request) {
        return res.status(404).json({ error: 'Access request not found.' });
      }
      if (request.status !== 'PENDING') {
        return res.status(400).json({ error: `Request is already ${request.status.toLowerCase()}.` });
      }

      const updated = await prisma.accessRequest.update({
        where: { id },
        data: { status: 'APPROVED', tenantId },
      });

      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user.id,
          userName: req.user.name,
          action: 'ACCESS_REQUEST_APPROVED',
          entityType: 'AccessRequest',
          entityId: id,
          metadata: { email: request.email, role },
        },
      });

      res.json({ request: updated });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/users/reject-request/:id ──────────────────────────────────────
router.post(
  '/reject-request/:id',
  authorize('ADMIN', 'MANAGER'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenantId;

      const request = await prisma.accessRequest.findUnique({ where: { id } });
      if (!request) {
        return res.status(404).json({ error: 'Access request not found.' });
      }
      if (request.status !== 'PENDING') {
        return res.status(400).json({ error: `Request is already ${request.status.toLowerCase()}.` });
      }

      const updated = await prisma.accessRequest.update({
        where: { id },
        data: { status: 'REJECTED' },
      });

      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user.id,
          userName: req.user.name,
          action: 'ACCESS_REQUEST_REJECTED',
          entityType: 'AccessRequest',
          entityId: id,
          metadata: { email: request.email },
        },
      });

      res.json({ request: updated });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
