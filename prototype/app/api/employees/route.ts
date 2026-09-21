import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";
import { hashCode } from "@/lib/auth-utils";

// Never select codeHash — it must not leave the server.
const EMPLOYEE_SELECT = {
  id: true,
  code: true,
  firstName: true,
  lastName: true,
  role: true,
  phone: true,
  preferredWorkplaceId: true,
  availabilityNote: true,
  active: true,
} as const;

function isUniqueConstraintViolation(error: unknown): boolean {
  return Boolean(
    error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === "P2002"
  );
}

export async function GET() {
  try {
    await requireSuperuser();

    const employees = await withPrisma((prisma) =>
      prisma.employee.findMany({
        orderBy: [{ active: "desc" }, { firstName: "asc" }],
        select: EMPLOYEE_SELECT,
      })
    );

    return NextResponse.json({ employees });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperuser();

    const body = (await request.json().catch(() => null)) as {
      code?: unknown;
      firstName?: unknown;
      lastName?: unknown;
      role?: unknown;
      phone?: unknown;
      preferredWorkplaceId?: unknown;
      availabilityNote?: unknown;
    } | null;

    const code = typeof body?.code === "string" ? body.code.trim() : "";
    const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";
    const role = body?.role === "SUPERUSER" ? "SUPERUSER" : "EMPLOYEE";
    const phone = typeof body?.phone === "string" && body.phone.trim() ? body.phone.trim() : null;
    const preferredWorkplaceId =
      typeof body?.preferredWorkplaceId === "string" && body.preferredWorkplaceId
        ? body.preferredWorkplaceId
        : null;
    const availabilityNote =
      typeof body?.availabilityNote === "string" && body.availabilityNote.trim()
        ? body.availabilityNote.trim()
        : null;

    if (!code || !firstName || !lastName) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    // A fresh code is suggested by GET /api/employees/generate-code, but the
    // superuser can edit it — uniqueness is still enforced by the DB
    // constraint (see isUniqueConstraintViolation below).
    const codeHash = await hashCode(code);

    const employee = await withPrisma((prisma) =>
      prisma.employee.create({
        data: { code, codeHash, firstName, lastName, role, phone, preferredWorkplaceId, availabilityNote },
        select: EMPLOYEE_SELECT,
      })
    );

    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (isUniqueConstraintViolation(error)) {
      return NextResponse.json({ error: "code_taken" }, { status: 409 });
    }
    throw error;
  }
}
