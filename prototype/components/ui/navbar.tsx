import * as React from "react";
import { cn } from "@/lib/utils";

const NavBar = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
    ({ className, ...props }, ref) => (
        <header
            ref={ref}
            className={cn(
                "sticky top-0 z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-6",
                className
            )}
            {...props}
        />
    )
);
NavBar.displayName = "NavBar";

const NavBarBrand = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("text-lg font-semibold tracking-tight", className)} {...props} />
    )
);
NavBarBrand.displayName = "NavBarBrand";

const NavBarLinks = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
    ({ className, ...props }, ref) => (
        <nav ref={ref} className={cn("flex items-center gap-6", className)} {...props} />
    )
);
NavBarLinks.displayName = "NavBarLinks";

export { NavBar, NavBarBrand, NavBarLinks };
