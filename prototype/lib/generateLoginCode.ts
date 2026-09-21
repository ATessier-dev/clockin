import { withPrisma } from "@/lib/withPrisma";

const CODE_LENGTH = 6;
const MAX_ATTEMPTS = 5;

function randomDigits(length: number): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

// Employees log in with this code instead of email/password — generated
// server-side so a superuser never has to invent (or leak) one by hand.
export async function generateUniqueLoginCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = randomDigits(CODE_LENGTH);
    const existing = await withPrisma((prisma) => prisma.employee.findUnique({ where: { code: candidate } }));
    if (!existing) return candidate;
  }
  throw new Error("Could not generate a unique login code after several attempts");
}
