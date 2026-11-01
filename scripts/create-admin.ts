import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("❌ ERROR: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.");
    console.error("Usage (PowerShell):");
    console.error("  $env:ADMIN_EMAIL=\"your.email@example.com\"; $env:ADMIN_PASSWORD=\"StrongPass123!\"; npx tsx scripts/create-admin.ts");
    process.exit(1);
  }

  // Basic strength validation (at least 8 chars, one uppercase, one lowercase, one number)
  if (
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    console.error("❌ ERROR: Password is too weak. It must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.");
    process.exit(1);
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          passwordHash,
          role: "ADMIN",
          isActive: true, // Ensure the account can log in
        },
      });
      console.log(`✅ SUCCESS: Updated existing user (${email}) to ADMIN and set the password.`);
    } else {
      await prisma.user.create({
        data: {
          email,
          name: "System Admin",
          passwordHash,
          role: "ADMIN",
          isActive: true,
        },
      });
      console.log(`✅ SUCCESS: Created new ADMIN user (${email}).`);
    }

    console.log("------------------------------------------");
    console.log(`Email: ${email}`);
    console.log(`Role:  ADMIN`);
    console.log("------------------------------------------");

  } catch (error) {
    console.error("❌ ERROR: Failed to create or update ADMIN user:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
