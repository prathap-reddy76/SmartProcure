"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { SessionUser } from "@/types/auth";
import { revalidatePath } from "next/cache";
import { notifyProcurementWeighingCompleted } from "@/lib/notifications";

export async function startWeighing(bookingId: string) {
  const session = await requireRole("PROCUREMENT_OFFICER");
  const user = session.user as SessionUser;

  const officer = await prisma.user.findUnique({
    where: { id: user.id },
    select: { procurementCentreId: true }
  });

  if (!officer?.procurementCentreId) {
    return { success: false, error: "No procurement centre assigned to your profile." };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.procurementBooking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) throw new Error("Booking not found.");
      if (booking.centreId !== officer.procurementCentreId) throw new Error("Unauthorized.");
      if (booking.status !== "IN_PROGRESS") throw new Error("Booking must be IN_PROGRESS to start weighing.");

      await tx.procurementBooking.update({ where: { id: bookingId, status: "IN_PROGRESS" }, data: { status: "WEIGHING", weighingStartedAt: new Date() } });
      await tx.auditLog.create({ data: { actorUserId: user.id, actorRole: "PROCUREMENT_OFFICER", action: "PROCUREMENT_WEIGHING_STARTED", entityType: "ProcurementBooking", entityId: bookingId, metadata: {} } });

      return { success: true };
    });
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to start weighing." };
  }
}

export async function submitWeighing(bookingId: string, grossWeight: number, tareWeight: number) {
  const session = await requireRole("PROCUREMENT_OFFICER");
  const user = session.user as SessionUser;

  const officer = await prisma.user.findUnique({
    where: { id: user.id },
    select: { procurementCentreId: true }
  });

  if (!officer?.procurementCentreId) {
    return { success: false, error: "No procurement centre assigned to your profile." };
  }

  if (grossWeight <= 0) return { success: false, error: "Gross weight must be greater than zero." };
  if (tareWeight < 0) return { success: false, error: "Tare weight cannot be negative." };
  if (tareWeight >= grossWeight) return { success: false, error: "Tare weight must be less than gross weight." };

  const netWeight = grossWeight - tareWeight;

  try {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.procurementBooking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) throw new Error("Booking not found.");
      if (booking.centreId !== officer.procurementCentreId) throw new Error("Unauthorized.");
      if (booking.status !== "WEIGHING") throw new Error("Booking is not in WEIGHING state.");

      // Check for existing weighing record
      const existingWeighing = await tx.procurementWeighing.findUnique({
        where: { bookingId }
      });
      if (existingWeighing) throw new Error("Weighing record already exists for this booking.");

      await tx.procurementWeighing.create({
        data: {
          bookingId: booking.id,
          grossWeight,
          tareWeight,
          netWeight,
          weighedBy: user.id,
          unit: "KG"
        }
      });

      await tx.procurementBooking.update({
        where: { id: booking.id, status: "WEIGHING" },
        data: { 
          status: "WEIGHING_COMPLETED",
          weighingCompletedAt: new Date()
        }
      });

      await tx.auditLog.create({ data: { actorUserId: user.id, actorRole: "PROCUREMENT_OFFICER", action: "PROCUREMENT_WEIGHING_COMPLETED", entityType: "ProcurementBooking", entityId: booking.id, metadata: { grossWeight, tareWeight, netWeight } } });
      await notifyProcurementWeighingCompleted({
        farmerId: booking.farmerId,
        bookingId: booking.id,
        tokenNumber: booking.tokenNumber,
        netWeight,
        tx,
      });

      return { success: true };
    });
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to submit weighing." };
  }
}
