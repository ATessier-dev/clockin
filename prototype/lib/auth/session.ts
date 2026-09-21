import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getSessionSecret } from "@/lib/session-secret";

export const SESSION_COOKIE_NAME = "clockin_session";
const SESSION_TTL = "12h";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export type EmployeeRole = "EMPLOYEE" | "SUPERUSER";

export type SessionPayload = {
  employeeId: string;
  role: EmployeeRole;
  scope: "clockin";
};

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(getSessionSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    if (payload.scope !== "clockin" || typeof payload.employeeId !== "string") return null;
    if (payload.role !== "EMPLOYEE" && payload.role !== "SUPERUSER") return null;

    return { employeeId: payload.employeeId, role: payload.role, scope: "clockin" };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  };
}

/** Server Component / Route Handler helper — reads the session from cookies(). */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
