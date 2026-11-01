import { prisma } from "../prisma";
import { getPaymentProvider } from "./provider";

export async function reconcilePayment(paymentTransactionId: string, adminUserId: string) {
  return await prisma.$transaction(async (tx) => {
    const payment = await tx.paymentTransaction.findUnique({
      where: { id: paymentTransactionId },
    });

    if (!payment) throw new Error("Payment transaction not found");
    if (!payment.providerPaymentId) throw new Error("No provider payment ID exists to reconcile");

    const provider = getPaymentProvider();
    
    // Fetch directly from the gateway
    const remoteData = await provider.fetchPayment(payment.providerPaymentId);

    // If there's a discrepancy
    if (remoteData.status !== payment.status) {
      const updatedPayment = await tx.paymentTransaction.update({
        where: { id: payment.id },
        data: {
          status: remoteData.status,
        },
      });

      // Synchronize associated models if necessary
      if (remoteData.status === "PAID") {
        if (updatedPayment.orderId) {
          await tx.order.update({
            where: { id: updatedPayment.orderId },
            data: { paymentStatus: "PAID" },
          });
        }
        if (updatedPayment.machineryBookingId) {
          await tx.machineryBooking.update({
            where: { id: updatedPayment.machineryBookingId },
            data: { paymentStatus: "PAID" },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          actorRole: "ADMIN",
          action: "PAYMENT_RECONCILED",
          entityType: "PaymentTransaction",
          entityId: payment.id,
          metadata: {
            oldStatus: payment.status,
            newStatus: remoteData.status,
          },
        },
      });

      return updatedPayment;
    }

    return payment;
  });
}
