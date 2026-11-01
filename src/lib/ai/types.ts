export type IntentType =
  | "WEATHER"
  | "MARKET_PRICE"
  | "MARKET_COMPARISON"
  | "PROCUREMENT"
  | "PROCUREMENT_PAYMENT"
  | "PROCUREMENT_QUALITY"
  | "ORDERS"
  | "PRODUCTS"
  | "FARM"
  | "CROP_ADVISORY"
  | "GENERAL_AGRICULTURE"
  | "UNKNOWN";

export interface AIRequest {
  farmerId: string;
  message: string;
  intent: IntentType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contextData: any; // Dynamic based on intent
}

export interface AIResponse {
  text: string;
  isMock?: boolean;
  intentDetected?: IntentType;
  provider: "gemini" | "mock";
}

export interface AIProvider {
  name: string;
  generateResponse(request: AIRequest): Promise<AIResponse>;
  generateStream?(request: AIRequest): Promise<{ stream: ReadableStream; providerName: "gemini" | "mock" }>;
}
