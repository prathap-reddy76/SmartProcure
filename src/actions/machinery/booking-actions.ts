"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { RentalMode, RentalBookingStatus, Prisma } from "@prisma/client";
import {
  notifyMachineryBookingCreated,
  notifyMachineryBookingApproved,
  notifyMachineryBookingRejected,
  notifyMachineryBookingReady,
  notifyMachineryBookingActive,
  notifyMachineryBookingCompleted,
  notifyMachineryBookingCancelled,
} from "@/lib/notifications";

// -------------------------------------------------------------
// Validation Schemas
// -------------------------------------------------------------

const createBookingSchema = z.object({
  machineryId: z.string().min(1, "Machinery ID is required"),
  rentalMode: z.enum(["HOURLY", "DAILY", "PER_ACRE"]),
  startDateTime: z.string().datetime({ message: "Invalid start date and time" }),
  endDateTime: z.string().datetime({ message: "Invalid end date and time" }),
  quantity: z.number().positive().optional().default(1),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateBookingInput = z.input<typeof createBookingSchema>;

function generateBookingNumber(): string {
  const timePart = Date.now().toString(36).toUpperCase();
  const randPart = Math.floor(100 + Math.random() * 900);
  return `MCH-${timePart}-${randPart}`;
}

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Non-request environment fallback
  }
}

import { requireAnyRole } from "@/lib/auth-utils";

async function getEffectiveUserId(testUserId?: string): Promise<string | null> {
  if (process.env.NODE_ENV === "test" && testUserId) {
    return testUserId;
  }
  try {
    const session = await auth();
    return session?.user?.id || null;
  } catch { return null; }
}

// -------------------------------------------------------------
// Server Actions
// -------------------------------------------------------------

/**
 * Creates a rental booking with server-side price recalculation and concurrency locking.
 */
