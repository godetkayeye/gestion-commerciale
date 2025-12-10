import { PrismaClient } from "@/app/generated/prisma";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

// Note: Pour augmenter le pool de connexions, ajoutez ?connection_limit=10&pool_timeout=20 à votre DATABASE_URL
// Exemple: mysql://user:pass@host:3306/db?connection_limit=10&pool_timeout=20
export const prisma: PrismaClient = global.prismaGlobal ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
} as any);

if (process.env.NODE_ENV !== "production") global.prismaGlobal = prisma;


