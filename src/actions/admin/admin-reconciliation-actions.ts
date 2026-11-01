"use server";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { getPaymentProvider } from "@/lib/payments/provider";
import { serializeDecimal } from "@/lib/analytics/core";

export async function runReconciliationAction(transactionIds: string[]) {
  await requireRole(Role.ADMIN);

  if (!transactionIds.length) return [];

  const transactions = await prisma.paymentTransaction.findMany({
    where: { id: { in: transactionIds } }
  });

  const provider = getPaymentProvider();

  // Process sequentially or small chunks to prevent rate limits, 
  // but since it's driven by a manual admin UI selection, Promise.all is fine for a handful.
  const results = await Promise.all(
    transactions.map(async (tx) => {
      // Missing provider ID
      if (!tx.providerPaymentId) {
        return {
          id: tx.id,
          orderId: tx.orderId,
          internalStatus: tx.status,
          internalAmount: serializeDecimal(tx.amount),
          providerStatus: null,
          providerAmount: null,
          matchStatus: "MISSING_PROVIDER_ID"
        };
      }

      try {
        const providerData = await provider.fetchPayment(tx.providerPaymentId);
        const internalAmount = tx.amount.toNumber();
        const providerAmount = providerData.amount.toNumber();

        let matchStatus = "MATCHED";

        if (internalAmount !== providerAmount) {
          matchStatus = "AMOUNT_MISMATCH";
        } else if (tx.status !== providerData.status) {
          // Special exception: PARTIALLY_REFUNDED internal vs REFUNDED provider could be accepted depending on Razorpay logic, 
          // but strictly speaking we flag it.
          matchStatus = "STATUS_MISMATCH";
        }

        return {
          id: tx.id,
          orderId: tx.orderId,
          internalStatus: tx.status,
          internalAmount,
          providerStatus: providerData.status,
          providerAmount,
          matchStatus
        };
      } catch (err) {
        return {
          id: tx.id,
          orderId: tx.orderId,
          internalStatus: tx.status,
          internalAmount: serializeDecimal(tx.amount),
          providerStatus: null,
          providerAmount: null,
          matchStatus: "PROVIDER_ERROR"
        };
      }
    })
  );

  return results;
}
