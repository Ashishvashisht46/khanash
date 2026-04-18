const express = require('express');
const { z } = require('zod');
const crypto = require('crypto');

const prisma = require('../lib/prisma');
const { authenticate, tenantGuard, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();
router.use(authenticate, tenantGuard);

// ─── Validation Schemas ───────────────────────────────────────────────────────
const createDepositSchema = z.object({
  locationId: z.string().uuid().optional().nullable(),
  officeId: z.string().uuid().optional().nullable(),
  locationName: z.string().optional(),
  officeName: z.string().optional(),
  depositDate: z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid deposit date'),
  depositTotal: z.number().min(0).default(0),
  actualDeposit: z.number().min(0).default(0),
  postedAmount: z.number().min(0).default(0),
  unapplied: z.number().min(0).default(0),
  creditCards: z.number().min(0).default(0),
  efts: z.number().min(0).default(0),
  checks: z.number().min(0).default(0),
  patient: z.string().optional(),
  dos: z.string().optional().nullable(),
  billedAmt: z.number().min(0).default(0),
  insurancePaid: z.number().min(0).default(0),
  patientPortion: z.number().min(0).default(0),
  cdtCodes: z.string().optional(),
  provider: z.string().optional(),
  insurance: z.string().optional(),
  remarks: z.string().optional(),
  refId: z.string().optional(),
});

const updateDepositSchema = createDepositSchema.partial().extend({
  status: z
    .enum([
      'OPEN',
      'PENDING_REVIEW',
      'COORDINATOR_APPROVED',
      'MANAGER_APPROVED',
      'IN_PROGRESS',
      'COMPLETED',
      'DENIED',
      'UNDER_APPEAL',
      'WRITTEN_OFF',
      'TOTALS_MISMATCH',
    ])
    .optional(),
});

const commentSchema = z.object({
  text: z.string().min(1, 'Comment text is required').max(2000),
});

const approveSchema = z.object({
  remarks: z.string().optional(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateDepositId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'DEP-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function createAuditLog(tenantId, userId, userName, action, entityId, metadata = {}) {
  try {
    await prisma.auditLog.create({
      data: { tenantId, userId, userName, action, entityType: 'Deposit', entityId, metadata },
    });
  } catch (_) {}
}

/**
 * Build a Prisma WHERE clause for deposits based on the user's role.
 * - ADMIN/MANAGER: see all deposits for tenant
 * - COORDINATOR: see deposits for their assigned locations/offices
 * - USER: see only deposits they submitted
 */
function buildVisibilityFilter(user) {
  const base = { tenantId: user.tenantId };
  if (user.role === 'ADMIN' || user.role === 'MANAGER') {
    return base;
  }
  if (user.role === 'COORDINATOR') {
    const filters = [];
    if (user.assignedLocations?.length > 0) {
      filters.push({ locationId: { in: user.assignedLocations } });
    }
    if (user.assignedOffices?.length > 0) {
      filters.push({ officeId: { in: user.assignedOffices } });
    }
    if (user.locationId) filters.push({ locationId: user.locationId });
    if (user.officeId) filters.push({ officeId: user.officeId });
    if (filters.length === 0) return { ...base, submittedById: user.id };
    return { ...base, OR: filters };
  }
  // USER role — only own submissions
  return { ...base, submittedById: user.id };
}

// ─── GET /api/deposits/stats ─────────────────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const where = buildVisibilityFilter(req.user);

    const [total, byStatus, recentDeposits] = await Promise.all([
      prisma.deposit.aggregate({
        where,
        _count: { id: true },
        _sum: { depositTotal: true, postedAmount: true, unapplied: true },
      }),
      prisma.deposit.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
        _sum: { depositTotal: true },
      }),
      // Last 30 days chart data
      prisma.deposit.findMany({
        where: {
          ...where,
          depositDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        select: { depositDate: true, depositTotal: true, status: true },
        orderBy: { depositDate: 'asc' },
      }),
    ]);

    res.json({
      overview: {
        totalDeposits: total._count.id,
        totalAmount: total._sum.depositTotal || 0,
        totalPosted: total._sum.postedAmount || 0,
        totalUnapplied: total._sum.unapplied || 0,
      },
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
        total: s._sum.depositTotal || 0,
      })),
      chartData: recentDeposits,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/deposits ────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      status,
      locationId,
      officeId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const baseWhere = buildVisibilityFilter(req.user);

    // Additional filters
    const filters = { ...baseWhere };

    if (status) {
      filters.status = status;
    }
    if (locationId) {
      filters.locationId = locationId;
    }
    if (officeId) {
      filters.officeId = officeId;
    }
    if (startDate || endDate) {
      filters.depositDate = {};
      if (startDate) filters.depositDate.gte = new Date(startDate);
      if (endDate) filters.depositDate.lte = new Date(endDate);
    }
    if (search) {
      filters.OR = [
        { depositId: { contains: search, mode: 'insensitive' } },
        { patient: { contains: search, mode: 'insensitive' } },
        { provider: { contains: search, mode: 'insensitive' } },
        { insurance: { contains: search, mode: 'insensitive' } },
        { locationName: { contains: search, mode: 'insensitive' } },
        { officeName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Validate sort fields
    const allowedSortFields = ['createdAt', 'depositDate', 'depositTotal', 'status', 'updatedAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [deposits, totalCount] = await Promise.all([
      prisma.deposit.findMany({
        where: filters,
        skip,
        take: limitNum,
        orderBy: { [sortField]: sortOrder === 'asc' ? 'asc' : 'desc' },
        include: {
          _count: { select: { files: true, comments: true } },
          location: { select: { id: true, name: true } },
          office: { select: { id: true, name: true } },
        },
      }),
      prisma.deposit.count({ where: filters }),
    ]);

    res.json({
      deposits,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/deposits/:id ────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const where = buildVisibilityFilter(req.user);

    const deposit = await prisma.deposit.findFirst({
      where: { id, ...where },
      include: {
        files: { orderBy: { createdAt: 'asc' } },
        comments: { orderBy: { createdAt: 'asc' } },
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
        location: { select: { id: true, name: true, address: true } },
        office: { select: { id: true, name: true } },
      },
    });

    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found.' });
    }

    res.json({ deposit });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/deposits ───────────────────────────────────────────────────────
router.post('/', validate(createDepositSchema), async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    // Generate unique depositId with retry
    let depositId;
    let attempts = 0;
    do {
      depositId = generateDepositId();
      const exists = await prisma.deposit.findUnique({ where: { depositId } });
      if (!exists) break;
      attempts++;
    } while (attempts < 5);

    // Resolve location/office names if not provided
    let { locationName, officeName } = req.body;
    if (req.body.locationId && !locationName) {
      const loc = await prisma.location.findFirst({
        where: { id: req.body.locationId, tenantId },
        select: { name: true },
      });
      locationName = loc?.name;
    }
    if (req.body.officeId && !officeName) {
      const off = await prisma.office.findFirst({
        where: { id: req.body.officeId, tenantId },
        select: { name: true },
      });
      officeName = off?.name;
    }

    const deposit = await prisma.deposit.create({
      data: {
        tenantId,
        depositId,
        refId: req.body.refId,
        locationId: req.body.locationId,
        officeId: req.body.officeId,
        locationName,
        officeName,
        depositDate: new Date(req.body.depositDate),
        depositTotal: req.body.depositTotal,
        actualDeposit: req.body.actualDeposit,
        postedAmount: req.body.postedAmount,
        unapplied: req.body.unapplied,
        status: 'OPEN',
        creditCards: req.body.creditCards,
        efts: req.body.efts,
        checks: req.body.checks,
        patient: req.body.patient,
        dos: req.body.dos ? new Date(req.body.dos) : null,
        billedAmt: req.body.billedAmt,
        insurancePaid: req.body.insurancePaid,
        patientPortion: req.body.patientPortion,
        cdtCodes: req.body.cdtCodes,
        provider: req.body.provider,
        insurance: req.body.insurance,
        remarks: req.body.remarks,
        submittedById: req.user.id,
        submittedByEmail: req.user.email,
      },
    });

    await createAuditLog(tenantId, req.user.id, req.user.name, 'DEPOSIT_CREATED', deposit.id, {
      depositId,
      depositTotal: deposit.depositTotal,
    });

    res.status(201).json({ deposit });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/deposits/:id ────────────────────────────────────────────────────
router.put('/:id', validate(updateDepositSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const existing = await prisma.deposit.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Deposit not found.' });
    }

    // Role-based status transition checks
    const { status } = req.body;
    if (status) {
      const role = req.user.role;
      const allowedTransitions = {
        ADMIN: ['OPEN', 'PENDING_REVIEW', 'COORDINATOR_APPROVED', 'MANAGER_APPROVED', 'IN_PROGRESS', 'COMPLETED', 'DENIED', 'UNDER_APPEAL', 'WRITTEN_OFF', 'TOTALS_MISMATCH'],
        MANAGER: ['OPEN', 'PENDING_REVIEW', 'COORDINATOR_APPROVED', 'MANAGER_APPROVED', 'IN_PROGRESS', 'COMPLETED', 'DENIED', 'UNDER_APPEAL', 'WRITTEN_OFF', 'TOTALS_MISMATCH'],
        COORDINATOR: ['PENDING_REVIEW', 'COORDINATOR_APPROVED', 'TOTALS_MISMATCH'],
        USER: ['PENDING_REVIEW'],
      };
      if (!allowedTransitions[role]?.includes(status)) {
        return res.status(403).json({ error: `Your role (${role}) cannot set status to ${status}.` });
      }
    }

    const updateData = {};
    const allowedFields = [
      'locationId', 'officeId', 'locationName', 'officeName', 'depositDate', 'depositTotal',
      'actualDeposit', 'postedAmount', 'unapplied', 'status', 'creditCards', 'efts', 'checks',
      'patient', 'dos', 'billedAmt', 'insurancePaid', 'patientPortion', 'cdtCodes',
      'provider', 'insurance', 'remarks', 'refId',
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'depositDate' || field === 'dos') {
          updateData[field] = req.body[field] ? new Date(req.body[field]) : null;
        } else {
          updateData[field] = req.body[field];
        }
      }
    }

    const deposit = await prisma.deposit.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog(tenantId, req.user.id, req.user.name, 'DEPOSIT_UPDATED', deposit.id, {
      changes: updateData,
      previousStatus: existing.status,
    });

    res.json({ deposit });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/deposits/:id ─────────────────────────────────────────────────
router.delete('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const existing = await prisma.deposit.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return res.status(404).json({ error: 'Deposit not found.' });
    }

    await prisma.deposit.delete({ where: { id } });

    await createAuditLog(tenantId, req.user.id, req.user.name, 'DEPOSIT_DELETED', id, {
      depositId: existing.depositId,
    });

    res.json({ message: 'Deposit deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/deposits/:id/comments ─────────────────────────────────────────
router.post('/:id/comments', validate(commentSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const deposit = await prisma.deposit.findFirst({ where: { id, tenantId } });
    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found.' });
    }

    const comment = await prisma.comment.create({
      data: {
        tenantId,
        depositId: id,
        userId: req.user.id,
        userName: req.user.name,
        text: req.body.text,
      },
    });

    await createAuditLog(tenantId, req.user.id, req.user.name, 'COMMENT_ADDED', id, {
      commentId: comment.id,
    });

    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/deposits/:id/approve ──────────────────────────────────────────
router.post(
  '/:id/approve',
  authorize('ADMIN', 'MANAGER', 'COORDINATOR'),
  validate(approveSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      const { remarks } = req.body;

      const deposit = await prisma.deposit.findFirst({ where: { id, tenantId } });
      if (!deposit) {
        return res.status(404).json({ error: 'Deposit not found.' });
      }

      // Determine new status based on role
      let newStatus;
      if (req.user.role === 'COORDINATOR') {
        newStatus = 'COORDINATOR_APPROVED';
      } else if (req.user.role === 'MANAGER') {
        newStatus = 'MANAGER_APPROVED';
      } else {
        newStatus = 'COMPLETED';
      }

      const updateData = { status: newStatus };
      if (remarks) updateData.remarks = remarks;

      const updated = await prisma.deposit.update({
        where: { id },
        data: updateData,
      });

      await createAuditLog(tenantId, req.user.id, req.user.name, 'DEPOSIT_APPROVED', id, {
        newStatus,
        approvedBy: req.user.email,
      });

      res.json({ deposit: updated });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
