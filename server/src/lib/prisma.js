const { PrismaClient } = require('@prisma/client');

// Singleton pattern — reuse the same PrismaClient instance across hot-reloads
// in development, and avoid exhausting DB connections in production.
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
