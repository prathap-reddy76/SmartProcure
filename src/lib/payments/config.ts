export const PAYMENT_ENV = process.env.PAYMENT_ENVIRONMENT || "sandbox";
export const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || "sandbox";

// Razorpay Config
export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
export const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "";

export const isProductionPayment = PAYMENT_ENV === "production";
