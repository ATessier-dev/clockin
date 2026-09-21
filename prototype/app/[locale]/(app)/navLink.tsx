"use client";

import type { ReactNode } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
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
