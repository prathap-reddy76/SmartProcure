import { prisma } from "../prisma";
import crypto from "crypto";

export function generateIdempotencyKey(userId: string, targetId: string, type: "ORDER" | "MACHINERY"): string {
  // Combine user, target, and a hash of the current day to allow retries on different days, 
  // but strictly block rapid clicks
  return crypto.createHash("sha256").update(`${userId}:${targetId}:${type}`).digest("hex");
}

export async function checkIdempotency(key: string): Promise<boolean> {
  const existing = await prisma.paymentTransaction.findUnique({
    where: { idempotencyKey: key },
  });

  // If it exists and is not failed/cancelled, block
  if (existing && existing.status !== "FAILED" && existing.status !== "CANCELLED" && existing.status !== "EXPIRED") {
    return false; // Not allowed to create
  }

  return true; // Allowed
}

export async function checkWebhookIdempotency(providerEventId: string, provider: string): Promise<boolean> {
  const existing = await prisma.paymentWebhookEvent.findUnique({
    where: { providerEventId },
  });

  return !existing;
}

export async function recordWebhookEvent(providerEventId: string, provider: string, payload: string) {
  await prisma.paymentWebhookEvent.create({
    data: {
      providerEventId,
      provider,
      payload,
    },
  });
}
