const { PrismaClient } = require('@prisma/client');

// Prisma 7 usa prisma.config.js automáticamente
const prisma = new PrismaClient();

module.exports = prisma;
