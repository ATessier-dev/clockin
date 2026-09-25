import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireEmployee, requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

// Keeps a single reference document's content well within a reasonable
// prompt size once it's fed to the LLM alongside the item's other documents.
const MAX_DOCUMENT_SIZE_BYTES = 200 * 1024;

/** Lists an item's reference documents (metadata only, no content). Any authenticated employee can read them. */
export async function GET(request: Request, { params }: RouteContext<"/api/posts/items/[id]/documents">) {
  try {
    await requireEmployee();
    const { id } = await params;

    const documents = await withPrisma((prisma) =>
      prisma.postDocument.findMany({
        where: { itemId: id },
        orderBy: { createdAt: "asc" },
        select: { id: true, filename: true, createdAt: true },
      })
    );

    return NextResponse.json({ documents });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw error;
  }
}

/**
 * Uploads a .txt reference document for a post item. Superuser only.
 * Rejects anything that isn't a plain-text file under the size cap, since
 * the content is passed to the LLM as-is.
 */
export async function POST(request: Request, { params }: RouteContext<"/api/posts/items/[id]/documents">) {
  try {
    await requireSuperuser();
    const { id } = await params;

    const item = await withPrisma((prisma) => prisma.postItem.findUnique({ where: { id } }));
    if (!item) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");

    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".txt") || file.type !== "text/plain") {
      return NextResponse.json({ error: "invalid_file" }, { status: 400 });
    }

    if (file.size === 0 || file.size > MAX_DOCUMENT_SIZE_BYTES) {
      return NextResponse.json({ error: "invalid_file" }, { status: 400 });
    }

    const content = await file.text();

    const document = await withPrisma((prisma) =>
      prisma.postDocument.create({
        data: { itemId: id, filename: file.name, content },
        select: { id: true, filename: true, createdAt: true },
      })
    );

    return NextResponse.json({ document }, { status: 201 });
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
