import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // argon2 ships a native (.node) addon — bundling it would break the
  // binding on Vercel's serverless functions, so keep it a plain
  // require() from node_modules instead.
  serverExternalPackages: ["argon2"],
};

export default withNextIntl(nextConfig);
