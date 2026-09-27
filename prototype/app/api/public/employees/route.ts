import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireApiKey } from "@/lib/auth/requireApiKey";
import { UnauthorizedError } from "@/lib/auth/requireSession";

/**
 * Lists active employees' names for external integrations (the cash
 * register app) that have no employee session of their own. Protected by
 * a shared API key instead of requireEmployee, and never selects
 * code/codeHash: those double as clock-in credentials and must stay
 * server-side only.
 */
export async function GET(request: Request) {
  try {
    requireApiKey(request);

    const employees = await withPrisma((prisma) =>
      prisma.employee.findMany({
        where: { active: true },
        orderBy: { firstName: "asc" },
        select: { id: true, firstName: true, lastName: true },
      })
    );

    return NextResponse.json({ employees });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
