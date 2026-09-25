import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireEmployee, requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";
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
  preferredPositionId: true,
  availabilityNote: true,
  locale: true,
  active: true,
} as const;

function isUniqueConstraintViolation(error: unknown): boolean {
  return Boolean(
    error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === "P2002"
  );
}

/**
 * Updates an employee's profile. An employee may edit their own row; only a
 * superuser may edit another employee's row or change code/role/active.
 * Returns 409 if the new login code is already taken.
 */
export async function PATCH(request: Request, { params }: RouteContext<"/api/employees/[id]">) {
  try {
    const session = await requireEmployee();
    const { id } = await params;
    const isSelf = session.employeeId === id;
    const isSuperuser = session.role === "SUPERUSER";

    if (!isSelf && !isSuperuser) {
      throw new ForbiddenError();
    }

    const existing = await withPrisma((prisma) => prisma.employee.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as {
      code?: unknown;
      firstName?: unknown;
      lastName?: unknown;
      role?: unknown;
      phone?: unknown;
      preferredWorkplaceId?: unknown;
      preferredPositionId?: unknown;
      availabilityNote?: unknown;
      locale?: unknown;
      active?: unknown;
    } | null;

    const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : undefined;
    const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : undefined;
    const phone = typeof body?.phone === "string" ? body.phone.trim() || null : undefined;
    const preferredWorkplaceId =
      typeof body?.preferredWorkplaceId === "string" ? body.preferredWorkplaceId || null : undefined;
    const preferredPositionId =
      typeof body?.preferredPositionId === "string" ? body.preferredPositionId || null : undefined;
    const availabilityNote =
      typeof body?.availabilityNote === "string" ? body.availabilityNote.trim() || null : undefined;
    const locale = body?.locale === "en" || body?.locale === "fr" ? body.locale : undefined;

    // The login code, role, and active status are only ever editable by a
    // superuser — a plain employee editing their own profile can't touch them,
    // even on their own row.
    const role = isSuperuser && (body?.role === "SUPERUSER" || body?.role === "EMPLOYEE") ? body.role : undefined;
    const active = isSuperuser && typeof body?.active === "boolean" ? body.active : undefined;
    const trimmedCode = isSuperuser && typeof body?.code === "string" ? body.code.trim() : "";
    const code = trimmedCode || undefined;
    const codeHash = trimmedCode ? await hashCode(trimmedCode) : undefined;

    const employee = await withPrisma((prisma) =>
      prisma.employee.update({
        where: { id },
        data: {
          code,
          codeHash,
          firstName,
          lastName,
          role,
          phone,
          preferredWorkplaceId,
          preferredPositionId,
          availabilityNote,
          locale,
          active,
        },
        select: EMPLOYEE_SELECT,
      })
    );

    return NextResponse.json({ employee });
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

// Employees are never hard-deleted: Shift and ClockEvent rows cascade-delete
// with their Employee (see prisma/schema.prisma), so removing a row would
// destroy historical shift/clock-in records. DELETE deactivates instead.
export async function DELETE(request: Request, { params }: RouteContext<"/api/employees/[id]">) {
  try {
    await requireSuperuser();
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.employee.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const employee = await withPrisma((prisma) =>
      prisma.employee.update({ where: { id }, data: { active: false }, select: EMPLOYEE_SELECT })
    );

    return NextResponse.json({ employee });
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
