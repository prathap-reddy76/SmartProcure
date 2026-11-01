"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { SessionUser } from "@/types/auth";
import {
  notifyProcurementPaymentCreated,
  notifyProcurementPaymentPaid,
  notifyProcurementPaymentFailed,
} from "@/lib/notifications";

export async function createProcurementPayment(bookingId: string) {
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
        where: { id: bookingId },
        include: { qualityInspection: true }
      });

      if (!booking) throw new Error("Booking not found.");
      if (booking.centreId !== officer.procurementCentreId) throw new Error("Unauthorized access to this booking.");
      if (booking.status !== "ACCEPTED" && booking.status !== "PARTIALLY_ACCEPTED") {
        throw new Error("Booking must be ACCEPTED or PARTIALLY_ACCEPTED to create a payment.");
      }
      if (!booking.qualityInspection) throw new Error("Quality inspection is missing.");

      // Verify no existing payment
      const existingPayment = await tx.procurementPayment.findUnique({
        where: { bookingId }
      });
      if (existingPayment) throw new Error("Payment record already exists for this booking.");

      const acceptedQuantity = Number(booking.qualityInspection.acceptedQuantity);
      if (acceptedQuantity <= 0) throw new Error("No accepted quantity to pay for.");

      // Find active price for Crop and Centre
      const price = await tx.procurementPrice.findFirst({
        where: {
          cropId: booking.cropId,
          centreId: booking.centreId,
          isActive: true,
          effectiveFrom: { lte: new Date() },
        },
        orderBy: { effectiveFrom: "desc" }
      });

      if (!price) {
        throw new Error("No active procurement price is configured for this crop and centre.");
      }

      const pricePerKg = Number(price.pricePerKg);
      if (pricePerKg <= 0) throw new Error("Invalid procurement price configured (<= 0).");

      const eligibleQuantityKg = acceptedQuantity;
      const grossAmount = eligibleQuantityKg * pricePerKg;
      const deductionAmount = 0; // Configured deductions can be added here
      const netPayableAmount = grossAmount - deductionAmount;

      // 14. ROUNDING - Force 2 decimal precision
      const roundedGross = Math.round(grossAmount * 100) / 100;
      const roundedNet = Math.round(netPayableAmount * 100) / 100;

      const payment = await tx.procurementPayment.create({
        data: {
          bookingId,
          farmerId: booking.farmerId,
          cropId: booking.cropId,
          centreId: booking.centreId,
          eligibleQuantityKg,
          pricePerKg,
          grossAmount: roundedGross,
          deductionAmount,
          netPayableAmount: roundedNet,
          paymentStatus: "PENDING"
        }
      });

      await tx.procurementPaymentAudit.create({
        data: {
          paymentId: payment.id,
          action: "PAYMENT_CREATED",
          performedBy: user.id,
          newStatus: "PENDING"
        }
      });

      await tx.auditLog.create({ data: { actorUserId: user.id, actorRole: "PROCUREMENT_OFFICER", action: "PROCUREMENT_SETTLEMENT_CREATED", entityType: "ProcurementPayment", entityId: payment.id, metadata: { netPayableAmount: roundedNet } } });
      await notifyProcurementPaymentCreated({
        farmerId: booking.farmerId,
        paymentId: payment.id,
        bookingId: booking.id,
        tokenNumber: booking.tokenNumber,
        netPayableAmount: roundedNet,
        tx,
      });

      return { success: true, paymentId: payment.id };
    });
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to create payment." };
  }
}

