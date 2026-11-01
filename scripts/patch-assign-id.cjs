const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "src", "actions", "delivery", "delivery-actions.ts");
let content = fs.readFileSync(filePath, "utf8");

const oldPattern = /await tx\.deliveryAssignment\.update\(\{\s+where: \{ id: assignmentId \},/;

const newCode = `await tx.deliveryAssignment.update({
        where: { id: assignment.id },`;

if (!oldPattern.test(content)) {
  console.error("Pattern not found in delivery-actions.ts");
  process.exit(1);
}

content = content.replace(oldPattern, newCode);
fs.writeFileSync(filePath, content, "utf8");
console.log("Successfully updated update where clause in assignDelivery");
