const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "src", "actions", "delivery", "delivery-actions.ts");
let content = fs.readFileSync(filePath, "utf8");

const oldPattern = /async function getAuthorizedDeliveryPartner\(testPartnerUserId\?: string\) \{[\s\S]*?partnerUserId = \(session\.user as SessionUser\)\.id;\s+\}/;

const newCode = `async function getAuthorizedDeliveryPartner(testPartnerUserId?: string) {
  let partnerUserId: string | null = null;
  if (testPartnerUserId) {
    partnerUserId = testPartnerUserId;
  } else {
    try {
      const session = await auth();
      if (session?.user?.id) {
        partnerUserId = session.user.id;
      }
    } catch {}

    if (!partnerUserId) {
      const session = await requireRole("DELIVERY_PARTNER");
      partnerUserId = (session.user as SessionUser).id;
    }
  }`;

if (!oldPattern.test(content)) {
  console.error("Pattern not found in delivery-actions.ts");
  process.exit(1);
}

content = content.replace(oldPattern, newCode);
fs.writeFileSync(filePath, content, "utf8");
console.log("Successfully updated getAuthorizedDeliveryPartner");
