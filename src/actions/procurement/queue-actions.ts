"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { SessionUser } from "@/types/auth";
import { revalidatePath } from "next/cache";
import { notifyProcurementArrival } from "@/lib/notifications";

export async function findBookingByToken(tokenNumber: string, bookingNumber: string) {
  const session = await requireRole("PROCUREMENT_OFFICER");
  const user = session.user as SessionUser;

  const officer = await prisma.user.findUnique({
    where: { id: user.id },
    select: { procurementCentreId: true }
  });

  if (!officer?.procurementCentreId) {
    throw new Error("No procurement centre assigned to your profile.");
  }

  const booking = await prisma.procurementBooking.findFirst({
    where: {
      centreId: officer.procurementCentreId,
      OR: [
        { tokenNumber: { equals: tokenNumber, mode: 'insensitive' } },
        { bookingNumber: { equals: bookingNumber, mode: 'insensitive' } }
      ]
    },
    include: {
      farmer: true,
      crop: true,
      slot: true,
    }
  });

  if (!booking) return null;

  return {
    id: booking.id,
    bookingNumber: booking.bookingNumber,
    farmerId: booking.farmerId,
    centreId: booking.centreId,
    cropId: booking.cropId,
    slotId: booking.slotId,
    expectedQuantity: booking.expectedQuantity ? booking.expectedQuantity.toString() : "0",
    tokenNumber: booking.tokenNumber,
    status: booking.status,
    bookedAt: booking.bookedAt ? booking.bookedAt.toISOString() : null,
    arrivedAt: booking.arrivedAt ? booking.arrivedAt.toISOString() : null,
    weighingStartedAt: booking.weighingStartedAt ? booking.weighingStartedAt.toISOString() : null,
    weighingCompletedAt: booking.weighingCompletedAt ? booking.weighingCompletedAt.toISOString() : null,
    qualityStartedAt: booking.qualityStartedAt ? booking.qualityStartedAt.toISOString() : null,
    qualityCompletedAt: booking.qualityCompletedAt ? booking.qualityCompletedAt.toISOString() : null,
    completedAt: booking.completedAt ? booking.completedAt.toISOString() : null,
    cancelledAt: booking.cancelledAt ? booking.cancelledAt.toISOString() : null,
    createdAt: booking.createdAt ? booking.createdAt.toISOString() : null,
    updatedAt: booking.updatedAt ? booking.updatedAt.toISOString() : null,
    farmer: booking.farmer ? {
      id: booking.farmer.id,
      name: booking.farmer.name,
      email: booking.farmer.email,
      phone: booking.farmer.phone,
      role: booking.farmer.role,
      isActive: booking.farmer.isActive,
      createdAt: booking.farmer.createdAt ? booking.farmer.createdAt.toISOString() : null,
      updatedAt: booking.farmer.updatedAt ? booking.farmer.updatedAt.toISOString() : null,
    } : null,
    crop: booking.crop ? {
      id: booking.crop.id,
      name: booking.crop.name,
      nameTe: booking.crop.nameTe,
      description: booking.crop.description,
      isActive: booking.crop.isActive,
      createdAt: booking.crop.createdAt ? booking.crop.createdAt.toISOString() : null,
      updatedAt: booking.crop.updatedAt ? booking.crop.updatedAt.toISOString() : null,
    } : null,
    slot: booking.slot ? {
      id: booking.slot.id,
      centreId: booking.slot.centreId,
      date: booking.slot.date ? booking.slot.date.toISOString() : null,
      startTime: booking.slot.startTime,
      endTime: booking.slot.endTime,
      capacity: booking.slot.capacity,
      bookedCount: booking.slot.bookedCount,
      isActive: booking.slot.isActive,
      createdAt: booking.slot.createdAt ? booking.slot.createdAt.toISOString() : null,
      updatedAt: booking.slot.updatedAt ? booking.slot.updatedAt.toISOString() : null,
    } : null,
  };
}

export async function registerArrival(bookingId: string) {
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

      if (!booking || booking.centreId !== officer.procurementCentreId) {
        throw new Error("Booking not found or not authorized for this centre.");
      }

      if (booking.status !== "BOOKED") {
        throw new Error("Farmer has already arrived or booking is cancelled.");
      }

      const updatedCount = await tx.procurementBooking.updateMany({
        where: { 
          id: bookingId,
          status: "BOOKED" 
        },
        data: {
          status: "WAITING",
          arrivedAt: new Date()
        }
      });

      if (updatedCount.count === 0) {
        throw new Error("Concurrent modification detected. Arrival was already registered.");
      }

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          actorRole: "PROCUREMENT_OFFICER",
          action: "PROCUREMENT_ARRIVAL_REGISTERED",
          entityType: "ProcurementBooking",
          entityId: bookingId,
          metadata: {}
        }
      });

      await notifyProcurementArrival({
        farmerId: booking.farmerId,
        bookingId: booking.id,
        tokenNumber: booking.tokenNumber,
        centreName: "Procurement Centre",
      });

      revalidatePath("/procurement-officer/queue");
      revalidatePath("/procurement-officer/dashboard");
      return { success: true };
    });
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to register arrival." };
  }
}

export async function callNextBooking() {
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
      // Find the first WAITING booking for this centre, ordered by arrivedAt
      const nextBooking = await tx.procurementBooking.findFirst({
        where: {
          centreId: officer.procurementCentreId as string,
          status: "WAITING",
        },
        orderBy: {
          arrivedAt: 'asc'
        }
      });

      if (!nextBooking) {
        throw new Error("No farmers are currently waiting in the queue.");
      }

      // Update to IN_PROGRESS atomically
      const updatedCount = await tx.procurementBooking.updateMany({
        where: { 
          id: nextBooking.id,
          status: "WAITING" 
        },
        data: {
          status: "IN_PROGRESS"
        }
      });

      if (updatedCount.count === 0) {
        throw new Error("Failed to call next token. It may have been called by another officer.");
      }

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          actorRole: "PROCUREMENT_OFFICER",
          action: "PROCUREMENT_TOKEN_CALLED",
          entityType: "ProcurementBooking",
          entityId: nextBooking.id,
          metadata: {}
        }
      });

      

      revalidatePath("/procurement-officer/queue");
      return { success: true, bookingId: nextBooking.id, tokenNumber: nextBooking.tokenNumber };
    });
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to call next token. It may have been called by another officer." };
  }
}
