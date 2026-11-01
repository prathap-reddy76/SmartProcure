import { GoogleGenAI } from "@google/genai";
import { getFarmingSystemInstruction, getPlantAnalysisInstruction } from "./prompts";
import { SupportedLanguage } from "./i18n";
import { AIProductRecord } from "./product-search";
import type { MarketPriceSummary, WeatherSummary } from "./live-info-service";

export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface StreamFarmingAdviceParams {
  message: string;
  language?: SupportedLanguage;
  history?: ChatHistoryItem[];
  /** Verified product records retrieved from the database (Phase 2). */
  products?: AIProductRecord[];
  /** Verified mandi market prices (Phase 6). */
  marketPrices?: MarketPriceSummary[];
  /** Verified live weather observation and forecast (Phase 6). */
  weather?: WeatherSummary | null;
}

export interface AnalyzeDiseaseParams {
  /** Raw image bytes (validated server-side before calling this function) */
  imageBytes: Buffer;
  /** MIME type: image/jpeg | image/png | image/webp */
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  language?: SupportedLanguage;
  /** Verified product records from DB (Phase 3 + Phase 2 integration) */
  products?: AIProductRecord[];
  /** Optional farmer question typed alongside the image in the composer */
  farmerText?: string;
}

export interface GeminiConfigStatus {
  isConfigured: boolean;
  model: string;
}

/**
 * Checks whether the server environment has a configured GEMINI_API_KEY.
 * Never exposes the key itself.
 */
export function getGeminiConfigStatus(): GeminiConfigStatus {
  const key = process.env.GEMINI_API_KEY;
  const isConfigured = Boolean(key && key.trim() !== "" && key !== "YOUR_GEMINI_API_KEY");
  const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  return { isConfigured, model };
}

/**
 * Sanitizes and prepares history items for the Gemini API:
 * 1. Validates array, roles ("user" | "assistant"), non-empty content
 * 2. Strips internal protocol headers (PRODUCTS_JSON) from assistant content
 * 3. Caps at max 10 messages (5 turns), max 1,000 chars per message, max 8,000 total chars
 * 4. Ensures strict user/model turn alternation starting with a user turn
 */
export function sanitizeChatHistory(
  rawHistory: unknown
): Array<{ role: "user" | "model"; parts: [{ text: string }] }> {
  if (!Array.isArray(rawHistory)) return [];

  // Filter and normalize
  const validItems: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const item of rawHistory) {
    if (
      item &&
      typeof item === "object" &&
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string"
    ) {
      let cleanContent = item.content;
      // Strip PRODUCTS_JSON: prefix line if present
      if (cleanContent.includes("PRODUCTS_JSON:")) {
        cleanContent = cleanContent
          .split("\n")
          .filter((line: string) => !line.trim().startsWith("PRODUCTS_JSON:"))
          .join("\n");
      }
      cleanContent = cleanContent.trim().slice(0, 1000);
      if (cleanContent) {
        validItems.push({ role: item.role, content: cleanContent });
      }
    }
  }

  // Take the most recent 10 messages
  const sliced = validItems.slice(-10);

  // Gemini contents must start with a "user" turn and strictly alternate
  const alternating: Array<{ role: "user" | "model"; parts: [{ text: string }] }> = [];

  for (const item of sliced) {
    const role = item.role === "assistant" ? "model" : "user";
    // If alternating is empty, the first message MUST be a "user" turn
    if (alternating.length === 0) {
      if (role === "user") {
        alternating.push({ role: "user", parts: [{ text: item.content }] });
      }
      // If it's model (e.g. welcome message), skip it so history starts with user
      continue;
    }

    const prevRole = alternating[alternating.length - 1].role;
    if (role !== prevRole) {
      alternating.push({ role, parts: [{ text: item.content }] });
    } else {
      // If consecutive same roles, append text to previous turn
      const prevText = alternating[alternating.length - 1].parts[0].text;
      alternating[alternating.length - 1].parts[0].text = (prevText + "\n\n" + item.content).slice(0, 1000);
    }
  }

  // Ensure total character count across history stays under 8,000 chars
  let totalChars = alternating.reduce((sum, item) => sum + item.parts[0].text.length, 0);
  while (totalChars > 8000 && alternating.length > 2) {
    const dropped1 = alternating.shift();
    const dropped2 = alternating.shift();
    totalChars -= (dropped1?.parts[0].text.length || 0) + (dropped2?.parts[0].text.length || 0);
  }

  // Ensure history ends with "model" so the next turn (current user message) alternates cleanly
  if (alternating.length > 0 && alternating[alternating.length - 1].role === "user") {
    alternating.pop();
  }

  return alternating;
}

/**
 * Streams agricultural farming advice from the Gemini API using @google/genai SDK.
 * Phase 2: accepts optional verified DB products to inject as trusted context.
 * Phase 5: validated, context-aware history and robust timeout handling.
 */
