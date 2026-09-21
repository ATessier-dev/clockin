import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

// Locale routing only — no multi-tenant/domain logic, no auth. Auth is
// enforced per-layout (see (app)/layout.tsx), matching artur's
// dashboard/layout.tsx pattern rather than centralizing it here.
export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};