export async function createRentalBooking(rawInput: CreateBookingInput, testUserId?: string) {
  try {
    const userId = await getEffectiveUserId(testUserId);
    if (!userId) {
      return { success: false, error: "Authentication required to book machinery" };
    }

    const farmerId = userId;

    const parsed = createBookingSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid booking details",
      };
    }

    const input = parsed.data;
    const start = new Date(input.startDateTime);
    const end = new Date(input.endDateTime);

    if (end <= start) {
      return { success: false, error: "Rental end time must be after start time" };
    }

    // Grace period of 5 minutes for clock drift
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (start < fiveMinutesAgo) {
      return { success: false, error: "Booking start time cannot be in the past" };
    }

    // Execute in a Prisma transaction for safe concurrency and conflict checking
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch current machinery pricing and availability from database
      const machine = await tx.machinery.findUnique({
        where: { id: input.machineryId },
        include: { owner: { select: { id: true, name: true } } },
      });

      if (!machine || !machine.isActive) {
        throw new Error("Machinery listing is no longer available");
      }

      if (!machine.isApproved) {
        throw new Error("This machinery has not yet been approved for public rentals");
      }

      if (!machine.isAvailable) {
        throw new Error("Machinery is currently marked unavailable by the owner");
      }

      if (machine.ownerId === farmerId) {
        throw new Error("You cannot book your own machinery");
      }

      // 2. Validate supported rental mode and unit price
      let unitPrice: Prisma.Decimal;
      let calculatedQuantity: number;

      if (input.rentalMode === "HOURLY") {
        if (!machine.supportsHourly || !machine.pricePerHour) {
          throw new Error("Hourly rental mode is not supported by this machinery");
        }
        unitPrice = machine.pricePerHour;
        const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        calculatedQuantity = Math.max(1, Math.ceil(diffHours));
      } else if (input.rentalMode === "DAILY") {
        if (!machine.supportsDaily || !machine.pricePerDay) {
          throw new Error("Daily rental mode is not supported by this machinery");
        }
        unitPrice = machine.pricePerDay;
        const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        calculatedQuantity = Math.max(1, Math.ceil(diffDays));
      } else if (input.rentalMode === "PER_ACRE") {
        if (!machine.supportsPerAcre || !machine.pricePerAcre) {
          throw new Error("Per-acre rental mode is not supported by this machinery");
        }
        unitPrice = machine.pricePerAcre;
        calculatedQuantity = Math.max(1, Number(input.quantity));
      } else {
        throw new Error("Invalid rental mode specified");
      }

      // 3. Strict concurrency safety: check overlapping active bookings
      const conflict = await tx.machineryBooking.findFirst({
        where: {
          machineryId: machine.id,
          status: {
            in: [
              "PENDING",
              "OWNER_APPROVED",
              "CONFIRMED",
              "READY",
              "ACTIVE",
            ],
          },
          startDateTime: { lt: end },
          endDateTime: { gt: start },
        },
      });

      if (conflict) {
        throw new Error(
          "Machinery is already booked or reserved for the selected time window. Please choose another date or time."
        );
      }

      // 4. Calculate authoritative server-side monetary values
      const baseAmount = unitPrice.mul(new Prisma.Decimal(calculatedQuantity));
      const deliveryCharge = machine.deliveryCharge;
      const securityDeposit = machine.securityDeposit;
      const totalAmount = baseAmount.add(deliveryCharge).add(securityDeposit);
      const bookingNumber = generateBookingNumber();

      // 5. Create booking record
      const booking = await tx.machineryBooking.create({
        data: {
          bookingNumber,
          machineryId: machine.id,
          farmerId,
          ownerId: machine.ownerId,
          startDateTime: start,
          endDateTime: end,
          rentalMode: input.rentalMode as RentalMode,
          quantity: new Prisma.Decimal(calculatedQuantity),
          unitPrice,
          baseAmount,
          deliveryCharge,
          securityDeposit,
          totalAmount,
          status: "PENDING",
          paymentStatus: "PENDING",
          deliveryAddress: input.deliveryAddress || null,
          notes: input.notes || null,
        },
      });

      // 6. Dispatch real-time notifications
      await notifyMachineryBookingCreated({
        farmerId,
        ownerId: machine.ownerId,
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        machineName: machine.name,
        totalAmount: totalAmount.toNumber(),
        tx,
      });

      return { booking, machineName: machine.name };
    });

    safeRevalidate("/farmer/machinery/bookings");
    safeRevalidate("/machinery/bookings");

    return {
      success: true,
      bookingId: result.booking.id,
      bookingNumber: result.booking.bookingNumber,
    };
  } catch (error: any) {
    console.error("Error creating rental booking:", error);
    return {
      success: false,
      error: error.message || "Failed to submit booking request",
    };
  }
}

/**
 * Machinery Owner: approves a pending rental request with race-condition verification.
 */
export async function approveRentalBooking(bookingId: string, ownerNotes?: string, testUserId?: string) {
  try {
    const userId = await getEffectiveUserId(testUserId);
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.machineryBooking.findUnique({
        where: { id: bookingId },
        include: { machinery: { select: { id: true, name: true, ownerId: true } } },
      });

      if (!booking) {
        throw new Error("Booking request not found");
      }

      if (booking.ownerId !== userId) {
        throw new Error("Forbidden: You do not own the machinery for this booking");
      }

      if (booking.status !== "PENDING") {
        throw new Error(`Cannot approve booking in '${booking.status}' status`);
      }

      // Re-verify that no conflicting booking became confirmed in the meantime
      const conflict = await tx.machineryBooking.findFirst({
        where: {
          id: { not: booking.id },
          machineryId: booking.machineryId,
          status: { in: ["OWNER_APPROVED", "CONFIRMED", "READY", "ACTIVE"] },
          startDateTime: { lt: booking.endDateTime },
          endDateTime: { gt: booking.startDateTime },
        },
      });

      if (conflict) {
        throw new Error(
          "Approval rejected: Another confirmed booking already occupies this time window."
        );
      }

      const updated = await tx.machineryBooking.update({
        where: { id: bookingId },
        data: {
          status: "OWNER_APPROVED",
          ownerNotes: ownerNotes || booking.ownerNotes,
        },
      });

      await notifyMachineryBookingApproved({
        farmerId: booking.farmerId,
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        machineName: booking.machinery.name,
        tx,
      });

      return updated;
    });

    safeRevalidate("/machinery/bookings");
    safeRevalidate(`/farmer/machinery/bookings/${bookingId}`);

    return { success: true, status: result.status };
  } catch (error: any) {
    console.error("Error approving rental booking:", error);
    return { success: false, error: error.message || "Failed to approve booking" };
  }
}

