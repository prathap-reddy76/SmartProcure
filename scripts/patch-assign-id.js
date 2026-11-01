const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "src", "actions", "delivery", "delivery-actions.ts");
let content = fs.readFileSync(filePath, "utf8");

const oldPattern = /(const nextStatus =\s+assignment\.status === "PENDING_ASSIGNMENT" \? "ASSIGNED" : assignment\.status;\s+await tx\.deliveryAssignment\.update\(\{\s+where: \{ )id: assignmentId(\ },)/;

if (!oldPattern.test(content)) {
  console.error("Pattern not found in delivery-actions.ts");
  process.exit(1);
}

content = content.replace(oldPattern, "$1id: assignment.id$2");
fs.writeFileSync(filePath, content, "utf8");
console.log("Successfully replaced where: { id: assignment.id } in assignDelivery!");
