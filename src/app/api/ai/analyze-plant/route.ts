/**
 * SmartProcure AI — Phase 3: Plant Disease Image Analysis
 *
 * POST /api/ai/analyze-plant
 *
 * Accepts a multipart/form-data request containing:
 *   - image: File (JPEG | PNG | WebP, max 5 MB)
 *   - language: "en" | "te"  (optional, defaults to "en")
 *
 * Returns a streaming text/plain response.
 * If relevant products exist in the DB the stream is prefixed with:
 *   PRODUCTS_JSON:<JSON-array>\n
 * followed by the Gemini analysis text (same protocol as /api/ai/chat).
 *
 * Security:
 *  - Requires an authenticated session.
 *  - Rate-limited to 5 image analyses per minute per user.
 *  - Image MIME type is validated from actual byte magic-number header.
 *  - Image size is capped at MAX_IMAGE_BYTES before reading into memory.
 *  - Image bytes are NEVER logged, stored, or persisted.
 *  - GEMINI_API_KEY is server-only — never exposed to the browser.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { analyzeDisease, getGeminiConfigStatus } from "@/lib/ai/gemini-service";
import { SupportedLanguage, CHAT_TRANSLATIONS } from "@/lib/ai/i18n";
import {
  extractSearchTerms,
  searchAgriculturalProducts,
  AIProductRecord,
} from "@/lib/ai/product-search";

export const dynamic = "force-dynamic";

/** Maximum accepted image size: 5 MB */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Allowed MIME types — validated by magic number, not client header */
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const PRODUCTS_PREFIX = "PRODUCTS_JSON:";

/**
 * Validates image bytes by inspecting their magic-number prefix.
 * Returns the correct MIME type, or null if unrecognised.
 */
function detectMimeType(buf: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  // WebP: RIFF....WEBP  (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf.length > 11 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return "image/webp";
  return null;
}

/**
 * Derive product search terms from the AI analysis text.
 * Matches disease/pest/deficiency patterns to input categories.
 */
function extractDiseaseSearchTerms(analysisText: string): string[] {
  const lower = analysisText.toLowerCase();
  const terms: string[] = [];

  // Fungal disease → fungicide
  if (
    lower.includes("fungal") || lower.includes("blast") || lower.includes("blight") ||
    lower.includes("rust") || lower.includes("mould") || lower.includes("mold") ||
    lower.includes("rot") || lower.includes("scorch") || lower.includes("spot") ||
    lower.includes("anthracnose") || lower.includes("smut") || lower.includes("wilt")
  ) terms.push("fungicide");

  // Pest / insect → pesticide
  if (
    lower.includes("pest") || lower.includes("insect") || lower.includes("aphid") ||
    lower.includes("thrip") || lower.includes("mite") || lower.includes("whitefly") ||
    lower.includes("borer") || lower.includes("caterpillar") || lower.includes("larva") ||
    lower.includes("weevil") || lower.includes("stem fly")
  ) terms.push("pesticide");

  // Bacterial → bactericide
  if (lower.includes("bacterial") || lower.includes("bacteria")) terms.push("bactericide");

  // Nutrient deficiency → fertilizer
  if (
    lower.includes("nitrogen") || lower.includes("deficiency") || lower.includes("yellowing") ||
    lower.includes("chlorosis") || lower.includes("nutrient") || lower.includes("stunted") ||
    lower.includes("pale")
  ) terms.push("fertilizer");

  // NPK-specific
  if (lower.includes("npk") || lower.includes("potassium") || lower.includes("phosphorus")) {
    terms.push("npk");
  }

  // Weed → herbicide
  if (lower.includes("weed") || lower.includes("weedicide") || lower.includes("herbicide")) {
    terms.push("herbicide");
  }

  // Crop names — for "suitable crops" matching
  const cropMap: Record<string, string> = {
    paddy: "paddy", rice: "paddy", cotton: "cotton", maize: "maize",
    wheat: "wheat", chilli: "chilli", groundnut: "groundnut",
    tomato: "tomato", soybean: "soybean", sugarcane: "sugarcane",
  };
  for (const [keyword, term] of Object.entries(cropMap)) {
    if (lower.includes(keyword)) terms.push(term);
  }

  // Also run Phase 2 extractSearchTerms on the analysis text for additional coverage
  const phase2Terms = extractSearchTerms(analysisText);

  return [...new Set([...terms, ...phase2Terms])].slice(0, 4);
}