/**
 * Machinery Owner: rejects a pending rental request.
 */
export async function rejectRentalBooking(bookingId: string, reason?: string, testUserId?: string) {
  try {
    const userId = await getEffectiveUserId(testUserId);
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const booking = await prisma.machineryBooking.findUnique({
      where: { id: bookingId },
      include: { machinery: { select: { name: true } } },
    });

    if (!booking) {
      return { success: false, error: "Booking request not found" };
    }

    if (booking.ownerId !== userId) {
      return { success: false, error: "Forbidden: You do not own this machinery" };
    }

    if (booking.status !== "PENDING") {
      return { success: false, error: `Cannot reject booking in '${booking.status}' status` };
    }

    const updated = await prisma.machineryBooking.update({
      where: { id: bookingId },
      data: {
        status: "OWNER_REJECTED",
        cancellationReason: reason || "Declined by owner",
      },
    });

    await notifyMachineryBookingRejected({
      farmerId: booking.farmerId,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      machineName: booking.machinery.name,
      reason,
    });

    safeRevalidate("/machinery/bookings");
    safeRevalidate(`/farmer/machinery/bookings/${bookingId}`);

    return { success: true, status: updated.status };
  } catch (error: any) {
    console.error("Error rejecting rental booking:", error);
    return { success: false, error: error.message || "Failed to reject booking" };
  }
}

/**
 * Mark booking as confirmed
 */
export async function confirmRentalBooking(bookingId: string, testUserId?: string) {
  try {
    const userId = await getEffectiveUserId(testUserId);
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const booking = await prisma.machineryBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    if (booking.farmerId !== userId && booking.ownerId !== userId) {
      return { success: false, error: "Forbidden" };
    }

    if (booking.status !== "OWNER_APPROVED") {
      return { success: false, error: `Cannot confirm booking in '${booking.status}' status` };
    }

    const updated = await prisma.machineryBooking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED" },
    });

    safeRevalidate("/machinery/bookings");
    safeRevalidate(`/farmer/machinery/bookings/${bookingId}`);

    return { success: true, status: updated.status };
  } catch (error: any) {
    console.error("Error confirming rental booking:", error);
    return { success: false, error: error.message || "Failed to confirm booking" };
  }
}

/**
 * Owner: marks machinery READY for pickup or delivery dispatch.
 */
export async function markRentalReady(bookingId: string, testUserId?: string) {
  try {
    const userId = await getEffectiveUserId(testUserId);
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const booking = await prisma.machineryBooking.findUnique({
      where: { id: bookingId },
      include: { machinery: { select: { name: true } } },
    });

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    if (booking.ownerId !== userId) {
      return { success: false, error: "Forbidden: Only owner can mark machine ready" };
    }

    if (booking.status !== "CONFIRMED" && booking.status !== "OWNER_APPROVED") {
      return { success: false, error: `Cannot mark ready from '${booking.status}' status` };
    }

    const updated = await prisma.machineryBooking.update({
      where: { id: bookingId },
      data: { status: "READY" },
    });

    await notifyMachineryBookingReady({
      farmerId: booking.farmerId,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      machineName: booking.machinery.name,
    });

    safeRevalidate("/machinery/bookings");
    safeRevalidate(`/farmer/machinery/bookings/${bookingId}`);

    return { success: true, status: updated.status };
  } catch (error: any) {
    console.error("Error marking rental ready:", error);
    return { success: false, error: error.message || "Failed to mark ready" };
  }
}

