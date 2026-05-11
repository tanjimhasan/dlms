import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const SALT_ROUNDS = 12;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL || "admin@dlms.com";
  const password = process.env.SUPER_ADMIN_PASSWORD || "Admin@123456";

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`Super admin already exists: ${email}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  await prisma.user.create({
    data: {
      name: "Super Admin",
      email,
      password: hashedPassword,
      role: "SUPER_ADMIN",
    },
  });

  console.log(`Super admin created: ${email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
