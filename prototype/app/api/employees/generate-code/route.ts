import { NextResponse } from "next/server";
import { requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";
import { generateUniqueLoginCode } from "@/lib/generateLoginCode";

// Suggests a fresh unique login code for the "add employee" form — the
// superuser can still edit it before saving (see app/api/employees/route.ts).
export async function GET() {
  try {
    await requireSuperuser();
    const code = await generateUniqueLoginCode();
    return NextResponse.json({ code });
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
