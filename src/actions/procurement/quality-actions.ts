"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { SessionUser } from "@/types/auth";
import { revalidatePath } from "next/cache";
import { notifyProcurementQualityCompleted } from "@/lib/notifications";

export async function startQualityInspection(bookingId: string) {
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
      if (booking.status !== "WEIGHING_COMPLETED") throw new Error("Booking must be WEIGHING_COMPLETED to start quality inspection.");

      const weighing = await tx.procurementWeighing.findUnique({
        where: { bookingId }
      });
      if (!weighing) throw new Error("Weighing record must exist before quality inspection.");

      await tx.procurementBooking.update({ where: { id: bookingId, status: "WEIGHING_COMPLETED" }, data: { status: "QUALITY_INSPECTION", qualityStartedAt: new Date() } });
      await tx.auditLog.create({ data: { actorUserId: user.id, actorRole: "PROCUREMENT_OFFICER", action: "PROCUREMENT_INSPECTION_STARTED", entityType: "ProcurementBooking", entityId: bookingId, metadata: {} } });

      return { success: true };
    });
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to start quality inspection." };
  }
}

export async function completeQualityInspection(
  bookingId: string, 
  moisturePercentage: number,
  grade: string,
  acceptedQuantity: number,
  rejectedQuantity: number,
  rejectionReason: string,
  notes: string
) {
  const session = await requireRole("PROCUREMENT_OFFICER");
  const user = session.user as SessionUser;

  const officer = await prisma.user.findUnique({
    where: { id: user.id },
    select: { procurementCentreId: true }
  });

  if (!officer?.procurementCentreId) {
    return { success: false, error: "No procurement centre assigned to your profile." };
  }

  if (moisturePercentage < 0 || moisturePercentage > 100) return { success: false, error: "Moisture must be between 0 and 100." };
  if (acceptedQuantity < 0) return { success: false, error: "Accepted quantity cannot be negative." };
  if (rejectedQuantity < 0) return { success: false, error: "Rejected quantity cannot be negative." };
  if (rejectedQuantity > 0 && !rejectionReason?.trim()) return { success: false, error: "Rejection reason is required when rejected quantity is greater than 0." };
  if (!grade?.trim()) return { success: false, error: "Grade is required." };

  try {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.procurementBooking.findUnique({
        where: { id: bookingId },
        include: { crop: true },
      });

      if (!booking) throw new Error("Booking not found.");
      if (booking.centreId !== officer.procurementCentreId) throw new Error("Unauthorized.");
      if (booking.status !== "QUALITY_INSPECTION") throw new Error("Booking is not in QUALITY_INSPECTION state.");

      const weighing = await tx.procurementWeighing.findUnique({
        where: { bookingId }
      });
      if (!weighing) throw new Error("No weighing record found.");

      const netWeight = Number(weighing.netWeight);
      const totalInspected = acceptedQuantity + rejectedQuantity;

      // Ensure precision checks don't fail us on strict equality if JS floats behave weirdly, but since we parsed to decimals it should be close enough
      if (Math.abs(totalInspected - netWeight) > 0.01) {
        throw new Error(`Total inspected quantity (${totalInspected}) must equal net weight (${netWeight}).`);
      }

      // Determine Quality Status
      let qualityStatus: import("@prisma/client").QualityStatus = "PASSED";
      let bookingStatus: "ACCEPTED" | "PARTIALLY_ACCEPTED" | "REJECTED" = "ACCEPTED";

      if (acceptedQuantity === netWeight && rejectedQuantity === 0) {
        qualityStatus = "PASSED";
        bookingStatus = "ACCEPTED";
      } else if (acceptedQuantity > 0 && rejectedQuantity > 0) {
        qualityStatus = "PARTIALLY_ACCEPTED";
        bookingStatus = "PARTIALLY_ACCEPTED";
      } else if (acceptedQuantity === 0 && rejectedQuantity === netWeight) {
        qualityStatus = "REJECTED";
        bookingStatus = "REJECTED";
      } else {
        throw new Error("Invalid quantity distribution.");
      }

      const existingInspection = await tx.procurementQualityInspection.findUnique({
        where: { bookingId }
      });
      if (existingInspection) throw new Error("Quality inspection already exists for this booking.");

      await tx.procurementQualityInspection.create({
        data: {
          bookingId,
          inspectedBy: user.id,
          moisturePercentage,
          grade,
          qualityStatus,
          acceptedQuantity,
          rejectedQuantity,
          rejectionReason: rejectedQuantity > 0 ? rejectionReason : null,
          notes
        }
      });

      await tx.procurementBooking.update({
        where: { id: bookingId, status: "QUALITY_INSPECTION" },
        data: { 
          status: bookingStatus,
          qualityCompletedAt: new Date()
        }
      });

      await tx.auditLog.create({ data: { actorUserId: user.id, actorRole: "PROCUREMENT_OFFICER", action: "PROCUREMENT_INSPECTION_COMPLETED", entityType: "ProcurementBooking", entityId: booking.id, metadata: { qualityStatus, acceptedQuantity, rejectedQuantity, grade } } });
      await notifyProcurementQualityCompleted({
        farmerId: booking.farmerId,
        bookingId: booking.id,
        tokenNumber: booking.tokenNumber,
        cropName: booking.crop.name,
        qualityStatus,
        acceptedQuantity,
        rejectedQuantity,
        tx,
      });

      return { success: true };
    });
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to complete quality inspection." };
  }
}
