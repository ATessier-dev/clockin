import { getLocale } from "next-intl/server";
import { Clock3, Menu } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { Link } from "@/i18n/navigation";
import { NavBar, NavBarBrand, NavBarLinks } from "@/components/ui/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { getTranslation, navbarTranslations, type Language } from "@/translations";
import { withPrisma } from "@/lib/withPrisma";
import { LogoutButton } from "./logoutButton";
import { LanguageSwitcher } from "./languageSwitcher";
import { NavLink } from "./navLink";

const navItems = [
    { href: "/dashboard", key: "dashboard" },
    { href: "/schedule", key: "schedule" },
    { href: "/checklist", key: "checklist" },
] as const;

const superuserNavItems = [
    { href: "/timesheets", key: "timesheets" },
    { href: "/employees", key: "employees" },
] as const;

const trailingNavItems = [
    { href: "/settings", key: "settings" },
    { href: "/doc", key: "doc" },
] as const;

export default async function Navbar() {
    const [sessionUser, locale] = await Promise.all([getSession(), getLocale()]);
    const language = locale as Language;

    if (!sessionUser) return null;

    const visibleNavItems =
        sessionUser.role === "SUPERUSER"
            ? [...navItems, ...superuserNavItems, ...trailingNavItems]
            : [...navItems, ...trailingNavItems];

    const employee = await withPrisma((prisma) =>
        prisma.employee.findUniqueOrThrow({
            where: { id: sessionUser.employeeId },
            select: { id: true, firstName: true},
        })
    );

    return (
        <NavBar>
            <NavBarBrand className="flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-primary" aria-hidden="true" />
                <span>
                    {getTranslation(navbarTranslations.greetings, language)} {employee.firstName}
                </span>
            </NavBarBrand>

            <NavBarLinks className="hidden sm:flex">
                {visibleNavItems.map(({ href, key }) => (
                    <NavLink key={href} href={href}>
                        {getTranslation(navbarTranslations[key], language)}
                    </NavLink>
                ))}
            </NavBarLinks>

            <div className="flex items-center gap-3">
                <Badge variant={sessionUser.role === "SUPERUSER" ? "default" : "secondary"}>
                    {sessionUser.role}
                </Badge>
                <LanguageSwitcher language={language} />
                <LogoutButton language={language} />

                <div className="sm:hidden">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" aria-label="Menu">
                                <Menu className="h-4 w-4" aria-hidden="true" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {visibleNavItems.map(({ href, key }) => (
                                <DropdownMenuItem key={href} asChild>
                                    <Link href={href}>{getTranslation(navbarTranslations[key], language)}</Link>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </NavBar>
    );
}
