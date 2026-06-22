import { PrismaClient } from "@prisma/client";

// Prefer pooled URL in production
const url = process.env.DATABASE_URL_RUNTIME || process.env.DATABASE_URL;

export const prisma = new PrismaClient({
  datasources: { db: { url } },
});
