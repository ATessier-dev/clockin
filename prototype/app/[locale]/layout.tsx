import type { ReactNode } from "react";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/site.config";
import { Providers } from "@/components/Providers";
import "../globals.css";

export const metadata = {
  title: siteConfig.site_name,
  description: siteConfig.site_description,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale}>
      <body>
        {/* No `messages`: locale strings come from translations/*.ts (artur's
            homegrown-dictionary pattern), not next-intl catalogs. The provider
            is still needed so client hooks like useRouter() from
            i18n/navigation.ts know the current locale. */}
        <NextIntlClientProvider locale={locale} messages={{}}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
