const express = require('express');

const prisma = require('../lib/prisma');
const { authenticate, tenantGuard, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, tenantGuard, authorize('ADMIN', 'MANAGER'));

// ─── GET /api/audit ───────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      page = '1',
      limit = '50',
      userId,
      action,
      entityType,
      entityId,
      startDate,
      endDate,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where = { tenantId };
    if (userId) where.userId = userId;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
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

// ─── GET /api/audit/export ────────────────────────────────────────────────────
router.get('/export', async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { startDate, endDate, entityType } = req.query;

    const where = { tenantId };
    if (entityType) where.entityType = entityType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10000, // safety cap
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
    });

    // Build CSV
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (/[",\n\r]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      'ID',
      'Timestamp',
      'User Name',
      'User Email',
      'User Role',
      'Action',
      'Entity Type',
      'Entity ID',
      'Metadata',
    ];

    const rows = logs.map((log) => [
      escapeCSV(log.id),
      escapeCSV(log.createdAt.toISOString()),
      escapeCSV(log.user?.name || log.userName || ''),
      escapeCSV(log.user?.email || ''),
      escapeCSV(log.user?.role || ''),
      escapeCSV(log.action),
      escapeCSV(log.entityType),
      escapeCSV(log.entityId || ''),
      escapeCSV(log.metadata),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const filename = `audit-log-${tenantId}-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
