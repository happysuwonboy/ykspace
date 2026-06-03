import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash("yhloveky0422", 10);

  await prisma.user.upsert({
    where: { email: "syh@yk.com" },
    update: {},
    create: { name: "Y", email: "syh@yk.com", password },
  });

  await prisma.user.upsert({
    where: { email: "kky@yk.com" },
    update: {},
    create: { name: "K", email: "kky@yk.com", password },
  });

  console.log("✅ Users seeded");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
