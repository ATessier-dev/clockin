import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { hashCode } from "../lib/auth-utils";

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const montRoyal = await prisma.workplace.upsert({
    where: { key: "mont-royal" },
    update: {},
    create: {
      key: "mont-royal",
      label: "Mont-Royal",
    },
  });

  await prisma.workplace.upsert({
    where: { key: "vieux-port" },
    update: {},
    create: {
      key: "vieux-port",
      label: "Vieux-Port",
    },
  });

  const existingGalleristePosition = await prisma.position.findFirst({ where: { name: "Galeriste" } });
  if (!existingGalleristePosition) {
    await prisma.position.create({ data: { name: "Galeriste", color: "#0ea5e9", sortOrder: 0 } });
  }

  // Login looks the employee up by `code` directly (findUnique), so the
  // hash must be of that same value — not a separate secret. See the plan's
  // auth design: POST /api/auth/login { code } → findUnique({ code }) →
  // argon2.verify(code, codeHash).
  const employeeCodeHash = await hashCode("EMP001");
  await prisma.employee.upsert({
    where: { code: "EMP001" },
    update: { codeHash: employeeCodeHash },
    create: {
      code: "EMP001",
      codeHash: employeeCodeHash,
      firstName: "Alex",
      lastName: "Tremblay",
      role: "EMPLOYEE",
      preferredWorkplaceId: montRoyal.id,
    },
  });

  const superuserCodeHash = await hashCode("SUP001");
  await prisma.employee.upsert({
    where: { code: "SUP001" },
    update: { codeHash: superuserCodeHash },
    create: {
      code: "SUP001",
      codeHash: superuserCodeHash,
      firstName: "Sam",
      lastName: "Bouchard",
      role: "SUPERUSER",
      preferredWorkplaceId: montRoyal.id,
    },
  });

  console.log("Seeded workplaces + 2 test accounts (EMP001 / SUP001).");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
