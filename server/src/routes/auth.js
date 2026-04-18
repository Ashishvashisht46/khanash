const express = require('express');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const { z } = require('zod');
const crypto = require('crypto');

const prisma = require('../lib/prisma');
const { generateToken } = require('../lib/jwt');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Validation Schemas ───────────────────────────────────────────────────────
const googleSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
  tenantSlug: z.string().min(1, 'Tenant slug is required'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  tenantSlug: z.string().min(1, 'Tenant slug is required'),
  inviteToken: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  tenantSlug: z.string().min(1, 'Tenant slug is required'),
});

const accessRequestSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  roleHint: z.string().optional(),
  reason: z.string().optional(),
  tenantSlug: z.string().optional(),
});

const inviteSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'COORDINATOR', 'USER']).default('USER'),
  locationId: z.string().uuid().optional(),
  officeId: z.string().uuid().optional(),
  expiresInHours: z.number().int().min(1).max(720).default(48),
});

// ─── Helper ───────────────────────────────────────────────────────────────────
async function createAuditLog(tenantId, userId, userName, action, entityType, entityId, metadata = {}) {
  try {
    await prisma.auditLog.create({
      data: { tenantId, userId, userName, action, entityType, entityId, metadata },
    });
  } catch (_) {
    // Audit logging should never break the main flow
  }
}

// ─── POST /api/auth/google ────────────────────────────────────────────────────
router.post('/google', validate(googleSchema), async (req, res, next) => {
  try {
    const { credential, tenantSlug } = req.body;

    // Verify Google token
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ error: 'Invalid Google token.' });
    }

    const { sub: googleId, email, name, picture } = payload;

    // Find tenant
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: { tenantId: tenant.id, email },
    });

    if (!user) {
      // Check if there's an approved access request or valid invite
      const accessReq = await prisma.accessRequest.findFirst({
        where: { email, status: 'APPROVED' },
      });
      if (!accessReq) {
        return res.status(403).json({
          error: 'No approved account found. Please request access first.',
        });
      }

      user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email,
          name: name || email.split('@')[0],
          googleId,
          photoUrl: picture,
          role: 'USER',
          active: true,
        },
      });

      await createAuditLog(tenant.id, user.id, user.name, 'USER_CREATED_VIA_GOOGLE', 'User', user.id, { email });
    } else {
      // Update google details if missing
      if (!user.googleId || user.photoUrl !== picture) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, photoUrl: picture },
        });
      }
    }

    if (!user.active) {
      return res.status(403).json({ error: 'Account deactivated. Contact your administrator.' });
    }

    const token = generateToken(user);
    await createAuditLog(tenant.id, user.id, user.name, 'LOGIN_GOOGLE', 'User', user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        photoUrl: user.photoUrl,
        locationId: user.locationId,
        officeId: user.officeId,
        assignedLocations: user.assignedLocations,
        assignedOffices: user.assignedOffices,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password, tenantSlug, inviteToken } = req.body;

    // Find tenant
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }

    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: { tenantId: tenant.id, email },
    });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Determine role from invite token if provided
    let role = 'USER';
    let locationId = null;
    let officeId = null;

    if (inviteToken) {
      const invite = await prisma.inviteToken.findFirst({
        where: {
          token: inviteToken,
          tenantId: tenant.id,
          used: false,
          expiresAt: { gt: new Date() },
        },
      });
      if (!invite) {
        return res.status(400).json({ error: 'Invalid or expired invite token.' });
      }
      role = invite.role;
      locationId = invite.locationId;
      officeId = invite.officeId;

      // Mark invite as used
      await prisma.inviteToken.update({
        where: { id: invite.id },
        data: { used: true },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email,
        name,
        password: hashedPassword,
        role,
        active: true,
        locationId,
        officeId,
      },
    });

    await createAuditLog(tenant.id, user.id, user.name, 'USER_REGISTERED', 'User', user.id, { email, role });

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        locationId: user.locationId,
        officeId: user.officeId,
        assignedLocations: user.assignedLocations,
        assignedOffices: user.assignedOffices,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password, tenantSlug } = req.body;

    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }

    const user = await prisma.user.findFirst({
      where: { tenantId: tenant.id, email },
    });

    if (!user || !user.password) {
      // Avoid timing attacks — still compare a dummy hash
      await bcrypt.compare(password, '$2a$12$invalidhashfortimingsafety000000000000000000000');
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.active) {
      return res.status(403).json({ error: 'Account deactivated. Contact your administrator.' });
    }

    const token = generateToken(user);
    await createAuditLog(tenant.id, user.id, user.name, 'LOGIN_PASSWORD', 'User', user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        photoUrl: user.photoUrl,
        locationId: user.locationId,
        officeId: user.officeId,
        assignedLocations: user.assignedLocations,
        assignedOffices: user.assignedOffices,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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
        location: { select: { id: true, name: true } },
        office: { select: { id: true, name: true } },
        tenant: { select: { id: true, name: true, slug: true, logoUrl: true } },
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

// ─── POST /api/auth/request-access ───────────────────────────────────────────
router.post('/request-access', validate(accessRequestSchema), async (req, res, next) => {
  try {
    const { name, email, roleHint, reason, tenantSlug } = req.body;

    // Optionally link to tenant
    let tenantId = null;
    if (tenantSlug) {
      const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
      if (tenant) tenantId = tenant.id;
    }

    // Prevent duplicate pending requests
    const existing = await prisma.accessRequest.findFirst({
      where: { email, status: 'PENDING' },
    });
    if (existing) {
      return res.status(409).json({ error: 'An access request for this email is already pending.' });
    }

    const request = await prisma.accessRequest.create({
      data: { tenantId, name, email, roleHint, reason, status: 'PENDING' },
    });

    res.status(201).json({
      message: 'Access request submitted successfully. You will be notified when approved.',
      requestId: request.id,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/invite ────────────────────────────────────────────────────
router.post(
  '/invite',
  authenticate,
  authorize('ADMIN'),
  validate(inviteSchema),
  async (req, res, next) => {
    try {
      const { role, locationId, officeId, expiresInHours } = req.body;
      const tenantId = req.user.tenantId;

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

      const invite = await prisma.inviteToken.create({
        data: { tenantId, token, role, locationId, officeId, expiresAt },
      });

      await createAuditLog(
        tenantId,
        req.user.id,
        req.user.name,
        'INVITE_CREATED',
        'InviteToken',
        invite.id,
        { role, expiresAt }
      );

      const inviteUrl = `${process.env.CLIENT_URL}/register?token=${token}&tenant=${
        (await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } }))?.slug
      }`;

      res.status(201).json({
        message: 'Invite created.',
        inviteUrl,
        token,
        expiresAt,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
