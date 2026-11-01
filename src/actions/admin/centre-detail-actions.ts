"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { parseDateStringAsUTC, getTodayAsUTCDate } from "@/lib/date-utils";

export async function toggleCentreCropStatus(centreCropId: string, isActive: boolean) {
  const session = await requireRole("ADMIN");

  try {
    const centreCrop = await prisma.procurementCentreCrop.findUnique({
      where: { id: centreCropId },
      include: { crop: true }
    });

    if (!centreCrop) return { success: false, error: "Configuration not found." };

    if (!isActive) {
      // Check for active bookings for this specific crop at this centre
      const activeBookings = await prisma.procurementBooking.count({
        where: {
          centreId: centreCrop.centreId,
          cropId: centreCrop.cropId,
          status: {
            in: ["BOOKED", "ARRIVED", "WAITING", "IN_PROGRESS", "WEIGHING", "QUALITY_INSPECTION"]
          },
          slot: {
            date: { gte: getTodayAsUTCDate() }
          }
        }
      });

      if (activeBookings > 0) {
        return { 
          success: false, 
          error: `Cannot disable crop. There are ${activeBookings} active or upcoming bookings for ${centreCrop.crop.name} that must be processed or cancelled first.` 
        };
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.procurementCentreCrop.update({
        where: { id: centreCropId },
        data: { isActive }
      });

      await tx.auditLog.create({
        data: {
          actorUserId: (session?.user?.id as string),
          actorRole: "ADMIN",
          action: isActive ? "CENTRE_CROP_ENABLED" : "CENTRE_CROP_DISABLED",
          entityType: "ProcurementCentreCrop",
          entityId: centreCropId,
          metadata: { cropId: centreCrop.cropId, centreId: centreCrop.centreId }
        }
      });
    });

    revalidatePath(`/admin/procurement-centres/${centreCrop.centreId}`);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: "Failed to toggle crop status." };
  }
}

export async function createProcurementSlot(centreId: string, dateStr: string, startTime: string, endTime: string, capacity: number) {
  const session = await requireRole("ADMIN");

  if (capacity <= 0) return { success: false, error: "Capacity must be greater than 0." };
  if (!dateStr || !startTime || !endTime) return { success: false, error: "Missing required time fields." };

  try {
    const date = parseDateStringAsUTC(dateStr);

    await prisma.$transaction(async (tx) => {
      const slot = await tx.procurementSlot.create({
        data: {
          centreId,
          date,
          startTime,
          endTime,
          capacity,
          bookedCount: 0,
          isActive: true
        }
      });

      await tx.auditLog.create({
        data: {
          actorUserId: (session?.user?.id as string),
          actorRole: "ADMIN",
          action: "SLOT_CREATED",
          entityType: "ProcurementSlot",
          entityId: slot.id,
          metadata: { centreId, date: dateStr, startTime, capacity }
        }
      });
    });

    revalidatePath(`/admin/procurement-centres/${centreId}`);
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: "A slot for this date and start time already exists at this centre." };
    }
    return { success: false, error: "Failed to create slot." };
  }
}

export async function updateProcurementSlotCapacity(slotId: string, newCapacity: number) {
  const session = await requireRole("ADMIN");

  if (newCapacity < 0) return { success: false, error: "Capacity cannot be negative." };

  try {
    const slot = await prisma.procurementSlot.findUnique({
      where: { id: slotId }
    });

    if (!slot) return { success: false, error: "Slot not found." };
    if (newCapacity < slot.bookedCount) {
      return { success: false, error: `Cannot reduce capacity below current booked count (${slot.bookedCount}).` };
    }

    await prisma.$transaction(async (tx) => {
      await tx.procurementSlot.update({
        where: { id: slotId },
        data: { capacity: newCapacity }
      });

      await tx.auditLog.create({
        data: {
          actorUserId: (session?.user?.id as string),
          actorRole: "ADMIN",
          action: "SLOT_CAPACITY_UPDATED",
          entityType: "ProcurementSlot",
          entityId: slotId,
          metadata: { oldCapacity: slot.capacity, newCapacity }
        }
      });
    });

    revalidatePath(`/admin/procurement-centres/${slot.centreId}`);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: "Failed to update slot capacity." };
  }
}

export async function deactivateProcurementSlot(slotId: string) {
  const session = await requireRole("ADMIN");

  try {
    const slot = await prisma.procurementSlot.findUnique({
      where: { id: slotId }
    });

    if (!slot) return { success: false, error: "Slot not found." };

    if (slot.bookedCount > 0) {
      return { success: false, error: `Cannot deactivate a slot that has existing bookings (${slot.bookedCount}). Cancel the bookings first or increase capacity.` };
    }

    await prisma.$transaction(async (tx) => {
      await tx.procurementSlot.update({
        where: { id: slotId },
        data: { isActive: false }
      });

      await tx.auditLog.create({
        data: {
          actorUserId: (session?.user?.id as string),
          actorRole: "ADMIN",
          action: "SLOT_DEACTIVATED",
          entityType: "ProcurementSlot",
          entityId: slotId,
          metadata: {}
        }
      });
    });

    revalidatePath(`/admin/procurement-centres/${slot.centreId}`);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: "Failed to deactivate slot." };
  }
}


export async function addCropToCentre(centreId: string, cropId: string, dailyCapacity: number) {
  const session = await requireRole("ADMIN");
  
  if (dailyCapacity < 0) return { success: false, error: "Capacity cannot be negative." };

  try {
    // 1. Validate Centre exists
    const centre = await prisma.procurementCentre.findUnique({ where: { id: centreId } });
    if (!centre) return { success: false, error: "The selected procurement centre does not exist." };

    // 2. Validate Crop exists
    const crop = await prisma.crop.findUnique({ where: { id: cropId } });
    if (!crop) return { success: false, error: "Selected crop does not exist." };

    // 3. Check for duplicates
    const existing = await prisma.procurementCentreCrop.findUnique({
      where: { centreId_cropId: { centreId, cropId } }
    });
    if (existing) return { success: false, error: "This crop is already configured for this procurement centre." };

    // 4. Create the relationship
    await prisma.procurementCentreCrop.create({
      data: { centreId, cropId, dailyCapacity, isActive: true }
    });

    revalidatePath("/admin/procurement-centres");
    revalidatePath("/admin/procurement-centres/" + centreId);
    return { success: true };
  } catch (error: any) {
    console.error("Error adding crop to centre:", error);
    // Generic safe error message for FK violations or other database errors
    if (error?.code === 'P2003') {
      return { success: false, error: "Unable to add crop. The selected crop or centre is no longer available. Please refresh and try again." };
    }
    return { success: false, error: "Unable to add crop. An internal server error occurred." };
  }
}

export async function assignOfficerToCentre(centreId: string, userId: string) {
  const session = await requireRole("ADMIN");

  try {
    const centre = await prisma.procurementCentre.findUnique({ where: { id: centreId } });
    if (!centre) return { success: false, error: "The selected procurement centre does not exist." };

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
    console.error("Error assigning officer:", error);
    return { success: false, error: "Unable to assign officer. An internal server error occurred." };
  }
}