/**
 * Owner: marks rental period ACTIVE.
 */
export async function startRental(bookingId: string, testUserId?: string) {
  try {
    const userId = await getEffectiveUserId(testUserId);
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const booking = await prisma.machineryBooking.findUnique({
      where: { id: bookingId },
      include: { machinery: { select: { name: true } } },
    });

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    if (booking.ownerId !== userId) {
      return { success: false, error: "Forbidden: Only owner can activate rental" };
    }

    if (booking.status !== "READY" && booking.status !== "CONFIRMED" && booking.status !== "OWNER_APPROVED") {
      return { success: false, error: `Cannot start rental from '${booking.status}' status` };
    }

    const updated = await prisma.machineryBooking.update({
      where: { id: bookingId },
      data: { status: "ACTIVE" },
    });

    await notifyMachineryBookingActive({
      farmerId: booking.farmerId,
      ownerId: booking.ownerId,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      machineName: booking.machinery.name,
    });

    safeRevalidate("/machinery/bookings");
    safeRevalidate(`/farmer/machinery/bookings/${bookingId}`);

    return { success: true, status: updated.status };
  } catch (error: any) {
    console.error("Error starting rental:", error);
    return { success: false, error: error.message || "Failed to start rental" };
  }
}

/**
 * Owner: marks rental COMPLETED upon equipment return and inspection.
 */
export async function completeRental(bookingId: string, testUserId?: string) {
  try {
    const userId = await getEffectiveUserId(testUserId);
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const booking = await prisma.machineryBooking.findUnique({
      where: { id: bookingId },
      include: { machinery: { select: { name: true } } },
    });

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    if (booking.ownerId !== userId) {
      return { success: false, error: "Forbidden: Only owner can complete rental" };
    }

    if (booking.status !== "ACTIVE") {
      return { success: false, error: `Cannot complete rental from '${booking.status}' status` };
    }

    const updated = await prisma.machineryBooking.update({
      where: { id: bookingId },
      data: {
        status: "COMPLETED",
        paymentStatus: "PAID",
      },
    });

    await notifyMachineryBookingCompleted({
      farmerId: booking.farmerId,
      ownerId: booking.ownerId,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      machineName: booking.machinery.name,
    });

    safeRevalidate("/machinery/bookings");
    safeRevalidate(`/farmer/machinery/bookings/${bookingId}`);

    return { success: true, status: updated.status };
  } catch (error: any) {
    console.error("Error completing rental:", error);
    return { success: false, error: error.message || "Failed to complete rental" };
  }
}

/**
 * Cancel a rental booking with server-side authorization and status checks.
 */
export async function cancelRentalBooking(bookingId: string, reason?: string, testUserId?: string) {
  try {
    const userId = await getEffectiveUserId(testUserId);
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    const booking = await prisma.machineryBooking.findUnique({
      where: { id: bookingId },
      include: { machinery: { select: { name: true } } },
    });

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    const isFarmer = booking.farmerId === userId;
    const isOwner = booking.ownerId === userId;
    const isAdmin = user?.role === "ADMIN";

    if (!isFarmer && !isOwner && !isAdmin) {
      return { success: false, error: "Forbidden: You are not authorized to cancel this booking" };
    }

    // Cancellation restrictions
    if (booking.status === "COMPLETED") {
      return { success: false, error: "Completed rentals cannot be cancelled" };
    }

    if (booking.status === "CANCELLED" || booking.status === "OWNER_REJECTED") {
      return { success: false, error: "Booking is already cancelled or rejected" };
    }

    // Farmers cannot cancel active rentals
    if (isFarmer && booking.status === "ACTIVE") {
      return {
        success: false,
        error: "Active rentals cannot be cancelled directly. Please contact the machinery owner.",
      };
    }

    const cancelledBy = isFarmer ? "FARMER" : isOwner ? "OWNER" : "ADMIN";

    const updated = await prisma.machineryBooking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancellationReason: reason || `Cancelled by ${cancelledBy.toLowerCase()}`,
        cancelledAt: new Date(),
      },
    });

    await notifyMachineryBookingCancelled({
      farmerId: booking.farmerId,
      ownerId: booking.ownerId,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      machineName: booking.machinery.name,
      cancelledBy,
    });

    safeRevalidate("/machinery/bookings");
    safeRevalidate("/farmer/machinery/bookings");
    safeRevalidate(`/farmer/machinery/bookings/${bookingId}`);

    return { success: true, status: updated.status };
  } catch (error: any) {
    console.error("Error cancelling rental booking:", error);
    return { success: false, error: error.message || "Failed to cancel booking" };
  }
}

