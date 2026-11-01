"use server";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { getPaymentProvider } from "@/lib/payments/provider";
import { Decimal } from "@prisma/client/runtime/library";

export async function adminRefundPaymentAction(transactionId: string, amountToRefund: number, reason: string) {
  const sessionUser = await requireRole(Role.ADMIN);

  if (amountToRefund <= 0) {
    throw new Error("Refund amount must be greater than zero.");
  }

  // 1. Transaction Lock and Validation
  // Wait, Prisma doesn't have true pessimistic locking without raw SQL, 
  // but we can at least fetch it and check state cleanly.
  const transaction = await prisma.paymentTransaction.findUnique({
    where: { id: transactionId }
  });

  if (!transaction) throw new Error("Transaction not found");
  if (!transaction.providerPaymentId) throw new Error("Transaction cannot be refunded: No provider payment ID");

  if (transaction.status !== "PAID" && transaction.status !== "PARTIALLY_REFUNDED") {
    throw new Error(`Cannot refund transaction in state: ${transaction.status}`);
  }

  const currentRefund = transaction.refundAmount ? transaction.refundAmount.toNumber() : 0;
  const maxRefundable = transaction.amount.toNumber() - currentRefund;

  if (amountToRefund > maxRefundable) {
    throw new Error(`Refund amount exceeds maximum refundable balance (Max: ${maxRefundable})`);
  }

  const provider = getPaymentProvider();

  // 2. Call external provider
  let refundResult;
  try {
    refundResult = await provider.refundPayment({
      providerPaymentId: transaction.providerPaymentId,
      amount: new Decimal(amountToRefund),
      receiptId: `ref_${Date.now()}_${transactionId.substring(0,6)}`,
      notes: reason
    });
  } catch (err: any) {
    console.error("Provider refund failed:", err);
    throw new Error("Provider rejected the refund request: " + err.message);
  }

  // 3. Update local database and Audit
  const isFullRefund = (currentRefund + amountToRefund) >= transaction.amount.toNumber();
  const newStatus = isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED";

  const updatedTx = await prisma.$transaction(async (tx) => {
    const updated = await tx.paymentTransaction.update({
      where: { id: transactionId },
      data: {
        status: newStatus,
        refundAmount: { increment: amountToRefund },
        refundId: refundResult.refundId || undefined
      }
    });

    if (updated.orderId && newStatus === "REFUNDED") {
      // Optional: Mark order payment status as refunded? 
      // Depends on business logic, but updating order paymentStatus helps UI
      await tx.order.update({
        where: { id: updated.orderId },
        data: { paymentStatus: "REFUNDED" }
      });
    }

    await tx.auditLog.create({
      data: {
        actorUserId: (sessionUser.user as any).id,
        actorRole: "ADMIN",
        action: "PAYMENT_REFUND_PROCESSED",
        entityType: "PaymentTransaction",
        entityId: transactionId,
        metadata: {
          amountRefunded: amountToRefund,
          totalRefundedNow: updated.refundAmount?.toNumber(),
          reason,
          providerRefundId: refundResult.refundId
        }
      }
    });

    return updated;
  });

  return { success: true, status: updatedTx.status, refundAmount: updatedTx.refundAmount?.toNumber() };
}
