import { prisma } from "../prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { getPaymentProvider } from "./provider";

/**
 * Initiates a refund for a successful payment.
 */
export async function initiateRefund(paymentTransactionId: string, amount: Decimal, adminUserId: string, reason: string) {
  return await prisma.$transaction(async (tx) => {
    const payment = await tx.paymentTransaction.findUnique({
      where: { id: paymentTransactionId },
    });

    if (!payment) throw new Error("Payment transaction not found");
    if (payment.status !== "PAID" && payment.status !== "PARTIALLY_REFUNDED") {
      throw new Error("Only PAID transactions can be refunded");
    }

    const currentRefund = payment.refundAmount || new Decimal(0);
    const newTotalRefund = currentRefund.add(amount);

    if (newTotalRefund.greaterThan(payment.amount)) {
      throw new Error("Cannot refund more than the total captured amount");
    }

    const provider = getPaymentProvider();

    // In a real system, you'd enqueue this or run it safely, but for simplicity here we await it
    const refundResult = await provider.refundPayment({
      providerPaymentId: payment.providerPaymentId!,
      amount,
      notes: reason,
      receiptId: `ref_${payment.id}`,
    });

    const isFullRefund = newTotalRefund.equals(payment.amount);

    const updatedPayment = await tx.paymentTransaction.update({
      where: { id: payment.id },
      data: {
        status: isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED",
        refundId: refundResult.refundId,
        refundAmount: newTotalRefund,
      },
    });

    // Create Audit Log
    await tx.auditLog.create({
      data: {
        actorUserId: adminUserId,
        actorRole: "ADMIN",
        action: "PAYMENT_REFUNDED",
        entityType: "PaymentTransaction",
        entityId: payment.id,
        metadata: {
          amount: amount.toString(),
          reason,
          refundId: refundResult.refundId,
        },
      },
    });

    return updatedPayment;
  });
}