/**
 * Get farmer's own machinery bookings.
 */
export async function getFarmerRentalBookings(filterStatus?: RentalBookingStatus, testUserId?: string) {
  try {
    const userId = await getEffectiveUserId(testUserId);
    if (!userId) {
      return { success: false, bookings: [], error: "Unauthorized" };
    }

    const where: any = { farmerId: userId };
    if (filterStatus) {
      where.status = filterStatus;
    }

    const bookings = await prisma.machineryBooking.findMany({
      where,
      include: {
        machinery: {
          include: {
            category: true,
            images: { take: 1 },
          },
        },
        owner: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      bookings: bookings.map((b) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        status: b.status,
        paymentStatus: b.paymentStatus,
        paymentMethod: b.paymentMethod,
        startDateTime: b.startDateTime.toISOString(),
        endDateTime: b.endDateTime.toISOString(),
        rentalMode: b.rentalMode,
        quantity: b.quantity.toNumber(),
        unitPrice: b.unitPrice.toNumber(),
        baseAmount: b.baseAmount.toNumber(),
        deliveryCharge: b.deliveryCharge.toNumber(),
        securityDeposit: b.securityDeposit.toNumber(),
        totalAmount: b.totalAmount.toNumber(),
        deliveryAddress: b.deliveryAddress,
        notes: b.notes,
        ownerNotes: b.ownerNotes,
        cancellationReason: b.cancellationReason,
        createdAt: b.createdAt.toISOString(),
        machinery: {
          id: b.machinery.id,
          name: b.machinery.name,
          brand: b.machinery.brand,
          modelNumber: b.machinery.modelNumber,
          categoryName: b.machinery.category.name,
          location: b.machinery.location,
          image: b.machinery.images[0]?.url || null,
        },
        owner: {
          name: b.owner.name || "Equipment Owner",
          phone: b.owner.phone,
        },
      })),
    };
  } catch (error) {
    console.error("Error fetching farmer rental bookings:", error);
    return { success: false, bookings: [], error: "Failed to load bookings" };
  }
}

/**
 * Get owner's incoming machinery bookings.
 */
export async function getOwnerRentalBookings(filterStatus?: RentalBookingStatus, testUserId?: string) {
  try {
    const userId = await getEffectiveUserId(testUserId);
    if (!userId) {
      return { success: false, bookings: [], error: "Unauthorized" };
    }

    const where: any = { ownerId: userId };
    if (filterStatus) {
      where.status = filterStatus;
    }

    const bookings = await prisma.machineryBooking.findMany({
      where,
      include: {
        machinery: {
          include: {
            category: true,
            images: { take: 1 },
          },
        },
        farmer: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      bookings: bookings.map((b) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        status: b.status,
        paymentStatus: b.paymentStatus,
        paymentMethod: b.paymentMethod,
        startDateTime: b.startDateTime.toISOString(),
        endDateTime: b.endDateTime.toISOString(),
        rentalMode: b.rentalMode,
        quantity: b.quantity.toNumber(),
        unitPrice: b.unitPrice.toNumber(),
        baseAmount: b.baseAmount.toNumber(),
        deliveryCharge: b.deliveryCharge.toNumber(),
        securityDeposit: b.securityDeposit.toNumber(),
        totalAmount: b.totalAmount.toNumber(),
        deliveryAddress: b.deliveryAddress,
        notes: b.notes,
        ownerNotes: b.ownerNotes,
        cancellationReason: b.cancellationReason,
        createdAt: b.createdAt.toISOString(),
        machinery: {
          id: b.machinery.id,
          name: b.machinery.name,
          categoryName: b.machinery.category.name,
          image: b.machinery.images[0]?.url || null,
        },
        farmer: {
          name: b.farmer.name || "Farmer",
          phone: b.farmer.phone,
        },
      })),
    };
  } catch (error) {
    console.error("Error fetching owner rental bookings:", error);
    return { success: false, bookings: [], error: "Failed to load bookings" };
  }
}

