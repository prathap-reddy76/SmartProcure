export class PaymentError extends Error {
  public code: string;
  public details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = "PaymentError";
    this.code = code;
    this.details = details;
  }
}

export class PaymentVerificationError extends PaymentError {
  constructor(message = "Payment signature verification failed") {
    super(message, "VERIFICATION_FAILED");
    this.name = "PaymentVerificationError";
  }
}

export class WebhookVerificationError extends PaymentError {
  constructor(message = "Webhook signature verification failed") {
    super(message, "WEBHOOK_VERIFICATION_FAILED");
    this.name = "WebhookVerificationError";
  }
}

export class IdempotencyError extends PaymentError {
  constructor(message = "Duplicate request detected") {
    super(message, "IDEMPOTENCY_VIOLATION");
    this.name = "IdempotencyError";
  }
}
