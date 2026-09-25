"use client";

import type { ReactNode } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Navbar link that highlights itself when the current route matches or is nested under it. */
export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  // startsWith(`${href}/`) keeps e.g. /schedule highlighted on nested routes
  // like /schedule/[id], not just on an exact path match.
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "text-sm transition-colors hover:text-foreground",
        isActive ? "font-semibold text-foreground" : "text-muted-foreground"
      )}
    >
      {children}
    </Link>
  );
}
