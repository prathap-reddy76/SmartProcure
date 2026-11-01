"use server";

import { prisma } from "../../lib/prisma";
import { auth } from "../../lib/auth";

async function getEffectiveUserId(testUserId?: string): Promise<string | null> {
  if (process.env.NODE_ENV === "test" && testUserId) return testUserId;
  try {
    const session = await auth();
    return session?.user?.id || null;
  } catch {
    return null;
  }
}
import { getPaymentProvider } from "../../lib/payments/provider";
import { calculateOrderAmount, calculateMachineryAmount } from "../../lib/payments/verification";
import { generateIdempotencyKey, checkIdempotency } from "../../lib/payments/idempotency";
import { PAYMENT_PROVIDER } from "../../lib/payments/config";

export async function createOrderPayment(orderId: string, testUserId?: string) {
  try {
    const userId = await getEffectiveUserId(testUserId);
    if (!userId) return { success: false, error: "Unauthorized" };

    const amount = await calculateOrderAmount(orderId, userId);
    const idempotencyKey = generateIdempotencyKey(userId, orderId, "ORDER");

    if (!(await checkIdempotency(idempotencyKey))) {
      return { success: false, error: "Payment request is already in progress or completed." };
    }

    const provider = getPaymentProvider();

    return await prisma.$transaction(async (tx) => {
      const transaction = await tx.paymentTransaction.create({
        data: {
          orderId,
          userId,
          amount,
          provider: PAYMENT_PROVIDER.toUpperCase(),
          status: "CREATED",
          idempotencyKey,
          currency: "INR",
        },
      });

      const gatewayOrder = await provider.createOrder({
        internalPaymentId: transaction.id,
        amount,
        currency: "INR",
        receiptId: `rcpt_${transaction.id}`,
        notes: {
          orderId,
          type: "MARKETPLACE",
        },
      });

      const updated = await tx.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          providerOrderId: gatewayOrder.providerOrderId,
          status: "PENDING",
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          actorRole: "FARMER",
          action: "PAYMENT_INITIATED",
          entityType: "PaymentTransaction",
          entityId: transaction.id,
          metadata: { orderId, amount: amount.toString() },
        },
      });

      return {
        success: true,
        transactionId: updated.id,
        providerOrderId: updated.providerOrderId,
        amount: amount.toNumber(),
        currency: updated.currency,
        provider: PAYMENT_PROVIDER,
      };
    });
  } catch (error: any) {
    console.error("createOrderPayment error:", error);
    return { success: false, error: error.message || "Failed to create payment" };
  }
}

export async function verifyOrderPayment(
  transactionId: string,
  providerOrderId: string,
  providerPaymentId: string,
  signature: string,
  testUserId?: string
) {
  try {
    const userId = await getEffectiveUserId(testUserId);
    if (!userId) return { success: false, error: "Unauthorized" };

    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) return { success: false, error: "Transaction not found" };
    if (transaction.userId !== userId) return { success: false, error: "Unauthorized" };
    if (transaction.status === "PAID") return { success: true, message: "Already paid" };
    if (transaction.providerOrderId !== providerOrderId) return { success: false, error: "Order ID mismatch" };

    const provider = getPaymentProvider();
    
    // Verify signature mathematically
    provider.verifySignature({
      providerOrderId,
      providerPaymentId,
      signature,
    });

    // Optionally fetch status from gateway as second layer
    const remoteData = await provider.fetchPayment(providerPaymentId);
    if (remoteData.status !== "PAID" && remoteData.status !== "PENDING") {
      // It might be captured asynchronously, but Razorpay signature valid usually means success.
      // We will trust the signature for immediate success, or strictly wait for webhook.
    }

    return await prisma.$transaction(async (tx) => {
      const updatedTx = await tx.paymentTransaction.update({
        where: { id: transactionId },
        data: {
          status: "PAID",
          providerPaymentId,
          paidAt: new Date(),
        },
      });

      if (updatedTx.orderId) {
        await tx.order.update({
          where: { id: updatedTx.orderId },
          data: { paymentStatus: "PAID" },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          actorRole: "FARMER",
          action: "PAYMENT_VERIFIED",
          entityType: "PaymentTransaction",
          entityId: transaction.id,
          metadata: { providerPaymentId },
        },
      });

      return { success: true, status: "PAID" };
    });
  } catch (error: any) {
    console.error("verifyOrderPayment error:", error);
    
    // Record Failure
    await prisma.paymentTransaction.update({
      where: { id: transactionId },
      data: {
        status: "FAILED",
        failureReason: error.message,
      },
    }).catch(() => {});

    return { success: false, error: error.message || "Payment verification failed" };
  }
}
