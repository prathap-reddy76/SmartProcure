import { PaymentStatus, PaymentMethod } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export interface CreatePaymentRequest {
  internalPaymentId: string;
  amount: Decimal;
  currency: string;
  receiptId: string;
  notes?: Record<string, string>;
}

export interface ProviderPaymentOrder {
  providerOrderId: string;
  amount: Decimal;
  currency: string;
  status: string;
}

export interface VerifyPaymentRequest {
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
}

export interface RefundRequest {
  providerPaymentId: string;
  amount: Decimal;
  notes?: string;
  receiptId: string;
}

export interface RefundResult {
  refundId: string;
  status: string;
  amount: Decimal;
}

export interface PaymentProvider {
  /**
   * Initializes a payment order with the gateway.
   */
  createOrder(request: CreatePaymentRequest): Promise<ProviderPaymentOrder>;

  /**
   * Verifies the client's payment success payload signature.
   */
  verifySignature(request: VerifyPaymentRequest): boolean;

  /**
   * Fetches the current payment status directly from the gateway.
   */
  fetchPayment(providerPaymentId: string): Promise<{ status: PaymentStatus; amount: Decimal; method: string }>;

  /**
   * Initiates a refund for a captured payment.
   */
  refundPayment(request: RefundRequest): Promise<RefundResult>;

  /**
   * Parses and validates a webhook payload. Throws if signature is invalid.
   */
  verifyWebhook(payload: string, signature: string): any;
}
