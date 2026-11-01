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
import { PaymentVerificationError } from "../errors";
import crypto from "crypto";

export class SandboxPaymentProvider implements PaymentProvider {
  async createOrder(request: CreatePaymentRequest): Promise<ProviderPaymentOrder> {
    const sandboxOrderId = `sandbox_order_${crypto.randomBytes(8).toString("hex")}`;
    
    return {
      providerOrderId: sandboxOrderId,
      amount: request.amount,
      currency: request.currency,
      status: "created",
    };
  }

  verifySignature(request: VerifyPaymentRequest): boolean {
    // In sandbox, we just expect a specific format or it always passes if it contains 'sandbox'
    if (!request.providerOrderId.startsWith("sandbox_order_")) return false;
    // Simulate signature validation failure if the signature explicitly asks for it (testing purposes)
    if (request.signature === "fail_verification") {
      throw new PaymentVerificationError();
    }
    return true;
  }

  async fetchPayment(providerPaymentId: string): Promise<{ status: PaymentStatus; amount: Decimal; method: string }> {
    // Return mock data based on ID format
    return {
      status: PaymentStatus.PAID,
      amount: new Decimal(0), // In reality, we'd fetch this from a mock store, but we return 0 to bypass strict checks if not checking amount here, or just trust the DB
      method: "ONLINE",
    };
  }

  async refundPayment(request: RefundRequest): Promise<RefundResult> {
    const sandboxRefundId = `sandbox_refund_${crypto.randomBytes(8).toString("hex")}`;
    return {
      refundId: sandboxRefundId,
      status: "processed",
      amount: request.amount,
    };
  }

  verifyWebhook(payload: string, signature: string): any {
    if (signature === "invalid") {
      throw new Error("Invalid webhook signature");
    }
    return JSON.parse(payload);
  }
}