export async function streamFarmingAdvice({
  message,
  language = "en",
  history = [],
  products,
  marketPrices,
  weather,
}: StreamFarmingAdviceParams): Promise<ReadableStream<Uint8Array>> {
  const { isConfigured, model } = getGeminiConfigStatus();

  if (!isConfigured) {
    throw new Error("GEMINI_API_KEY_NOT_CONFIGURED");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const systemInstruction = getFarmingSystemInstruction(language, products, marketPrices, weather);

  // Sanitize and ensure strictly alternating history turns
  const safeHistory = sanitizeChatHistory(history);

  // Build the complete contents array ending with the current user message
  const contents = [
    ...safeHistory,
    {
      role: "user" as const,
      parts: [{ text: message.slice(0, 1000) }]
    }
  ];

  const encoder = new TextEncoder();
  let isCancelled = false;

  const streamResult = await ai.models.generateContentStream({
    model,
    contents,
    config: {
      systemInstruction,
      temperature: 0.3,
    }
  });

  return new ReadableStream({
    async start(controller) {
      try {
        let hasProducedOutput = false;
        for await (const chunk of streamResult) {
          if (isCancelled) break;
          const text = chunk.text;
          if (text) {
            hasProducedOutput = true;
            controller.enqueue(encoder.encode(text));
          }
        }

        // Handle completely empty model response gracefully
        if (!hasProducedOutput && !isCancelled) {
          const emptyFallback =
            language === "te"
              ? "నమస్కారం! మీ ప్రశ్నకు సమాధానం రూపొందించడంలో సమస్య ఎదురైంది. దయచేసి మీ ప్రశ్నను మరిన్ని వివరాలతో మళ్లీ అడగండి."
              : "I apologize, but I could not generate an answer for that query. Please rephrase or provide a bit more detail about your crop or issue.";
          controller.enqueue(encoder.encode(emptyFallback));
        }
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : "Stream generation failed";
        console.error("Gemini stream generation error:", errMessage);

        if (!isCancelled) {
          const fallbackError =
            language === "te"
              ? "\n\n[గమనిక: సలహా రూపొందించేటప్పుడు అంతరాయం ఏర్పడింది. దయచేసి మళ్లీ ప్రయత్నించండి.]"
              : "\n\n[Note: An interruption occurred while generating the advice. Please try again.]";
          controller.enqueue(encoder.encode(fallbackError));
        }
      } finally {
        controller.close();
      }
    },
    cancel() {
      isCancelled = true;
    }
  });
}

/**
 * Analyzes a plant image for disease, pest, or nutrient deficiency using Gemini vision.
 * Image bytes are passed inline (inlineData); they are NEVER logged or persisted here.
 *
 * Phase 3 — uses generateContent (non-streaming) because the route handler needs
 * the full text to derive product search terms before streaming back to the client.
 * The route handler streams the result itself with PRODUCTS_JSON prefix.
 */
export async function analyzeDisease({
  imageBytes,
  mimeType,
  language = "en",
  products,
  farmerText,
}: AnalyzeDiseaseParams): Promise<string> {
  const { isConfigured, model } = getGeminiConfigStatus();

  if (!isConfigured) {
    throw new Error("GEMINI_API_KEY_NOT_CONFIGURED");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const systemInstruction = getPlantAnalysisInstruction(language, products);

  const result = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType,
              data: imageBytes.toString("base64"),
            },
          },
          {
            text:
              language === "te"
                ? farmerText
                  ? `${farmerText}\n\nఈ మొక్క/పంట చిత్రాన్ని విశ్లేషించి, సాధ్యమైన వ్యాధులు, తెగుళ్లు లేదా పోషక లోపాలను గుర్తించండి. తగిన చర్యలు మరియు నివారణ పద్ధతులను సిఫార్సు చేయండి.`
                  : "ఈ మొక్క/పంట చిత్రాన్ని విశ్లేషించి, సాధ్యమైన వ్యాధులు, తెగుళ్లు లేదా పోషక లోపాలను గుర్తించండి. తగిన చర్యలు మరియు నివారణ పద్ధతులను సిఫార్సు చేయండి."
                : farmerText
                  ? `${farmerText}\n\nPlease also analyze this plant/crop photograph and identify any possible diseases, pest infestations, or nutrient deficiencies. Provide recommended actions and preventive measures.`
                  : "Please analyze this plant/crop photograph and identify any possible diseases, pest infestations, or nutrient deficiencies. Provide recommended actions and preventive measures.",
          },
        ],
      },
    ],
    config: {
      systemInstruction,
      temperature: 0.2,
    },
  });

  const text = result.text?.trim() ?? "";
  if (!text) {
    return language === "te"
      ? "చిత్ర విశ్లేషణ నుండి స్పష్టమైన వివరాలు లభించలేదు. దయచేసి వ్యాధి లేదా తెగులు స్పష్టంగా కనిపించేలా దగ్గర నుండి మంచి వెలుతురులో మరొక ఫోటో తీసి అప్‌లోడ్ చేయండి."
      : "The image analysis could not identify distinct symptoms from this photograph. Please try uploading a clearer, well-lit close-up photograph of the affected leaves or stems.";
  }

  return text;
}
