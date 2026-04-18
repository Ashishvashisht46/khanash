const express = require('express');
const { z } = require('zod');

const prisma = require('../lib/prisma');
const { authenticate, tenantGuard, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();
router.use(authenticate, tenantGuard);

// ─── Validation Schemas ───────────────────────────────────────────────────────
const officeSchema = z.object({
  locationId: z.string().uuid('Valid location ID is required'),
  name: z.string().min(2, 'Office name must be at least 2 characters'),
  notes: z.string().optional(),
});

const updateOfficeSchema = z.object({
  locationId: z.string().uuid().optional(),
  name: z.string().min(2).optional(),
  notes: z.string().optional(),
});

// ─── GET /api/offices ─────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { locationId } = req.query;

    const where = { tenantId };
    if (locationId) where.locationId = locationId;

    const offices = await prisma.office.findMany({
      where,
      include: {
        location: { select: { id: true, name: true } },
        _count: { select: { deposits: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ offices });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/offices/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const office = await prisma.office.findFirst({
      where: { id, tenantId },
      include: {
        location: { select: { id: true, name: true, address: true } },
        _count: { select: { deposits: true, users: true } },
      },
    });

    if (!office) {
      return res.status(404).json({ error: 'Office not found.' });
    }

    res.json({ office });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/offices ────────────────────────────────────────────────────────
router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  validate(officeSchema),
  async (req, res, next) => {
    try {
      const tenantId = req.user.tenantId;
      const { locationId, name, notes } = req.body;

      // Verify location belongs to this tenant
      const location = await prisma.location.findFirst({
        where: { id: locationId, tenantId },
      });
      if (!location) {
        return res.status(404).json({ error: 'Location not found.' });
      }

      const office = await prisma.office.create({
        data: { tenantId, locationId, name, notes },
        include: { location: { select: { id: true, name: true } } },
      });

      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user.id,
          userName: req.user.name,
          action: 'OFFICE_CREATED',
          entityType: 'Office',
          entityId: office.id,
          metadata: { name, locationId },
        },
      });

      res.status(201).json({ office });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PUT /api/offices/:id ─────────────────────────────────────────────────────
router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  validate(updateOfficeSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenantId;

      const existing = await prisma.office.findFirst({ where: { id, tenantId } });
      if (!existing) {
        return res.status(404).json({ error: 'Office not found.' });
      }

      // If changing locationId, verify new location belongs to tenant
      if (req.body.locationId) {
        const location = await prisma.location.findFirst({
          where: { id: req.body.locationId, tenantId },
        });
        if (!location) {
          return res.status(404).json({ error: 'Target location not found.' });
        }
      }

      const office = await prisma.office.update({
        where: { id },
        data: req.body,
        include: { location: { select: { id: true, name: true } } },
      });

      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user.id,
          userName: req.user.name,
          action: 'OFFICE_UPDATED',
          entityType: 'Office',
          entityId: id,
          metadata: { changes: req.body },
        },
      });

      res.json({ office });
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /api/offices/:id ──────────────────────────────────────────────────
router.delete('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const existing = await prisma.office.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return res.status(404).json({ error: 'Office not found.' });
    }

    const depositCount = await prisma.deposit.count({ where: { officeId: id, tenantId } });
    if (depositCount > 0) {
      return res.status(409).json({
        error: `Cannot delete office. It has ${depositCount} associated deposit(s). Reassign them first.`,
      });
    }

    await prisma.office.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: req.user.id,
        userName: req.user.name,
        action: 'OFFICE_DELETED',
        entityType: 'Office',
        entityId: id,
        metadata: { name: existing.name },
      },
    });

    res.json({ message: 'Office deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