/**
 * Get a specific rental booking by ID with ownership authorization check.
 */
export async function getRentalBookingById(bookingId: string, testUserId?: string) {
  try {
    const userId = await getEffectiveUserId(testUserId);
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const booking = await prisma.machineryBooking.findUnique({
      where: { id: bookingId },
      include: {
        machinery: {
          include: {
            category: true,
            images: true,
          },
        },
        farmer: { select: { id: true, name: true, phone: true, email: true } },
        owner: { select: { id: true, name: true, phone: true, email: true } },
        deliveryAssignments: {
          include: {
            deliveryPartner: {
              include: {
                user: { select: { name: true, phone: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    const isFarmer = booking.farmerId === userId;
    const isOwner = booking.ownerId === userId;

    if (!isFarmer && !isOwner) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (user?.role !== "ADMIN") {
        return { success: false, error: "Forbidden: You are not authorized to view this booking" };
      }
    }

    return {
      success: true,
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        startDateTime: booking.startDateTime.toISOString(),
        endDateTime: booking.endDateTime.toISOString(),
        rentalMode: booking.rentalMode,
        quantity: booking.quantity.toNumber(),
        unitPrice: booking.unitPrice.toNumber(),
        baseAmount: booking.baseAmount.toNumber(),
        deliveryCharge: booking.deliveryCharge.toNumber(),
        securityDeposit: booking.securityDeposit.toNumber(),
        totalAmount: booking.totalAmount.toNumber(),
        deliveryAddress: booking.deliveryAddress,
        notes: booking.notes,
        ownerNotes: booking.ownerNotes,
        cancellationReason: booking.cancellationReason,
        createdAt: booking.createdAt.toISOString(),
        machinery: {
          id: booking.machinery.id,
          name: booking.machinery.name,
          brand: booking.machinery.brand,
          modelNumber: booking.machinery.modelNumber,
          categoryName: booking.machinery.category.name,
          location: booking.machinery.location,
          address: booking.machinery.address,
          latitude: booking.machinery.latitude,
          longitude: booking.machinery.longitude,
          images: booking.machinery.images.map((img) => img.url),
        },
        farmer: {
          id: booking.farmer.id,
          name: booking.farmer.name || "Farmer",
          phone: booking.farmer.phone,
        },
        owner: {
          id: booking.owner.id,
          name: booking.owner.name || "Equipment Owner",
          phone: booking.owner.phone,
        },
        deliveryAssignments: booking.deliveryAssignments.map((a) => ({
          id: a.id,
          deliveryType: a.deliveryType,
          status: a.status,
          deliveryWindow: a.deliveryWindow,
          deliveryCode: a.deliveryCode,
          partnerName: a.deliveryPartner?.user.name || null,
          partnerPhone: a.deliveryPartner?.phone || a.deliveryPartner?.user.phone || null,
          assignedAt: a.assignedAt?.toISOString() || null,
          pickedUpAt: a.pickedUpAt?.toISOString() || null,
          outForDeliveryAt: a.outForDeliveryAt?.toISOString() || null,
          deliveredAt: a.deliveredAt?.toISOString() || null,
          deliveryExceptionReason: a.deliveryExceptionReason,
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching rental booking by ID:", error);
    return { success: false, error: "Failed to load booking details" };
  }
}
