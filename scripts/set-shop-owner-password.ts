import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SHOP_OWNER_EMAIL;
  const password = process.env.SHOP_OWNER_PASSWORD;

  if (!email || !password) {
    console.error("❌ ERROR: SHOP_OWNER_EMAIL and SHOP_OWNER_PASSWORD environment variables are required.");
    console.error("Usage (PowerShell):");
    console.error("  $env:SHOP_OWNER_EMAIL=\"srilakshmi.agro@example.com\"; $env:SHOP_OWNER_PASSWORD=\"StrongPass123!\"; npx tsx scripts/set-shop-owner-password.ts");
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
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      console.error(`❌ ERROR: No user found with email: ${email}`);
      process.exit(1);
    }

    if (existingUser.role !== "SHOP_OWNER") {
      console.error(`❌ ERROR: User exists but has role '${existingUser.role}'. This script can only update SHOP_OWNER accounts.`);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        passwordHash,
        isActive: true, // Ensure the account can log in
      },
    });

    console.log(`✅ SUCCESS: SHOP_OWNER password updated successfully for: ${email}`);
    console.log("------------------------------------------");
    console.log(`Email: ${email}`);
    console.log(`Role:  SHOP_OWNER`);
    console.log("------------------------------------------");

  } catch (error) {
    console.error("❌ ERROR: Failed to update SHOP_OWNER password:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
