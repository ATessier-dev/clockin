import * as argon2 from "argon2";

// Same hash/verify shape as artur's lib/auth-utils.ts, without its legacy
// "3|" WordPress-hash compatibility prefix — clockin has no legacy accounts.

export async function hashCode(code: string): Promise<string> {
  return argon2.hash(code);
}

export async function verifyCode(code: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, code);
  } catch (error) {
    console.error("[auth] argon2 verification failed:", error);
    return false;
  }
}
