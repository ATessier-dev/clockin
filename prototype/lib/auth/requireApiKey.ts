import { timingSafeEqual } from "crypto";
import { UnauthorizedError } from "@/lib/auth/requireSession";

/**
 * Throws unless the request carries the shared secret (x-api-key header)
 * for external integrations that have no employee session of their own,
 * checked against CAISSE_API_KEY. Use instead of requireEmployee on routes
 * meant to be called by another app rather than a logged-in employee.
 */
export function requireApiKey(request: Request): void {
  const expected = process.env.CAISSE_API_KEY;
  const provided = request.headers.get("x-api-key");

  if (!expected || !provided) throw new UnauthorizedError();

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  const matches =
    expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);

  if (!matches) throw new UnauthorizedError();
}
