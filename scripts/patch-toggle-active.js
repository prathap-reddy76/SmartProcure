const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "src", "actions", "delivery", "delivery-actions.ts");
let content = fs.readFileSync(filePath, "utf8");

const oldPattern = /(export async function toggleAvailability\([\s\S]*?const \{ partner \} = await getAuthorizedDeliveryPartner\(testPartnerUserId\);)/;

const newCode = `$1

    if (!partner.isActive || !partner.user.isActive) {
      return {
        error: "Unapproved or inactive delivery partners cannot change duty status.",
        isAvailable: false,
      };
    }`;

if (!oldPattern.test(content)) {
  console.error("Pattern not found in delivery-actions.ts");
  process.exit(1);
}

content = content.replace(oldPattern, newCode);
fs.writeFileSync(filePath, content, "utf8");
console.log("Successfully added unapproved/inactive check to toggleAvailability");
