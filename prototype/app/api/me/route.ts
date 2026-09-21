import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireEmployee, UnauthorizedError } from "@/lib/auth/requireSession";

// Temporary route used only to verify the auth foundation end-to-end
// (Build order step 1). Superseded once the dashboard page exists.
export async function GET() {
  try {
    const session = await requireEmployee();
    const employee = await withPrisma((prisma) =>
      prisma.employee.findUniqueOrThrow({
        where: { id: session.employeeId },
        select: { id: true, firstName: true, lastName: true, role: true, locale: true },
      })
    );
    return NextResponse.json({ employee });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
