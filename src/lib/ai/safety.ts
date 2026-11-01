import { IntentType } from "./types";

import { rateLimit } from "../rate-limit";
// Replaced with abstraction for Phase 30
export async function checkRateLimit(userId: string): Promise<boolean> {
  const limit = parseInt(process.env.AI_RATE_LIMIT_PER_MINUTE || "10", 10);
  return await rateLimit.check(`ai:rate:${userId}`, limit, 60000);
}

export function detectIntent(message: string): IntentType {
  const msg = message.toLowerCase();

  if (msg.includes("weather") || msg.includes("rain") || msg.includes("temperature")) {
    return "WEATHER";
  }
  if (msg.includes("price") || msg.includes("market") || msg.includes("rate")) {
    if (msg.includes("compare") || msg.includes("highest") || msg.includes("best")) {
      return "MARKET_COMPARISON";
    }
    return "MARKET_PRICE";
  }
  if (msg.includes("procurement") || msg.includes("status") || msg.includes("token")) {
    return "PROCUREMENT";
  }
  if (msg.includes("payment") || msg.includes("paid") || msg.includes("money") || msg.includes("receipt")) {
    return "PROCUREMENT_PAYMENT";
  }
  if (msg.includes("quality") || msg.includes("moisture") || msg.includes("grade") || msg.includes("reject")) {
    return "PROCUREMENT_QUALITY";
  }
  if (msg.includes("order") || msg.includes("delivery")) {
    return "ORDERS";
  }
  if (msg.includes("product") || msg.includes("fertilizer") || msg.includes("seed") || msg.includes("buy")) {
    return "PRODUCTS";
  }
  if (msg.includes("farm") || msg.includes("area") || msg.includes("land")) {
    return "FARM";
  }
  if (msg.includes("crop") || msg.includes("grow") || msg.includes("spray") || msg.includes("harvest") || msg.includes("pest")) {
    return "CROP_ADVISORY";
  }

  return "UNKNOWN";
}

export function validateMessage(message: string): { isValid: boolean; error?: string } {
  if (!message || message.trim() === "") {
    return { isValid: false, error: "Message cannot be empty." };
  }
  if (message.length > 2000) {
    return { isValid: false, error: "Message is too long. Maximum 2000 characters." };
  }
  return { isValid: true };
}
