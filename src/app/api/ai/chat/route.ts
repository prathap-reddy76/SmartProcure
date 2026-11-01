import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { streamFarmingAdvice, getGeminiConfigStatus, ChatHistoryItem } from "@/lib/ai/gemini-service";
import { SupportedLanguage, CHAT_TRANSLATIONS } from "@/lib/ai/i18n";
import {
  isProductQuery,
  extractSearchTerms,
  searchAgriculturalProducts,
  AIProductRecord,
} from "@/lib/ai/product-search";
import {
  isMarketPriceQuery,
  isWeatherQuery,
  fetchMarketPriceContext,
  fetchWeatherContext,
  MarketPriceSummary,
  WeatherSummary,
} from "@/lib/ai/live-info-service";

export const dynamic = "force-dynamic";

/**
 * The product metadata prefix written as the first chunk of the stream.
 * The client reads this prefix, parses the JSON, then renders product cards
 * from the trusted server-sourced records — never from model-generated text.
 *
 * Format: PRODUCTS_JSON:<base64-encoded-JSON-array>\n
 */
const PRODUCTS_PREFIX = "PRODUCTS_JSON:";

export async function POST(req: Request) {
  try {
    // 1. Authentication Check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "You must be signed in to use the AI Farming Assistant." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Rate Limiting (20 requests per minute per user)
    const allowed = await rateLimit.check(`ai:chat:${userId}`, 20, 60000);
    if (!allowed) {
      return NextResponse.json(
        {
          error: "RATE_LIMIT_EXCEEDED",
          message: "You are asking questions too quickly. Please wait a few moments before trying again.",
        },
        { status: 429 }
      );
    }

    // 3. Parse & Validate Request Body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "INVALID_JSON", message: "Invalid request payload format." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "Request body must be an object." },
        { status: 400 }
      );
    }

    const { message, language: rawLang, history: rawHistory } = body as {
      message?: unknown;
      language?: unknown;
      history?: unknown;
    };

    if (typeof message !== "string" || message.trim() === "") {
      return NextResponse.json(
        { error: "MESSAGE_EMPTY", message: "Message cannot be empty." },
        { status: 400 }
      );
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length > 1000) {
      return NextResponse.json(
        { error: "MESSAGE_TOO_LONG", message: "Message is too long. Please keep questions under 1,000 characters." },
        { status: 400 }
      );
    }

    const language: SupportedLanguage = rawLang === "te" ? "te" : "en";

    const history: ChatHistoryItem[] = [];
    if (Array.isArray(rawHistory)) {
      for (const item of rawHistory) {
        if (
          item &&
          typeof item === "object" &&
          (item.role === "user" || item.role === "assistant") &&
          typeof item.content === "string"
        ) {
          history.push({ role: item.role, content: item.content.slice(0, 1000) });
        }
      }
    }

    // 4. Gemini API Key check
    const { isConfigured } = getGeminiConfigStatus();
    if (!isConfigured) {
      const translation = CHAT_TRANSLATIONS[language] || CHAT_TRANSLATIONS.en;
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY_NOT_CONFIGURED",
          message: `${translation.missingKeyError} ${translation.missingKeyHelp}`,
          isConfigured: false,
        },
        { status: 503 }
      );
    }

    // 5. Phase 2 & 5 — Product Intent Detection & Contextual DB Lookup
    let products: AIProductRecord[] = [];
    if (isProductQuery(trimmedMessage)) {
      // Passes conversation history to resolve contextual queries like "What fertilizer should I use?"
      const searchTerms = extractSearchTerms(trimmedMessage, history);
      if (searchTerms.length > 0) {
        // DB query is server-side only; errors return empty array (graceful)
        products = await searchAgriculturalProducts(searchTerms);
      }
    }

    // Phase 6 — Live Mandi Market Price & Weather Context (Zero Fabrication)
    let marketPrices: MarketPriceSummary[] = [];
    if (isMarketPriceQuery(trimmedMessage)) {
      marketPrices = await fetchMarketPriceContext(trimmedMessage, history);
    }

    let weather: WeatherSummary | null = null;
    if (isWeatherQuery(trimmedMessage)) {
      weather = await fetchWeatherContext(trimmedMessage, userId, history);
    }

    // 6. Generate and Stream AI Advice
    try {
      const aiStream = await streamFarmingAdvice({
        message: trimmedMessage,
        language,
        history,
        products: products.length > 0 ? products : undefined,
        marketPrices: marketPrices.length > 0 ? marketPrices : undefined,
        weather: weather || undefined,
      });

      const encoder = new TextEncoder();

      // Wrap the AI stream: prepend the products metadata chunk so the client
      // can parse validated product records from a trusted server source.
      const wrappedStream = new ReadableStream<Uint8Array>({
        async start(controller) {
          // Emit the product metadata chunk FIRST (before any AI text).
          // The client strips this prefix and renders product cards from it.
          if (products.length > 0) {
            const meta = JSON.stringify(products);
            controller.enqueue(encoder.encode(`${PRODUCTS_PREFIX}${meta}\n`));
          }

          const reader = aiStream.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } finally {
            reader.releaseLock();
            controller.close();
          }
        },
        cancel() {
          // Signal upstream stream to cancel if client disconnects
        },
      });

      return new Response(wrappedStream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
          "X-AI-Provider": "gemini",
          // Tell the client whether product cards, market prices, or weather are present
          "X-Has-Products": products.length > 0 ? "true" : "false",
          "X-Has-Market-Prices": marketPrices.length > 0 ? "true" : "false",
          "X-Has-Weather": weather ? "true" : "false",
        },
      });
    } catch (apiErr: unknown) {
      const errMessage = apiErr instanceof Error ? apiErr.message : "AI generation failed";
      console.error("Gemini API Error in route handler:", errMessage);

      if (errMessage.includes("429") || errMessage.includes("quota")) {
        return NextResponse.json(
          { error: "QUOTA_EXCEEDED", message: "The AI service is experiencing high traffic. Please try again in a few minutes." },
          { status: 429 }
        );
      }
      if (errMessage.includes("404") || errMessage.includes("NOT_FOUND") || errMessage.includes("no longer available")) {
        return NextResponse.json(
          { error: "MODEL_UNAVAILABLE", message: "The AI model is currently unavailable. Please set a valid GEMINI_MODEL in your environment or contact support." },
          { status: 503 }
        );
      }
      if (errMessage.includes("503") || errMessage.includes("UNAVAILABLE") || errMessage.includes("high demand")) {
        return NextResponse.json(
          { error: "SERVICE_OVERLOADED", message: "The AI service is temporarily overloaded. Please try again in a moment." },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: "AI_SERVICE_ERROR", message: "Unable to generate an answer at this moment. Please try again." },
        { status: 502 }
      );
    }
  } catch (error: unknown) {
    console.error("AI Chat API Unexpected Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
