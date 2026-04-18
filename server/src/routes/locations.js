const express = require('express');
const { z } = require('zod');

const prisma = require('../lib/prisma');
const { authenticate, tenantGuard, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();
router.use(authenticate, tenantGuard);

// ─── Validation Schemas ───────────────────────────────────────────────────────
const locationSchema = z.object({
  name: z.string().min(2, 'Location name must be at least 2 characters'),
  address: z.string().optional(),
  notes: z.string().optional(),
});

const updateLocationSchema = locationSchema.partial();

// ─── GET /api/locations ───────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    const locations = await prisma.location.findMany({
      where: { tenantId },
      include: {
        _count: { select: { offices: true, deposits: true } },
        offices: {
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ locations });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/locations/:id ───────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const location = await prisma.location.findFirst({
      where: { id, tenantId },
      include: {
        offices: { orderBy: { name: 'asc' } },
        _count: { select: { deposits: true, users: true } },
      },
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found.' });
    }

    res.json({ location });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/locations ──────────────────────────────────────────────────────
router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  validate(locationSchema),
  async (req, res, next) => {
    try {
      const tenantId = req.user.tenantId;
      const { name, address, notes } = req.body;

      const location = await prisma.location.create({
        data: { tenantId, name, address, notes },
      });

      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user.id,
          userName: req.user.name,
          action: 'LOCATION_CREATED',
          entityType: 'Location',
          entityId: location.id,
          metadata: { name },
        },
      });

      res.status(201).json({ location });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PUT /api/locations/:id ───────────────────────────────────────────────────
router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  validate(updateLocationSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenantId;

      const existing = await prisma.location.findFirst({ where: { id, tenantId } });
      if (!existing) {
        return res.status(404).json({ error: 'Location not found.' });
      }

      const location = await prisma.location.update({
        where: { id },
        data: req.body,
      });

      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user.id,
          userName: req.user.name,
          action: 'LOCATION_UPDATED',
          entityType: 'Location',
          entityId: id,
          metadata: { changes: req.body },
        },
      });

      res.json({ location });
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /api/locations/:id ────────────────────────────────────────────────
router.delete('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const existing = await prisma.location.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return res.status(404).json({ error: 'Location not found.' });
    }

    // Check if there are deposits linked — warn but allow
    const depositCount = await prisma.deposit.count({ where: { locationId: id, tenantId } });
    if (depositCount > 0) {
      return res.status(409).json({
        error: `Cannot delete location. It has ${depositCount} associated deposit(s). Reassign them first.`,
      });
    }

    await prisma.location.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: req.user.id,
        userName: req.user.name,
        action: 'LOCATION_DELETED',
        entityType: 'Location',
        entityId: id,
        metadata: { name: existing.name },
      },
    });

    res.json({ message: 'Location deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
