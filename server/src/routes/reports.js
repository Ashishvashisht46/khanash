const express = require('express');
const { z } = require('zod');
const https = require('https');
const http = require('http');

const prisma = require('../lib/prisma');
const { authenticate, tenantGuard, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();
router.use(authenticate, tenantGuard);

// ─── Validation Schemas ───────────────────────────────────────────────────────
const generateReportSchema = z.object({
  type: z.enum(['weekly', 'daily', 'flags', 'monthly']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  locationId: z.string().uuid().optional(),
  officeId: z.string().uuid().optional(),
  format: z.enum(['text', 'json']).default('text'),
});

// ─── Helper: Gather report data ───────────────────────────────────────────────
async function gatherReportData(tenantId, type, startDate, endDate, locationId, officeId) {
  const now = new Date();
  let start, end;

  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    end = now;
    if (type === 'daily') {
      start = new Date(now);
      start.setDate(start.getDate() - 1);
    } else if (type === 'weekly') {
      start = new Date(now);
      start.setDate(start.getDate() - 7);
    } else if (type === 'monthly') {
      start = new Date(now);
      start.setDate(start.getDate() - 30);
    } else {
      start = new Date(now);
      start.setDate(start.getDate() - 7);
    }
  }

  const where = {
    tenantId,
    createdAt: { gte: start, lte: end },
  };
  if (locationId) where.locationId = locationId;
  if (officeId) where.officeId = officeId;

  const [deposits, statusBreakdown, topLocations, flagged] = await Promise.all([
    prisma.deposit.aggregate({
      where,
      _count: { id: true },
      _sum: { depositTotal: true, postedAmount: true, unapplied: true, insurancePaid: true },
    }),
    prisma.deposit.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
      _sum: { depositTotal: true },
    }),
    prisma.deposit.groupBy({
      by: ['locationName'],
      where,
      _count: { id: true },
      _sum: { depositTotal: true },
      orderBy: { _sum: { depositTotal: 'desc' } },
      take: 5,
    }),
    // Flags: deposits with discrepancies or stale status
    prisma.deposit.findMany({
      where: {
        tenantId,
        OR: [
          { status: 'TOTALS_MISMATCH' },
          { status: 'DENIED' },
          // Deposits open for > 30 days
          {
            status: { in: ['OPEN', 'PENDING_REVIEW'] },
            createdAt: { lte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
          },
        ],
      },
      select: {
        depositId: true,
        status: true,
        depositTotal: true,
        locationName: true,
        createdAt: true,
        patient: true,
      },
      take: 20,
    }),
  ]);

  return {
    period: { start: start.toISOString(), end: end.toISOString(), type },
    summary: {
      totalDeposits: deposits._count.id,
      totalAmount: Number(deposits._sum.depositTotal) || 0,
      totalPosted: Number(deposits._sum.postedAmount) || 0,
      totalUnapplied: Number(deposits._sum.unapplied) || 0,
      totalInsurancePaid: Number(deposits._sum.insurancePaid) || 0,
    },
    statusBreakdown: statusBreakdown.map((s) => ({
      status: s.status,
      count: s._count.id,
      total: Number(s._sum.depositTotal) || 0,
    })),
    topLocations: topLocations.map((l) => ({
      location: l.locationName || 'Unknown',
      count: l._count.id,
      total: Number(l._sum.depositTotal) || 0,
    })),
    flags: flagged,
  };
}

// ─── Helper: Call AI API ──────────────────────────────────────────────────────
function callAIApi(prompt) {
  return new Promise((resolve, reject) => {
    const AI_URL = process.env.AI_API_URL;
    if (!AI_URL) {
      return reject(new Error('AI_API_URL not configured'));
    }

    const url = new URL(AI_URL);
    const body = JSON.stringify({ prompt });
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.summary || parsed.text || data);
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy(new Error('AI API request timed out'));
    });

    req.write(body);
    req.end();
  });
}

// ─── POST /api/reports/generate ──────────────────────────────────────────────
router.post(
  '/generate',
  authorize('ADMIN', 'MANAGER'),
  validate(generateReportSchema),
  async (req, res, next) => {
    try {
      const tenantId = req.user.tenantId;
      const { type, startDate, endDate, locationId, officeId, format } = req.body;

      const data = await gatherReportData(tenantId, type, startDate, endDate, locationId, officeId);

      if (format === 'json') {
        return res.json({ report: data });
      }

      // Build AI prompt
      const prompt = `
You are a dental revenue cycle management analyst. Generate a concise ${type} report summary.

Report Period: ${data.period.start} to ${data.period.end}

Summary:
- Total Deposits: ${data.summary.totalDeposits}
- Total Amount: $${data.summary.totalAmount.toFixed(2)}
- Total Posted: $${data.summary.totalPosted.toFixed(2)}
- Total Unapplied: $${data.summary.totalUnapplied.toFixed(2)}
- Insurance Paid: $${data.summary.totalInsurancePaid.toFixed(2)}

Status Breakdown:
${data.statusBreakdown.map((s) => `- ${s.status}: ${s.count} deposits ($${s.total.toFixed(2)})`).join('\n')}

Top Locations by Volume:
${data.topLocations.map((l) => `- ${l.location}: ${l.count} deposits ($${l.total.toFixed(2)})`).join('\n')}

Flagged Items (${data.flags.length}):
${data.flags.slice(0, 5).map((f) => `- [${f.status}] ${f.depositId} - $${parseFloat(f.depositTotal).toFixed(2)} at ${f.locationName || 'Unknown'}`).join('\n')}

Please provide:
1. A brief executive summary (2-3 sentences)
2. Key performance highlights
3. Areas of concern requiring attention
4. Recommended next actions
`.trim();

      let summary;
      try {
        summary = await callAIApi(prompt);
      } catch (aiErr) {
        console.warn('[reports] AI API error, returning structured data:', aiErr.message);
        // Fallback to structured text summary
        summary = `
DENTAL RCM ${type.toUpperCase()} REPORT
Period: ${data.period.start} to ${data.period.end}

EXECUTIVE SUMMARY
Total of ${data.summary.totalDeposits} deposits processed totaling $${data.summary.totalAmount.toFixed(2)}.
Posted amount: $${data.summary.totalPosted.toFixed(2)} | Unapplied: $${data.summary.totalUnapplied.toFixed(2)}.

STATUS BREAKDOWN
${data.statusBreakdown.map((s) => `  ${s.status}: ${s.count} ($${s.total.toFixed(2)})`).join('\n')}

FLAGS (${data.flags.length} items require attention)
${data.flags.slice(0, 10).map((f) => `  [${f.status}] ${f.depositId} — $${parseFloat(f.depositTotal).toFixed(2)}`).join('\n')}
        `.trim();
      }

      // Log report generation
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user.id,
          userName: req.user.name,
          action: 'REPORT_GENERATED',
          entityType: 'Report',
          metadata: { type, period: data.period },
        },
      });

      res.json({
        report: {
          type,
          period: data.period,
          summary,
          data,
          generatedAt: new Date().toISOString(),
          generatedBy: req.user.email,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
