import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { verifyCode } from "@/lib/auth-utils";
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/auth/session";

/**
 * Authenticates an employee by their clock-in code (no session required).
 * Rejects unknown codes, inactive employees, and hash mismatches with a
 * generic 401 to avoid leaking which case failed, then sets the session cookie.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  if (!code) {
    return NextResponse.json({ error: "code_required" }, { status: 400 });
  }

  const employee = await withPrisma((prisma) =>
    prisma.employee.findUnique({ where: { code } })
  );

  if (!employee || !employee.active || !(await verifyCode(code, employee.codeHash))) {
    return NextResponse.json({ error: "invalid_code" }, { status: 401 });
  }

  const token = await createSessionToken({
    employeeId: employee.id,
    role: employee.role,
    scope: "clockin",
  });

  const response = NextResponse.json({
    employee: {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      role: employee.role,
    },
  });
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
  return response;
}