export async function processProcurementPayment(paymentId: string, paymentMethod: string) {
  const session = await requireRole("PROCUREMENT_OFFICER");
  const user = session.user as SessionUser;

  const officer = await prisma.user.findUnique({
    where: { id: user.id },
    select: { procurementCentreId: true }
  });

  if (!officer?.procurementCentreId) return { success: false, error: "Unauthorized." };

  try {
    return await prisma.$transaction(async (tx) => {
      const payment = await tx.procurementPayment.findUnique({
        where: { id: paymentId },
        include: { booking: true }
      });

      if (!payment) throw new Error("Payment not found.");
      if (payment.centreId !== officer.procurementCentreId) throw new Error("Unauthorized.");
      if (payment.paymentStatus === "PAID") throw new Error("Payment is already completed.");
      
      const transactionRef = `SP-PROC-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${Math.floor(1000 + Math.random() * 9000)}`;
      const receiptNo = `SP-RCP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      await tx.procurementPayment.update({
        where: { id: paymentId },
        data: {
          paymentStatus: "PAID",
          paymentMethod,
          transactionReference: transactionRef,
          receiptNumber: receiptNo,
          paidAt: new Date()
        }
      });

      await tx.procurementPaymentAudit.create({
        data: {
          paymentId: paymentId,
          action: "PAYMENT_PAID",
          performedBy: user.id,
          previousStatus: payment.paymentStatus,
          newStatus: "PAID",
          notes: `Paid via ${paymentMethod}`
        }
      });

      // Optionally transition the booking to COMPLETED
      await tx.procurementBooking.update({
        where: { id: payment.bookingId },
        data: { 
          status: "COMPLETED",
          completedAt: new Date()
        }
      });

      await tx.auditLog.create({ data: { actorUserId: user.id, actorRole: "PROCUREMENT_OFFICER", action: "PROCUREMENT_PAYMENT_COMPLETED", entityType: "ProcurementPayment", entityId: payment.id, metadata: { method: paymentMethod } } });
      await notifyProcurementPaymentPaid({
        farmerId: payment.farmerId,
        paymentId: payment.id,
        receiptNumber: receiptNo,
        netPayableAmount: Number(payment.netPayableAmount),
        tx,
      });

      return { success: true, transactionRef };
    });
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to process payment." };
  }
}

export async function markPaymentFailed(paymentId: string) {
  const session = await requireRole("PROCUREMENT_OFFICER");
  const user = session.user as SessionUser;

  const officer = await prisma.user.findUnique({
    where: { id: user.id },
    select: { procurementCentreId: true }
  });

  if (!officer?.procurementCentreId) return { success: false, error: "Unauthorized." };

  try {
    return await prisma.$transaction(async (tx) => {
      const payment = await tx.procurementPayment.findUnique({ where: { id: paymentId, centreId: officer.procurementCentreId as string }});
      if (!payment) throw new Error("Payment not found");

      await tx.procurementPayment.update({
        where: { id: paymentId },
        data: { paymentStatus: "FAILED" }
      });

      await tx.procurementPaymentAudit.create({
        data: {
          paymentId: paymentId,
          action: "PAYMENT_FAILED",
          performedBy: user.id,
          previousStatus: payment.paymentStatus,
          newStatus: "FAILED"
        }
      });

      await notifyProcurementPaymentFailed({
        farmerId: payment.farmerId,
        paymentId: payment.id,
        bookingId: payment.bookingId,
        tx,
      });

      return { success: true };
    });
  } catch (error: unknown) {
    return { success: false, error: "Failed to mark payment as failed." };
  }
}

export async function retryPayment(paymentId: string) {
  const session = await requireRole("PROCUREMENT_OFFICER");
  const user = session.user as SessionUser;

  const officer = await prisma.user.findUnique({
    where: { id: user.id },
    select: { procurementCentreId: true }
  });

  if (!officer?.procurementCentreId) return { success: false, error: "Unauthorized." };

  try {
    return await prisma.$transaction(async (tx) => {
      const payment = await tx.procurementPayment.findUnique({
        where: { id: paymentId }
      });

      if (!payment) throw new Error("Payment not found.");
      if (payment.centreId !== officer.procurementCentreId) throw new Error("Unauthorized.");
      if (payment.paymentStatus !== "FAILED") throw new Error("Only FAILED payments can be retried.");
      
      await tx.procurementPayment.update({
        where: { id: paymentId },
        data: {
          paymentStatus: "PROCESSING"
        }
      });

      await tx.procurementPaymentAudit.create({
        data: {
          paymentId: paymentId,
          action: "PAYMENT_RETRY",
          performedBy: user.id,
          previousStatus: payment.paymentStatus,
          newStatus: "PROCESSING",
          notes: "Initiated retry after failure"
        }
      });

      return { success: true };
    });
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to retry payment." };
  }
}

export async function getFarmerProcurementPayments(page = 1, limit = 25) {
  const session = await requireRole("FARMER");
  const user = session.user as SessionUser;

  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    prisma.procurementPayment.findMany({
      where: { farmerId: user.id },
      include: {
        booking: true,
        crop: true,
        centre: true
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    }),
    prisma.procurementPayment.count({
      where: { farmerId: user.id }
    })
  ]);

  const serializedPayments = payments.map(p => ({
    id: p.id,
    bookingId: p.bookingId,
    farmerId: p.farmerId,
    cropId: p.cropId,
    centreId: p.centreId,
    paymentMethod: p.paymentMethod,
    paymentStatus: p.paymentStatus,
    transactionReference: p.transactionReference,
    receiptNumber: p.receiptNumber,
    paidAt: p.paidAt ? p.paidAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    eligibleQuantityKg: Number(p.eligibleQuantityKg),
    pricePerKg: Number(p.pricePerKg),
    grossAmount: Number(p.grossAmount),
    deductionAmount: Number(p.deductionAmount),
    netPayableAmount: Number(p.netPayableAmount),
    bookingToken: p.booking?.tokenNumber || "N/A",
    cropName: p.crop?.name || "Unknown",
    centreName: p.centre?.name || "Unknown"
  }));

  return {
    payments: serializedPayments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}
