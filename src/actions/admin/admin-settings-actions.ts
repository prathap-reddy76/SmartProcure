"use server";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export type PlatformSettingsStatus = {
  environment: string;
  database: {
    provider: string;
    status: "Healthy" | "Unavailable";
  };
  payment: {
    provider: string;
    environment: string;
    isConfigured: boolean;
  };
  ai: {
    provider: string;
    model: string;
    isConfigured: boolean;
  };
  storage: {
    provider: string;
    isConfigured: boolean;
  };
  lastDeployment?: string;
};

export async function getPlatformSettingsStatus(): Promise<{ data: PlatformSettingsStatus | null; error?: string }> {
  try {
    await requireRole("ADMIN");

    // 1. Database Health Check
    let dbStatus: "Healthy" | "Unavailable" = "Unavailable";
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = "Healthy";
    } catch (e) {
      dbStatus = "Unavailable";
    }

    // 2. Safely read environment variables (DO NOT expose secrets)
    const paymentProvider = process.env.PAYMENT_PROVIDER || "sandbox";
    const paymentEnv = process.env.PAYMENT_ENVIRONMENT || "sandbox";
    const hasRazorpayKeys = !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET;

    const aiProvider = process.env.AI_PROVIDER || "mock";
    const aiModel = process.env.AI_MODEL || "gemini-2.5-flash";
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;

    const storageProvider = process.env.STORAGE_PROVIDER || "local";

    const data: PlatformSettingsStatus = {
      environment: process.env.NODE_ENV || "development",
      database: {
        provider: "Aiven PostgreSQL",
        status: dbStatus,
      },
      payment: {
        provider: paymentProvider,
        environment: paymentEnv,
        isConfigured: paymentProvider === "razorpay" ? hasRazorpayKeys : true,
      },
      ai: {
        provider: aiProvider,
        model: aiModel,
        isConfigured: aiProvider === "gemini" ? hasGeminiKey : true,
      },
      storage: {
        provider: storageProvider,
        isConfigured: true, // local always true for now
      }
    };

    return { data };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error fetching platform settings status:", error);
    return { data: null, error: "Failed to securely retrieve platform configuration." };
  }
}
