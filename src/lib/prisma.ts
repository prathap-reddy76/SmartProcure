import { PrismaClient } from "@prisma/client";

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"],
    datasources: {
      db: {
        url: (process.env.NEXT_PHASE === 'phase-production-build' || process.argv?.includes('build') || process.env.npm_lifecycle_event === 'build')
          ? process.env.DATABASE_URL?.replace(/connection_limit=\d+/, 'connection_limit=1')
          : process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
