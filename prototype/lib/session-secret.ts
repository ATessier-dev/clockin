const LOCAL_DEV_JWT_SECRET = "clockin-local-development-session-secret";

export function getSessionSecret(): Uint8Array {
  const jwtSecret = process.env.JWT_SECRET;

  if (jwtSecret) {
    return new TextEncoder().encode(jwtSecret);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET environment variable is not defined");
  }

  return new TextEncoder().encode(LOCAL_DEV_JWT_SECRET);
}
