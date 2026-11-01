import { PaymentProvider } from "./types";
import { PAYMENT_PROVIDER } from "./config";
import { SandboxPaymentProvider } from "./providers/sandbox";
import { RazorpayProvider } from "./providers/razorpay";

let providerInstance: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (providerInstance) return providerInstance;

  // We enforce sandbox globally if running in test environment or explicitly set
  if (PAYMENT_PROVIDER === "sandbox" || process.env.NODE_ENV === "test") {
    providerInstance = new SandboxPaymentProvider();
  } else if (PAYMENT_PROVIDER === "razorpay") {
    providerInstance = new RazorpayProvider();
  } else {
    // Fallback to sandbox safely
    providerInstance = new SandboxPaymentProvider();
  }

  return providerInstance;
}
