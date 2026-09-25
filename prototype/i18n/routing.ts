import { defineRouting } from "next-intl/routing";

// French is the default locale: it is the primary audience for this internal tool.
export const routing = defineRouting({
  locales: ["en", "fr"],
  defaultLocale: "fr",
});
