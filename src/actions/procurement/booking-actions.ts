"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { SessionUser } from "@/types/auth";
import { bookProcurementSlotSchema, BookProcurementSlotValues, ProcurementBookingSummary } from "@/types/procurement";
import { revalidatePath } from "next/cache";
import { notifyProcurementBookingCreated } from "@/lib/notifications";

function generateToken(centreCode: string, slotId: string): string {
  // A simple human-readable token: [Last 2 of Centre]-[Random 4 chars]
  const cCode = centreCode.slice(-2).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${cCode}-${random}`;
}

export async function bookProcurementSlot(data: BookProcurementSlotValues): Promise<{ success: boolean; bookingId?: string; error?: string }> {
  try {
    const session = await requireRole("FARMER");
    const user = session.user as SessionUser;

    // Validate Input
    const validatedData = bookProcurementSlotSchema.parse(data);

    return await prisma.$transaction(async (tx) => {
      // 1. Verify centre exists and is active
      const centre = await tx.procurementCentre.findUnique({
        where: { id: validatedData.centreId }
      });
      if (!centre || !centre.isActive) {
        throw new Error("Procurement centre is inactive or not found.");
      }

      // 2. Verify crop configuration
      const cropConfig = await tx.procurementCentreCrop.findUnique({
        where: { centreId_cropId: { centreId: centre.id, cropId: validatedData.cropId } },
        include: { crop: true }
      });
      if (!cropConfig || !cropConfig.isActive || !cropConfig.crop.isActive) {
        throw new Error("This crop is not currently accepted at this centre.");
      }
      if (validatedData.expectedQuantity < cropConfig.minimumQuantity || validatedData.expectedQuantity > cropConfig.maximumQuantity) {
        throw new Error(`Expected quantity must be between ${cropConfig.minimumQuantity} and ${cropConfig.maximumQuantity} quintals.`);
      }

      // 3. Verify slot (Initial basic check)
      const slot = await tx.procurementSlot.findUnique({
        where: { id: validatedData.slotId }
      });
      if (!slot || slot.centreId !== centre.id || !slot.isActive) {
        throw new Error("Selected slot is invalid or inactive.");
      }
      if (slot.bookedCount >= slot.capacity) {
        throw new Error("This slot is already full.");
      }

      // 4. Duplicate booking check (one booking per farmer per slot)
      const existingBooking = await tx.procurementBooking.findUnique({
        where: { slotId_farmerId: { slotId: slot.id, farmerId: user.id } }
      });
      if (existingBooking && existingBooking.status !== "CANCELLED") {
        throw new Error("You already have an active booking for this slot.");
      }

      // 5. ATOMIC CAPACITY CHECK & INCREMENT
      // We must do this before creating the booking to prevent race conditions.
      const updatedSlotCount = await tx.procurementSlot.updateMany({
        where: { 
          id: slot.id,
          // Atomic constraint: Ensure bookedCount is strictly less than capacity at the exact moment of update
          bookedCount: { lt: slot.capacity }
        },
        data: { bookedCount: { increment: 1 } }
      });

      if (updatedSlotCount.count === 0) {
        throw new Error("This slot just became full. Please select another slot.");
      }

      // 6. Generate token and booking number
      const bookingNumber = `BKG-${Date.now().toString().slice(-6)}`;
      const tokenNumber = generateToken(centre.code, slot.id);

      // 7. Create booking
      const newBooking = await tx.procurementBooking.create({
        data: {
          bookingNumber,
          farmerId: user.id,
          centreId: centre.id,
          cropId: cropConfig.cropId,
          slotId: slot.id,
          expectedQuantity: validatedData.expectedQuantity,
          tokenNumber,
          status: "BOOKED",
        }
      });

      // 8. Send real-time notification
      await notifyProcurementBookingCreated({
        farmerId: user.id,
        bookingId: newBooking.id,
        tokenNumber,
        cropName: cropConfig.crop.name,
        centreName: centre.name,
        slotDate: slot.date,
        tx,
      });

      return { success: true, bookingId: newBooking.id };
    });

  } catch (error: unknown) {
    console.error("Booking error:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred." };
  }
}


export async function getFarmerProcurementBookings(page = 1, limit = 25): Promise<{ bookings: ProcurementBookingSummary[], pagination: { page: number, totalPages: number } }> {
  const session = await requireRole("FARMER");
  const user = session.user as SessionUser;

  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    prisma.procurementBooking.findMany({
      where: { farmerId: user.id },
      include: {
        centre: true,
        crop: true,
        slot: true,
      },
      orderBy: { bookedAt: "desc" },
      skip,
      take: limit
    }),
    prisma.procurementBooking.count({
      where: { farmerId: user.id }
    })
  ]);

  return {
    bookings: bookings.map(b => ({
      id: b.id,
      bookingNumber: b.bookingNumber,
      tokenNumber: b.tokenNumber,
      centreName: b.centre.name,
      cropName: b.crop.name,
      slotDate: b.slot.date.toISOString(),
      slotStartTime: b.slot.startTime,
      slotEndTime: b.slot.endTime,
      expectedQuantity: Number(b.expectedQuantity),
      status: b.status,
      bookedAt: b.bookedAt.toISOString(),
    })),
    pagination: {
      page,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getBookingDetail(bookingId: string) {
  const session = await requireRole("FARMER");
  const user = session.user as SessionUser;

  const booking = await prisma.procurementBooking.findFirst({
    where: { id: bookingId, farmerId: user.id },
    include: {
      centre: true,
      crop: true,
      slot: true,
      weighing: true,
      qualityInspection: true,
      payment: true,
    }
  });

  if (!booking) return null;

  let queuePosition = null;
  if (booking.status === "WAITING" && booking.arrivedAt) {
    const aheadCount = await prisma.procurementBooking.count({
      where: {
        centreId: booking.centreId,
        status: "WAITING",
        arrivedAt: {
          lt: booking.arrivedAt
        }
      }
    });
    // If aheadCount is 0, they are next (position 1)
    queuePosition = aheadCount + 1;
  }

  
  // Safe Decimal Serialization
  const serializedWeighing = booking.weighing ? {
    ...booking.weighing,
    grossWeight: Number(booking.weighing.grossWeight),
    tareWeight: Number(booking.weighing.tareWeight),
    netWeight: Number(booking.weighing.netWeight),
  } : null;

  const serializedQuality = booking.qualityInspection ? {
    ...booking.qualityInspection,
    moisturePercentage: Number(booking.qualityInspection.moisturePercentage),
    acceptedQuantity: Number(booking.qualityInspection.acceptedQuantity),
    rejectedQuantity: Number(booking.qualityInspection.rejectedQuantity),
  } : null;

  const serializedPayment = booking.payment ? {
    ...booking.payment,
    eligibleQuantityKg: Number(booking.payment.eligibleQuantityKg),
    pricePerKg: Number(booking.payment.pricePerKg),
    grossAmount: Number(booking.payment.grossAmount),
    deductionAmount: Number(booking.payment.deductionAmount),
    netPayableAmount: Number(booking.payment.netPayableAmount),
  } : null;

  return { 
    ...booking, 
    expectedQuantity: Number(booking.expectedQuantity),
    weighing: serializedWeighing,
    qualityInspection: serializedQuality,
    payment: serializedPayment,
    queuePosition 
  };

}

export async function cancelBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireRole("FARMER");
    const user = session.user as SessionUser;

    return await prisma.$transaction(async (tx) => {
      const booking = await tx.procurementBooking.findUnique({
        where: { id: bookingId }
      });
      if (!booking || booking.farmerId !== user.id) {
        throw new Error("Booking not found or unauthorized.");
      }
      if (booking.status !== "BOOKED") {
        throw new Error("Only bookings in BOOKED state can be cancelled.");
      }

      await tx.procurementBooking.update({
        where: { id: booking.id },
        data: { status: "CANCELLED", cancelledAt: new Date() }
      });

      // Restore capacity
      await tx.procurementSlot.update({
        where: { id: booking.slotId },
        data: { bookedCount: { decrement: 1 } }
      });

      return { success: true };
    });
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to cancel booking." };
  }
}
