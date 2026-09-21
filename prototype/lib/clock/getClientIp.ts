// Reads the real client IP from a Route Handler request. On Vercel the
// **first** entry of x-forwarded-for is the client (proxies append their own
// after it); x-real-ip is the fallback for other setups. Local dev has no
// proxy in front of it, so DEV_CLOCK_IP lets you fake an IP without one.
export function getClientIp(request: Request): string {
  if (process.env.NODE_ENV !== "production" && process.env.DEV_CLOCK_IP) {
    return process.env.DEV_CLOCK_IP;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip")?.trim() ?? "";
}
