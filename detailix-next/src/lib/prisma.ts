import { PrismaClient } from "@/generated/prisma/client";

// Singleton : Next recharge les modules à chaud en dev, ce qui créerait sinon
// une nouvelle connexion à chaque changement et épuiserait le pool.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
