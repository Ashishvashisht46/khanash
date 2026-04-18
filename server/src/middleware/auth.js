const { verifyToken } = require('../lib/jwt');
const prisma = require('../lib/prisma');

/**
 * authenticate — Verify the Bearer JWT in the Authorization header.
 * Attaches the full user record to req.user.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided.' });
    }

    const token = authHeader.slice(7);
    const payload = verifyToken(token);

    // Load the user from DB to ensure they still exist and are active
    const user = await prisma.user.findFirst({
      where: {
        id: payload.id,
        tenantId: payload.tenantId,
        active: true,
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        name: true,
        role: true,
        active: true,
        locationId: true,
        officeId: true,
        assignedLocations: true,
        assignedOffices: true,
        photoUrl: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found or deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    next(err);
  }
}

/**
 * authorize — Role-based access control middleware factory.
 * Usage: router.get('/admin-only', authenticate, authorize('ADMIN'), handler)
 * @param {...string} roles - Allowed roles
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }
    next();
  };
}

/**
 * tenantGuard — Ensures the requested resource belongs to req.user.tenantId.
 * Attach tenantId from the authenticated user to the request for scoping.
 * This middleware must run AFTER authenticate.
 */
function tenantGuard(req, res, next) {
  if (!req.user || !req.user.tenantId) {
    return res.status(401).json({ error: 'Tenant context missing.' });
  }
  // Make tenantId easily accessible for all downstream handlers
  req.tenantId = req.user.tenantId;
  next();
}

module.exports = { authenticate, authorize, tenantGuard };
