"use server";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { requireRole } from "@/lib/auth-utils";
import { getAIProvider } from "@/lib/ai/provider";
import { detectIntent, validateMessage, checkRateLimit } from "@/lib/ai/safety";
import { buildFarmerContext } from "@/lib/ai/context";
import { AIResponse } from "@/lib/ai/types";
import { SessionUser } from "@/types/auth";

export async function processFarmerAIMessage(message: string): Promise<AIResponse & { error?: string }> {
  try {
    const session = await requireRole("FARMER");
    const user = session.user as SessionUser;

    if (!(await checkRateLimit(user.id))) {
      return { 
        text: "You have reached the maximum number of requests per minute. Please wait a moment and try again.", 
        error: "RATE_LIMIT_EXCEEDED",
        provider: "mock"
      };
    }

    const validation = validateMessage(message);
    if (!validation.isValid) {
      return { text: validation.error!, error: "INVALID_MESSAGE", provider: "mock" };
    }

    const intent = detectIntent(message);
    const contextData = await buildFarmerContext(user.id, intent);

    const provider = getAIProvider();
    
    const response = await provider.generateResponse({
      farmerId: user.id,
      message,
      intent,
      contextData,
    });

    return {
      ...response,
      intentDetected: intent,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("AI Assistant Error:", error);
    return { text: "The AI assistant is temporarily unavailable. Please try again later.", error: "SERVER_ERROR", provider: "mock" };
  }
}