export async function POST(req: Request) {
  try {
    // ── 1. Authentication ────────────────────────────────────────────
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "You must be signed in to use Plant Disease Analysis." },
        { status: 401 }
      );
    }
    const userId = session.user.id;

    // ── 2. Rate Limiting (5 analyses per minute per user) ────────────
    const allowed = await rateLimit.check(`ai:plant:${userId}`, 5, 60000);
    if (!allowed) {
      return NextResponse.json(
        {
          error: "RATE_LIMIT_EXCEEDED",
          message: "You are submitting images too quickly. Please wait a moment before trying again.",
        },
        { status: 429 }
      );
    }

    // ── 3. Content-Type guard ────────────────────────────────────────
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "INVALID_CONTENT_TYPE", message: "Request must be multipart/form-data." },
        { status: 400 }
      );
    }

    // ── 4. Parse multipart form ──────────────────────────────────────
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: "INVALID_FORM", message: "Could not parse the form data. Please try again." },
        { status: 400 }
      );
    }

    const imageFile = formData.get("image");
    const rawLang = formData.get("language");
    const language: SupportedLanguage = rawLang === "te" ? "te" : "en";
    // Optional farmer text accompanying the image (from the chat composer)
    const rawText = formData.get("text");
    const farmerText = typeof rawText === "string" ? rawText.trim().slice(0, 1000) : "";

    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json(
        { error: "NO_IMAGE", message: "No image file was provided." },
        { status: 400 }
      );
    }

    // ── 5. Size check ────────────────────────────────────────────────
    if (imageFile.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        {
          error: "IMAGE_TOO_LARGE",
          message: `Image exceeds the 5 MB limit (received ${(imageFile.size / 1024 / 1024).toFixed(1)} MB).`,
        },
        { status: 413 }
      );
    }

    if (imageFile.size === 0) {
      return NextResponse.json(
        { error: "IMAGE_EMPTY", message: "The uploaded image file is empty." },
        { status: 400 }
      );
    }

    // ── 6. Read bytes & validate MIME type via magic number ──────────
    const arrayBuffer = await imageFile.arrayBuffer();
    const imageBytes = Buffer.from(arrayBuffer);

    const detectedMime = detectMimeType(imageBytes);
    if (!detectedMime || !ALLOWED_MIME_TYPES.has(detectedMime)) {
      return NextResponse.json(
        {
          error: "INVALID_IMAGE_TYPE",
          message: "Unsupported image format. Please upload a JPEG, PNG, or WebP photograph.",
        },
        { status: 415 }
      );
    }

    // ── 7. Gemini API key check ──────────────────────────────────────
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

    // ── 8. Call Gemini vision analysis ───────────────────────────────
    let analysisText = "";
    try {
      analysisText = await analyzeDisease({ imageBytes, mimeType: detectedMime, language, farmerText });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("Gemini plant analysis error:", msg);

      if (msg.includes("429") || msg.includes("quota")) {
        return NextResponse.json(
          { error: "QUOTA_EXCEEDED", message: "The AI service is experiencing high traffic. Please try again shortly." },
          { status: 429 }
        );
      }
      if (msg.includes("404") || msg.includes("NOT_FOUND")) {
        return NextResponse.json(
          { error: "MODEL_UNAVAILABLE", message: "The AI model is currently unavailable." },
          { status: 503 }
        );
      }
      if (msg.includes("503") || msg.includes("UNAVAILABLE")) {
        return NextResponse.json(
          { error: "SERVICE_OVERLOADED", message: "The AI service is temporarily overloaded. Please try again." },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: "AI_SERVICE_ERROR", message: "Unable to analyze the image at this time. Please try again." },
        { status: 502 }
      );
    }

    // ── 9. DB product lookup based on analysis content ───────────────
    let products: AIProductRecord[] = [];
    if (analysisText) {
      const diseaseTerms = extractDiseaseSearchTerms(analysisText);
      if (diseaseTerms.length > 0) {
        products = await searchAgriculturalProducts(diseaseTerms);
      }
    }

    // ── 10. Stream response with optional PRODUCTS_JSON prefix ────────
    const encoder = new TextEncoder();

    const responseStream = new ReadableStream<Uint8Array>({
      start(controller) {
        // Emit validated product metadata FIRST (same protocol as /api/ai/chat)
        if (products.length > 0) {
          const meta = JSON.stringify(products);
          controller.enqueue(encoder.encode(`${PRODUCTS_PREFIX}${meta}\n`));
        }
        if (analysisText) {
          controller.enqueue(encoder.encode(analysisText));
        }
        controller.close();
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-AI-Provider": "gemini",
        "X-Has-Products": products.length > 0 ? "true" : "false",
        "X-Analysis-Language": language,
      },
    });
  } catch (error: unknown) {
    console.error("Plant Analysis API Unexpected Error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
