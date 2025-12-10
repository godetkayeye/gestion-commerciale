import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Ne pas spécifier engine pour utiliser la configuration par défaut de Prisma
  datasource: {
    url: env("DATABASE_URL"),
  },
} as any);
