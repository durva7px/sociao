import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Tells the Prisma CLI (migrate, seed) where the schema is and which database to use.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: { url: env("DATABASE_URL") },
});
