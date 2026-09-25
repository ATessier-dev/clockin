import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware wrappers around Next.js navigation APIs: they read/write the
// locale prefix automatically, so app code should import these instead of
// next/navigation directly.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
