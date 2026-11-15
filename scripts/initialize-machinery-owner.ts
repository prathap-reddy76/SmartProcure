import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("=================================================");
  console.log("MACHINERY OWNER ACCOUNT INITIALIZATION");
  console.log("=================================================");

  const targetEmail = (process.env.MACHINERY_OWNER_EMAIL || "mch_owner_156677@smartprocure.test").toLowerCase();
  const password = process.env.MACHINERY_OWNER_PASSWORD || process.argv[2] || "MachineryOwner@123";

  // Password complexity check
  if (
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    console.error("❌ ERROR: Password must be at least 8 characters long and contain uppercase, lowercase, and numeric characters.");
    process.exit(1);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
      include: { ownedMachinery: true },
    });

    if (!user) {
      console.error(`❌ ERROR: Target account ${targetEmail} not found in database.`);
      process.exit(1);
    }

    if (user.role !== "MACHINERY_OWNER") {
      console.error(`❌ ERROR: User role is ${user.role}, expected MACHINERY_OWNER.`);
      process.exit(1);
    }

    // Hash securely using bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Update account with bcrypt hash and ensure active status
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        isActive: true,
      },
    });

    console.log(`✅ SUCCESS: Initialized password for ${updatedUser.email}`);
    console.log(`   User ID:     ${updatedUser.id}`);
    console.log(`   Role:        ${updatedUser.role}`);
    console.log(`   IsActive:    ${updatedUser.isActive}`);
    console.log(`   Hash Type:   bcrypt (salt rounds: 10)`);
    console.log(`   Hash Length: ${updatedUser.passwordHash?.length} chars`);
    console.log(`   Machinery:   ${user.ownedMachinery.length} listings linked`);
    console.log("=================================================");
  } catch (error) {
    console.error("❌ ERROR initializing machinery owner password:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
