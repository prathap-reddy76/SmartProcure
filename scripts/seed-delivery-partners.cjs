const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const PARTNERS = [
  { name: "Ravi Kumar", email: "ravi.kumar@smartprocure.com" },
  { name: "Suresh Reddy", email: "suresh.reddy@smartprocure.com" },
  { name: "Kiran Kumar", email: "kiran.kumar@smartprocure.com" },
  { name: "Venkatesh Naidu", email: "venkatesh.naidu@smartprocure.com" },
  { name: "Arjun Varma", email: "arjun.varma@smartprocure.com" },
];

async function seedDeliveryPartners() {
  console.log("=================================================");
  console.log("INITIALIZING 5 DELIVERY PARTNERS");
  console.log("=================================================");

  const shouldApprove = process.argv.includes("--approve");
  const shouldMakeAvailable = process.argv.includes("--available");

  for (const p of PARTNERS) {
    const existing = await prisma.user.findUnique({
      where: { email: p.email.toLowerCase() },
      include: { deliveryPartner: true },
    });

    if (existing) {
      console.log(`[EXISTS] User "${existing.name}" (${existing.email}) ID: ${existing.id}`);
      if (!existing.deliveryPartner) {
        console.log(`         Creating missing DeliveryPartner profile for ${existing.id}...`);
        await prisma.deliveryPartner.create({
          data: {
            userId: existing.id,
            isActive: shouldApprove ? true : existing.isActive,
            isAvailable: shouldMakeAvailable ? true : false,
            maxActiveDeliveries: 3,
          },
        });
        console.log(`         ✓ DeliveryPartner profile created.`);
      } else {
        if (shouldApprove || shouldMakeAvailable) {
          await prisma.$transaction([
            prisma.user.update({
              where: { id: existing.id },
              data: { isActive: shouldApprove ? true : existing.isActive },
            }),
            prisma.deliveryPartner.update({
              where: { id: existing.deliveryPartner.id },
              data: {
                isActive: shouldApprove ? true : existing.deliveryPartner.isActive,
                isAvailable: shouldMakeAvailable ? true : existing.deliveryPartner.isAvailable,
              },
            }),
          ]);
          console.log(`         ✓ Updated status: Approved=${shouldApprove}, Available=${shouldMakeAvailable}`);
        }
      }
      continue;
    }

    // Generate secure random initial password (not hardcoded)
    const secureRandomPassword = crypto.randomBytes(16).toString("hex") + "Aa1!";
    const passwordHash = await bcrypt.hash(secureRandomPassword, 10);

    // Initial status: pending approval (isActive: false) unless explicitly requested
    const isActive = shouldApprove ? true : false;
    const isAvailable = shouldMakeAvailable ? true : false;

    const user = await prisma.user.create({
      data: {
        name: p.name,
        email: p.email.toLowerCase(),
        role: "DELIVERY_PARTNER",
        passwordHash,
        isActive,
        deliveryPartner: {
          create: {
            isActive,
            isAvailable,
            maxActiveDeliveries: 3,
          },
        },
      },
      include: { deliveryPartner: true },
    });

    console.log(`[CREATED] User "${user.name}" (${user.email}) ID: ${user.id}`);
    console.log(`          Role: ${user.role} | Active (Approved): ${user.isActive}`);
    console.log(`          DeliveryPartner ID: ${user.deliveryPartner.id} | Available: ${user.deliveryPartner.isAvailable}`);
  }

  console.log("\n=================================================");
  console.log("DELIVERY PARTNERS SEEDED SUCCESSFULLY!");
  console.log("=================================================");
}

seedDeliveryPartners()
  .catch((err) => {
    console.error("FATAL ERROR SEEDING PARTNERS:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
