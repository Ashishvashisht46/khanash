const express = require('express');
const { z } = require('zod');

const prisma = require('../lib/prisma');
const { authenticate, tenantGuard, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();
router.use(authenticate, tenantGuard);

// Days thresholds for claim aging buckets
const CLAIM_THRESHOLDS = {
  OUTSTANDING_DAYS: 30,
  BUCKET_30: 30,
  BUCKET_60: 60,
  BUCKET_90: 90,
};

// ─── Validation Schemas ───────────────────────────────────────────────────────
const claimActionSchema = z.object({
  action: z.enum(['DENY', 'APPEAL', 'WRITE_OFF', 'RESUBMIT', 'MARK_IN_PROGRESS']),
  remarks: z.string().optional(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDaysOpen(deposit) {
  const now = new Date();
  const created = new Date(deposit.createdAt);
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
}

const OPEN_STATUSES = ['OPEN', 'PENDING_REVIEW', 'COORDINATOR_APPROVED', 'TOTALS_MISMATCH'];

// ─── GET /api/claims/stats ────────────────────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    const now = new Date();
    const cutoff30 = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const cutoff60 = new Date(now - 60 * 24 * 60 * 60 * 1000);
    const cutoff90 = new Date(now - 90 * 24 * 60 * 60 * 1000);

    const openClaims = await prisma.deposit.findMany({
      where: {
        tenantId,
        status: { in: OPEN_STATUSES },
      },
      select: {
        id: true,
        depositId: true,
        depositTotal: true,
        createdAt: true,
        status: true,
        locationName: true,
        officeName: true,
        patient: true,
        insurance: true,
      },
    });

    const buckets = {
      under30: { count: 0, total: 0 },
      thirtyTo60: { count: 0, total: 0 },
      sixtyTo90: { count: 0, total: 0 },
      over90: { count: 0, total: 0 },
    };

    for (const claim of openClaims) {
      const days = getDaysOpen(claim);
      const total = parseFloat(claim.depositTotal) || 0;
      if (days < 30) {
        buckets.under30.count++;
        buckets.under30.total += total;
      } else if (days < 60) {
        buckets.thirtyTo60.count++;
        buckets.thirtyTo60.total += total;
      } else if (days < 90) {
        buckets.sixtyTo90.count++;
        buckets.sixtyTo90.total += total;
      } else {
        buckets.over90.count++;
        buckets.over90.total += total;
      }
    }

    res.json({
      totalOutstanding: openClaims.length,
      totalOutstandingAmount: openClaims.reduce((sum, c) => sum + (parseFloat(c.depositTotal) || 0), 0),
      buckets,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/claims ──────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      minDays = String(CLAIM_THRESHOLDS.OUTSTANDING_DAYS),
      page = '1',
      limit = '20',
      locationId,
      officeId,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const cutoffDate = new Date(Date.now() - parseInt(minDays, 10) * 24 * 60 * 60 * 1000);

    const where = {
      tenantId,
      status: { in: OPEN_STATUSES },
      createdAt: { lte: cutoffDate },
    };

    if (locationId) where.locationId = locationId;
    if (officeId) where.officeId = officeId;

    const [claims, total] = await Promise.all([
      prisma.deposit.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'asc' }, // oldest first
        include: {
          location: { select: { id: true, name: true } },
          office: { select: { id: true, name: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.deposit.count({ where }),
    ]);

    // Annotate with days open
    const annotated = claims.map((c) => ({
      ...c,
      daysOpen: getDaysOpen(c),
    }));

    res.json({
      claims: annotated,
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

// ─── PUT /api/claims/:id/action ───────────────────────────────────────────────
router.put(
  '/:id/action',
  authorize('ADMIN', 'MANAGER', 'COORDINATOR'),
  validate(claimActionSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      const { action, remarks } = req.body;

      const claim = await prisma.deposit.findFirst({
        where: { id, tenantId },
      });
      if (!claim) {
        return res.status(404).json({ error: 'Claim not found.' });
      }

      // Map action to status
      const actionStatusMap = {
        DENY: 'DENIED',
        APPEAL: 'UNDER_APPEAL',
        WRITE_OFF: 'WRITTEN_OFF',
        RESUBMIT: 'PENDING_REVIEW',
        MARK_IN_PROGRESS: 'IN_PROGRESS',
      };

      const newStatus = actionStatusMap[action];

      const updateData = { status: newStatus };
      if (remarks) updateData.remarks = remarks;

      const updated = await prisma.deposit.update({
        where: { id },
        data: updateData,
      });

      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user.id,
          userName: req.user.name,
          action: `CLAIM_${action}`,
          entityType: 'Deposit',
          entityId: id,
          metadata: { action, newStatus, remarks, depositId: claim.depositId },
        },
      });

      res.json({ claim: updated });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
