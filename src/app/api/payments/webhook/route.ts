import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getPaymentProvider } from "../../../../lib/payments/provider";
import { checkWebhookIdempotency, recordWebhookEvent } from "../../../../lib/payments/idempotency";
import { PAYMENT_PROVIDER } from "../../../../lib/payments/config";
import { PaymentStatus } from "@prisma/client";

// Force Node.js runtime instead of Edge to safely use crypto module in webhook parsing
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || req.headers.get("x-sandbox-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const provider = getPaymentProvider();
    
    // Will throw if signature fails
    const payload = provider.verifyWebhook(rawBody, signature);
    const eventId = payload.id || `evt_${Date.now()}`;
    const eventName = payload.event; // e.g., 'payment.captured'

    // 1. Check idempotency
    const isNew = await checkWebhookIdempotency(eventId, PAYMENT_PROVIDER);
    if (!isNew) {
      return NextResponse.json({ status: "ok", message: "Already processed" }, { status: 200 });
    }

    // 2. Extract values safely
    let providerPaymentId = "";
    let providerOrderId = "";
    let providerAmount = 0;
    let providerCurrency = "";

    if (PAYMENT_PROVIDER === "razorpay") {
      providerPaymentId = payload.payload?.payment?.entity?.id;
      providerOrderId = payload.payload?.payment?.entity?.order_id;
      providerAmount = payload.payload?.payment?.entity?.amount; // in paise
      providerCurrency = payload.payload?.payment?.entity?.currency;
    } else {
      providerPaymentId = payload.paymentId;
      providerOrderId = payload.orderId;
      providerAmount = payload.amount;
      providerCurrency = payload.currency;
    }

    if (!providerPaymentId && !providerOrderId) {
      return NextResponse.json({ error: "Missing provider payment and order identifiers in payload" }, { status: 400 });
    }

    let transaction = await prisma.paymentTransaction.findUnique({
      where: { providerPaymentId: providerPaymentId || "UNKNOWN" },
    });

    if (!transaction && providerOrderId) {
      transaction = await prisma.paymentTransaction.findUnique({
        where: { providerOrderId },
      });
    }

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // 3. Security Check: Amount & Currency Verification
    if (eventName === "payment.captured" || eventName === "payment.success") {
      const expectedAmountInPaise = Math.round(transaction.amount.toNumber() * 100);
      if (providerAmount !== expectedAmountInPaise) {
        // SECURITY ALERT: Amount mismatch
        await prisma.auditLog.create({
          data: {
            actorUserId: "SYSTEM",
            actorRole: "SYSTEM",
            action: "WEBHOOK_AMOUNT_MISMATCH",
            entityType: "PaymentTransaction",
            entityId: transaction.id,
            metadata: { expected: expectedAmountInPaise, received: providerAmount },
          }
        });
        return NextResponse.json({ error: "Amount mismatch detected" }, { status: 400 });
      }

      if (providerCurrency !== transaction.currency) {
        return NextResponse.json({ error: "Currency mismatch detected" }, { status: 400 });
      }
    }

    // 4. State Machine Enforcement
    const currentStatus = transaction.status;
    let newStatus: PaymentStatus | undefined = undefined;

    if (eventName === "payment.captured" || eventName === "payment.success") {
      // Allowed transitions to PAID
      if (currentStatus === "CREATED" || currentStatus === "PENDING" || currentStatus === "AUTHORIZED" || currentStatus === "PROCESSING") {
        newStatus = "PAID";
      } else if (currentStatus === "PAID") {
        // Already paid
        newStatus = "PAID";
      } else {
        // Invalid transition
        return NextResponse.json({ error: `Invalid state transition from ${currentStatus} to PAID` }, { status: 400 });
      }
    } else if (eventName === "payment.failed") {
      // Allowed transitions to FAILED
      if (currentStatus === "CREATED" || currentStatus === "PENDING" || currentStatus === "AUTHORIZED") {
        newStatus = "FAILED";
      }
    } else if (eventName === "refund.processed") {
      if (currentStatus === "PAID" || currentStatus === "REFUND_PENDING") {
        newStatus = "REFUNDED";
      } else if (currentStatus === "PARTIALLY_REFUNDED") {
         newStatus = "PARTIALLY_REFUNDED";
      }
    }

    if (newStatus && newStatus !== currentStatus) {
      await prisma.$transaction(async (tx) => {
        const updatedTx = await tx.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            status: newStatus,
            providerPaymentId: providerPaymentId || undefined,
            paidAt: newStatus === "PAID" ? new Date() : undefined,
          },
        });

        if (updatedTx.orderId && newStatus === "PAID") {
          await tx.order.update({
            where: { id: updatedTx.orderId },
            data: { paymentStatus: "PAID" },
          });
        }

        await tx.auditLog.create({
          data: {
            actorUserId: "SYSTEM",
            actorRole: "SYSTEM",
            action: `PAYMENT_${newStatus}`,
            entityType: "PaymentTransaction",
            entityId: updatedTx.id,
            metadata: { eventName, providerPaymentId, previousStatus: currentStatus },
          },
        });
      });
    }

    // Finalize idempotency recording
    await recordWebhookEvent(eventId, PAYMENT_PROVIDER, rawBody);

    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
