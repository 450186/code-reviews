import { PrismaClient } from "@prisma/client";

/**
 * Single shared Prisma client for the API process.
 * Logs queries in development to make debugging easier.
 */
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "production" ? ["error"] : ["query", "error", "warn"],
});
