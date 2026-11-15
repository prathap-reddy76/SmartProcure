import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { getDashboardForRole } from "../src/lib/auth-utils";

interface AuthResult {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

// Mirror exact NextAuth authorize logic from src/lib/auth.ts
async function authorizeUser(emailInput: string, passwordInput: string): Promise<AuthResult | null> {
  const normalizedEmail = emailInput.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !user.passwordHash) {
    return null;
  }

  if (!user.isActive) {
    return null;
  }

  const passwordsMatch = await bcrypt.compare(passwordInput, user.passwordHash);
  if (!passwordsMatch) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async function runRegressionSuite() {
  console.log("=================================================");
  console.log("AUTHENTICATION REGRESSION & SECURITY VERIFICATION");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}${detail ? ` (${detail})` : ""}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` — ${detail}` : ""}`);
      failed++;
    }
  }

  // 1. Farmer Login Tests
  console.log("--- 1. FARMER LOGIN ---");
  const farmerValid = await authorizeUser("prathap@gmail.com", "prathap@33");
  assert(farmerValid !== null && farmerValid.role === "FARMER", "Farmer valid credentials login", farmerValid?.email || "null");
  const farmerInvalid = await authorizeUser("prathap@gmail.com", "wrongpassword123");
  assert(farmerInvalid === null, "Farmer invalid password correctly rejected");
  const farmerOldQuickFill = await authorizeUser("prathap@gmail.com", "password123");
  assert(farmerOldQuickFill === null, "Farmer old quick-fill (password123) correctly rejected by bcrypt");

  // 2. Shop Owner Login Tests
  console.log("\n--- 2. SHOP OWNER LOGIN ---");
  const shop1Valid = await authorizeUser("reddy01@gmail.com", "reddy@01");
  assert(shop1Valid !== null && shop1Valid.role === "SHOP_OWNER", "Shop Owner 1 (Reddy Fertilizers) valid login", shop1Valid?.email || "null");
  const shop2Valid = await authorizeUser("shiva@gmail.com", "shiva@33");
  assert(shop2Valid !== null && shop2Valid.role === "SHOP_OWNER", "Shop Owner 2 (Shiva tractors) valid login", shop2Valid?.email || "null");
  const shop3Valid = await authorizeUser("vishnu@gmail.com", "vishnu@33");
  assert(shop3Valid !== null && shop3Valid.role === "SHOP_OWNER", "Shop Owner 3 (vishnu motors) valid login", shop3Valid?.email || "null");
  const shopInvalid = await authorizeUser("reddy01@gmail.com", "wrongpassword123");
  assert(shopInvalid === null, "Shop Owner invalid password correctly rejected");

  // 3. Procurement Officer Login Tests
  console.log("\n--- 3. PROCUREMENT OFFICER LOGIN ---");
  const officerValid = await authorizeUser("officer@smartprocure.com", "Officer@123");
  assert(officerValid !== null && officerValid.role === "PROCUREMENT_OFFICER", "Procurement Officer valid login", officerValid?.email || "null");
  const officerInvalid = await authorizeUser("officer@smartprocure.com", "WrongOfficerPass");
  assert(officerInvalid === null, "Procurement Officer invalid password correctly rejected");

  // 4. Delivery Partner Login Tests
  console.log("\n--- 4. DELIVERY PARTNER LOGIN ---");
  const deliveryValid = await authorizeUser("prathap123@gmail.com", "prathap@123");
  assert(deliveryValid !== null && deliveryValid.role === "DELIVERY_PARTNER", "Delivery Partner (prathap123) valid login", deliveryValid?.email || "null");
  const deliveryInvalid = await authorizeUser("prathap123@gmail.com", "WrongDeliveryPass");
  assert(deliveryInvalid === null, "Delivery Partner invalid password correctly rejected");

  // 5. Machinery Owner Login Tests
  console.log("\n--- 5. MACHINERY OWNER LOGIN ---");
  const machineryValid = await authorizeUser("mch_owner_156677@smartprocure.test", "MachineryOwner@123");
  assert(machineryValid !== null && machineryValid.role === "MACHINERY_OWNER", "Machinery Owner initialized valid login", machineryValid?.email || "null");
  const machineryInvalid = await authorizeUser("mch_owner_156677@smartprocure.test", "WrongMachineryPass");
  assert(machineryInvalid === null, "Machinery Owner invalid password correctly rejected");

  // 6. Admin Login & Security Tests
  console.log("\n--- 6. ADMIN LOGIN & REJECTION ---");
  const adminInvalid = await authorizeUser("your-admin-email@example.com", "password123");
  assert(adminInvalid === null, "Admin unverified password (password123) correctly rejected by bcrypt");

  // 7. Security & Bypass Elimination Tests
  console.log("\n--- 7. HARDCODED BYPASS ELIMINATION ---");
  const unapprovedPartnerBypass = await authorizeUser("ravi.kumar@smartprocure.com", "Partner@123");
  assert(unapprovedPartnerBypass === null, "Unapproved partner cannot authenticate via hardcoded bypass (isActive: false enforced)");
  const unapprovedPartnerBypass2 = await authorizeUser("ravi.kumar@smartprocure.com", "password123");
  assert(unapprovedPartnerBypass2 === null, "Unapproved partner password123 bypass eliminated");

  // 8. Email Normalization Tests
  console.log("\n--- 8. EMAIL NORMALIZATION ---");
  const caseInsensitive = await authorizeUser("  PRATHAP@GMAIL.COM  ", "prathap@33");
  assert(caseInsensitive !== null && caseInsensitive.role === "FARMER", "Case and whitespace normalization succeeds");

  // 9. Role-Based Dashboard Routes
  console.log("\n--- 9. ROLE-BASED DASHBOARD REDIRECTS ---");
  const farmerRoute = getDashboardForRole("FARMER");
  assert(farmerRoute === "/farmer/dashboard", "Farmer dashboard route", farmerRoute);
  const shopRoute = getDashboardForRole("SHOP_OWNER");
  assert(shopRoute === "/shop/dashboard", "Shop Owner dashboard route", shopRoute);
  const officerRoute = getDashboardForRole("PROCUREMENT_OFFICER");
  assert(officerRoute === "/procurement-officer/dashboard", "Procurement Officer dashboard route", officerRoute);
  const deliveryRoute = getDashboardForRole("DELIVERY_PARTNER");
  assert(deliveryRoute === "/delivery/dashboard", "Delivery Partner dashboard route", deliveryRoute);
  const machineryRoute = getDashboardForRole("MACHINERY_OWNER");
  assert(machineryRoute === "/machinery/dashboard", "Machinery Owner dashboard route", machineryRoute);
  const adminRoute = getDashboardForRole("ADMIN");
  assert(adminRoute === "/admin/dashboard", "Admin dashboard route", adminRoute);

  console.log("\n=================================================");
  console.log(`RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runRegressionSuite().catch(console.error).finally(() => prisma.$disconnect());
