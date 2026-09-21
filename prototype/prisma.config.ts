import { defineConfig, env } from "prisma/config";

// Prisma 7 config for CLI commands only (db push / migrate / introspect /
// studio). The running app never reads this — see the note in
// prisma/schema.prisma and lib/withPrisma.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
