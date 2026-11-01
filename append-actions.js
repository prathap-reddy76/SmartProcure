const fs = require('fs');

const code = `
export async function addCropToCentre(centreId: string, cropId: string, dailyCapacity: number) {
  const session = await requireRole("ADMIN");
  
  if (dailyCapacity < 0) return { success: false, error: "Capacity cannot be negative." };

  try {
    const existing = await prisma.procurementCentreCrop.findUnique({
      where: { centreId_cropId: { centreId, cropId } }
    });
    if (existing) return { success: false, error: "Crop is already added to this centre." };

    await prisma.procurementCentreCrop.create({
      data: { centreId, cropId, dailyCapacity, isActive: true }
    });

    revalidatePath("/admin/procurement-centres");
    revalidatePath("/admin/procurement-centres/" + centreId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to add crop." };
  }
}

export async function assignOfficerToCentre(centreId: string, userId: string) {
  const session = await requireRole("ADMIN");

  try {
    const officer = await prisma.user.findUnique({ where: { id: userId } });
    if (!officer || officer.role !== "PROCUREMENT_OFFICER") {
      return { success: false, error: "User is not a valid procurement officer." };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { procurementCentreId: centreId }
    });

    revalidatePath("/admin/procurement-centres");
    revalidatePath("/admin/procurement-centres/" + centreId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to assign officer." };
  }
}
`;
const path = 'src/actions/admin/centre-detail-actions.ts';
let content = fs.readFileSync(path, 'utf8');
content += '\n' + code;
fs.writeFileSync(path, content, 'utf8');
console.log("Appended actions.");
