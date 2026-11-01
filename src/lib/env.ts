import { z } from "zod";

const envSchema = z.object({
  // Core
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url("Must be a valid PostgreSQL URL"),
  
  // Auth
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 characters long"),
  APP_URL: z.string().url("Must be a valid URL").optional().default("http://localhost:3000"),

  // External APIs
  WEATHER_API_KEY: z.string().optional(),
  
  // AI Provider
  AI_PROVIDER: z.enum(["MOCK", "GEMINI"]).default("MOCK"),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().optional(),

  // Payments
  PAYMENT_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),
  PAYMENT_PROVIDER: z.enum(["sandbox", "razorpay"]).default("sandbox"),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
}).superRefine((env, ctx) => {
  // Validate AI keys if using Gemini
  if (env.AI_PROVIDER === "GEMINI" && !env.AI_API_KEY) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "AI_API_KEY is required when AI_PROVIDER is GEMINI",
      path: ["AI_API_KEY"],
    });
  }

  // Validate Razorpay keys if using live razorpay
  if (env.PAYMENT_PROVIDER === "razorpay" && env.PAYMENT_ENVIRONMENT === "production") {
    if (!env.RAZORPAY_KEY_ID) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "RAZORPAY_KEY_ID is required for production payments", path: ["RAZORPAY_KEY_ID"] });
    }
    if (!env.RAZORPAY_KEY_SECRET) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "RAZORPAY_KEY_SECRET is required for production payments", path: ["RAZORPAY_KEY_SECRET"] });
    }
    if (!env.RAZORPAY_WEBHOOK_SECRET) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "RAZORPAY_WEBHOOK_SECRET is required for production payments", path: ["RAZORPAY_WEBHOOK_SECRET"] });
    }
  }
});

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    for (const error of parsed.error.issues) {
      console.error(`  - ${error.path.join('.')}: ${error.message}`);
    }
    
    // Only throw in production or if explicitly requested to fail fast during boot.
    // We allow safe degradation in dev.
    if (process.env.NODE_ENV === "production") {
      throw new Error("Invalid environment variables. See logs above.");
    }
    
    return process.env as unknown as z.infer<typeof envSchema>; // Fallback unvalidated
  }
  
  return parsed.data;
}

export const env = validateEnv();
