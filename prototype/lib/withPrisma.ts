import { PrismaClient } from "@/src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Neon's serverless driver connects over WebSockets. Node.js (unlike the Edge
// runtime) has no native WebSocket global, so it needs one wired in — see
// https://neon.com/docs/serverless/serverless-driver#configuring-neonconfig-for-different-environments.
// This file runs in the Node.js runtime (not Edge) because argon2, used
// elsewhere in the app, requires native Node bindings.
neonConfig.webSocketConstructor = ws;

// Mirrors artur's lazy-singleton pool shape (lib/withPrisma.ts) but drops its
// Discord-alert instrumentation for plain console.error/warn — this is an
// internal tool, not a customer-facing storefront.
const DEFAULT_CONNECTION_LIMIT = process.env.NODE_ENV === "production" ? 2 : 2;
const DEFAULT_CONNECT_TIMEOUT_MS = 10_000;

function parseIntegerEnv(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function createPrismaClient(): PrismaClient {
  const connectionLimit = parseIntegerEnv("DATABASE_CONNECTION_LIMIT", DEFAULT_CONNECTION_LIMIT);

  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL,
    max: connectionLimit,
    connectionTimeoutMillis: parseIntegerEnv("DATABASE_CONNECT_TIMEOUT_MS", DEFAULT_CONNECT_TIMEOUT_MS),
  });

  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

// Built on first property access, not at import time — matches artur's
// withPrisma.ts so an import alone never opens a connection.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

/** Runs a Prisma query against the shared client, logging (and rethrowing) any failure. Use instead of importing `prisma` directly. */
export async function withPrisma<T>(fn: (_prisma: PrismaClient) => Promise<T>): Promise<T> {
  try {
    return await fn(getPrismaClient());
  } catch (error) {
    console.error("[Prisma] query failed:", error);
    throw error;
  }
}
