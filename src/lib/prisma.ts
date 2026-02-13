import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Singleton
 *
 * In development, Next.js hot-reloading creates new instances of PrismaClient
 * which can exhaust database connections. This singleton pattern prevents that
 * by storing the client in the global object.
 *
 * @see https://www.prisma.io/docs/guides/database/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Gracefully disconnect Prisma on application shutdown
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

/**
 * Connect to the database with retry logic
 * Useful for serverless environments where connections may be cold
 */
export async function connectPrisma(maxRetries = 3, delayMs = 1000): Promise<void> {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      await prisma.$connect();
      return;
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs * retries));
    }
  }
}

export default prisma;
