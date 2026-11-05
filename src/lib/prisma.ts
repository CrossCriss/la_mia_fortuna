import { PrismaClient } from "@prisma/client";

// Один общий PrismaClient на процесс — иначе в dev-режиме Next.js
// (hot reload) на каждый рефреш открывалось бы новое соединение.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
