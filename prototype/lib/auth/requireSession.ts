import { getSession, type SessionPayload } from "@/lib/auth/session";

// Thrown by requireEmployee/requireSuperuser; API routes catch these by name
// to map them to HTTP 401/403 responses.
export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super("Forbidden");
    this.name = "ForbiddenError";
  }
}

/** Throws if no valid session cookie is present. Use at the top of protected routes. */
export async function requireEmployee(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

/** Throws unless the session belongs to a SUPERUSER. */
export async function requireSuperuser(): Promise<SessionPayload> {
  const session = await requireEmployee();
  if (session.role !== "SUPERUSER") throw new ForbiddenError();
  return session;
}
