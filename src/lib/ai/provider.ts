import { AIProvider } from "./types";
import { MockAIProvider } from "./providers/mock-provider";
import { GeminiAIProvider } from "./providers/gemini-provider";

export function getAIProvider(): AIProvider {
  const providerType = process.env.AI_PROVIDER?.toLowerCase() || "mock";
  
  if (providerType === "gemini") {
    return new GeminiAIProvider();
  }
  
  return new MockAIProvider();
}
