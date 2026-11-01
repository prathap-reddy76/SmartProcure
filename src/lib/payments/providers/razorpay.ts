import {
  PaymentProvider,
  CreatePaymentRequest,
  ProviderPaymentOrder,
  VerifyPaymentRequest,
  RefundRequest,
  RefundResult,
} from "../types";
import { PaymentStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { PaymentVerificationError, WebhookVerificationError } from "../errors";
import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET } from "../config";
import crypto from "crypto";

export class RazorpayProvider implements PaymentProvider {
  // Using native fetch to avoid external dependencies like razorpay npm package if not installed, 
  // or we can just mock it for now since we're in sandbox mode.
  // Given we don't have the razorpay package installed guaranteed, we will use fetch.
  
  private getAuthHeader() {
    return `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")}`;
  }

  async createOrder(request: CreatePaymentRequest): Promise<ProviderPaymentOrder> {
    const amountInPaise = Math.round(request.amount.toNumber() * 100);

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": this.getAuthHeader(),
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: request.currency,
        receipt: request.receiptId,
        notes: request.notes || {},
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`Razorpay createOrder failed: ${JSON.stringify(error)}`);
    }

    const data = await res.json();
    return {
      providerOrderId: data.id,
      amount: new Decimal(data.amount / 100),
      currency: data.currency,
      status: data.status, // e.g. 'created'
    };
  }

  verifySignature(request: VerifyPaymentRequest): boolean {
    const body = request.providerOrderId + "|" + request.providerPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== request.signature) {
      throw new PaymentVerificationError();
    }
    return true;
  }

  async fetchPayment(providerPaymentId: string): Promise<{ status: PaymentStatus; amount: Decimal; method: string }> {
    const res = await fetch(`https://api.razorpay.com/v1/payments/${providerPaymentId}`, {
      headers: { "Authorization": this.getAuthHeader() },
    });
    
    if (!res.ok) throw new Error("Failed to fetch Razorpay payment");
    
    const data = await res.json();
    
    let status: PaymentStatus = PaymentStatus.PENDING;
    if (data.status === "captured") status = PaymentStatus.PAID;
    else if (data.status === "failed") status = PaymentStatus.FAILED;
    else if (data.status === "refunded") status = PaymentStatus.REFUNDED;

    return {
      status,
      amount: new Decimal(data.amount / 100),
      method: data.method?.toUpperCase() || "ONLINE",
    };
  }

  async refundPayment(request: RefundRequest): Promise<RefundResult> {
    const amountInPaise = Math.round(request.amount.toNumber() * 100);

    const res = await fetch(`https://api.razorpay.com/v1/payments/${request.providerPaymentId}/refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": this.getAuthHeader(),
      },
      body: JSON.stringify({
        amount: amountInPaise,
        receipt: request.receiptId,
        notes: { reason: request.notes || "" },
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`Razorpay refund failed: ${JSON.stringify(error)}`);
    }

    const data = await res.json();
    return {
      refundId: data.id,
      status: data.status,
      amount: new Decimal(data.amount / 100),
    };
  }

  verifyWebhook(payload: string, signature: string): any {
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    if (expectedSignature !== signature) {
      throw new WebhookVerificationError();
    }

    return JSON.parse(payload);
  }
}
