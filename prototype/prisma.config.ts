import { config as loadEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Prisma 7 config for CLI commands only (db push / migrate / introspect /
// studio). The running app never reads this — see the note in
// prisma/schema.prisma and lib/withPrisma.ts.
//
// Unlike `next dev`, this file gets no automatic .env.local loading, and the
// Prisma CLI's own dotenv loading only looks at `.env` — so without this,
// `npm run db:push` etc. fail to resolve DATABASE_URL even though the app
// itself starts fine. Mirror Next.js's precedence: .env.local wins, .env is
// the fallback.
loadEnv({ path: ".env.local" });
loadEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
