/**
 * SmartProcure AI — Phase 2: Server-side agricultural product retrieval.
 *
 * Queries real database records using the existing Prisma client and
 * the same isActive/stock rules as the marketplace.
 *
 * Returns a safe, validated, minimal data shape. Never exposes the full
 * product record or any seller credentials.
 */

import { prisma } from "@/lib/prisma";

/** Maximum products returned in a single AI recommendation set */
const MAX_PRODUCTS = 5;

/** Placeholder used when a product has no image */
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=600&q=80";

/**
 * Safe product record returned to the AI + UI layer.
 * All Decimal fields have been converted to JS numbers server-side.
 * No private seller data (phone, email, address) is included.
 */
export interface AIProductRecord {
  id: string;
  name: string;
  slug: string;
  price: number;
  unit: string | null;
  stock: number;
  inStock: boolean;
  description: string | null;
  suitableCrops: string | null;
  variety: string | null;
  packageSize: string | null;
  dosage: string | null;
  productType: string;
  categoryName: string;
  shopName: string;
  shopDistrict: string | null;
  shopState: string | null;
  imageUrl: string;
  /** Canonical farmer-facing product detail URL */
  detailUrl: string;
}

/**
 * Detect whether the farmer's message is asking about products/supplies.
 * Returns true if the message mentions purchasing, buying, availability,
 * or names agricultural input categories.
 */
export function isProductQuery(message: string): boolean {
  const lower = message.toLowerCase();
  const keywords = [
    // Purchase intent
    "buy", "purchase", "get", "order", "need", "want", "looking for",
    "where to buy", "price of", "how much", "cost of", "available",
    "stock", "shop", "store", "seller",
    // Agricultural inputs
    "fertilizer", "fertiliser", "urea", "npk", "dap", "potash",
    "pesticide", "insecticide", "fungicide", "herbicide", "weedicide",
    "seed", "seeds", "hybrid", "variety", "sapling",
    "crop protection", "spray", "chemical", "medicine",
    "agricultural tool", "farm equipment",
    // Telugu keywords
    "ఎరువు", "విత్తనం", "పురుగుమందు", "కొనాలి", "కొనడం", "వస్తువు",
    "ధర", "అందుబాటులో", "దుకాణం", "తెగులు మందు",
  ];
  return keywords.some((kw) => lower.includes(kw));
}

/**
 * Extract search terms from the farmer message for targeted DB queries.
 * Optionally incorporates conversation history to resolve contextual follow-ups
 * (e.g., "What fertilizer should I use?" after discussing paddy).
 * Strips common filler words and returns a concise keyword list.
 */
export function extractSearchTerms(
  message: string,
  history?: Array<{ role: string; content: string }>
): string[] {
  const lower = message.toLowerCase();

  // Named product/category keywords to try first
  const namedTerms: string[] = [];

  // Fertilizer types
  if (lower.includes("urea")) namedTerms.push("urea");
  if (lower.includes("npk")) namedTerms.push("npk");
  if (lower.includes("dap")) namedTerms.push("dap");
  if (lower.includes("potash") || lower.includes("mop")) namedTerms.push("potash");
  if (lower.includes("compost") || lower.includes("vermi")) namedTerms.push("compost");

  // Seeds
  if (lower.includes("seed") || lower.includes("seeds") || lower.includes("విత్తనం")) namedTerms.push("seed");
  if (lower.includes("hybrid")) namedTerms.push("hybrid");

  // Protection products
  if (lower.includes("pesticide") || lower.includes("insecticide") || lower.includes("పురుగుమందు"))
    namedTerms.push("pesticide");
  if (lower.includes("fungicide")) namedTerms.push("fungicide");
  if (lower.includes("herbicide") || lower.includes("weedicide")) namedTerms.push("herbicide");

  // Crop names — used to filter suitableCrops
  const cropTerms: string[] = [];
  const crops = ["paddy", "rice", "cotton", "maize", "wheat", "chilli", "groundnut", "soybean",
    "sugarcane", "tomato", "onion", "potato", "sorghum", "jowar", "bajra",
    "వరి", "పత్తి", "మొక్కజొన్న"];
  for (const crop of crops) {
    if (lower.includes(crop)) cropTerms.push(crop === "rice" ? "paddy" : crop);
  }

  // General category fallback from current message
  if (namedTerms.length === 0) {
    if (lower.includes("fertilizer") || lower.includes("fertiliser") || lower.includes("ఎరువు")) namedTerms.push("fertilizer");
    if (lower.includes("chemical") || lower.includes("spray") || lower.includes("medicine")) namedTerms.push("pesticide");
    if (lower.includes("tool") || lower.includes("equipment")) namedTerms.push("tool");
  }

  // Contextual History Resolution (Phase 5):
  // If the user has product intent (e.g. asks for fertilizer, spray, seeds, buy)
  // but didn't mention the crop in this turn, extract the crop from recent history.
  if (history && history.length > 0 && (namedTerms.length > 0 || isProductQuery(message))) {
    if (cropTerms.length === 0) {
      // Search the last few conversation turns in reverse order
      const recentTurns = [...history].slice(-4).reverse();
      for (const turn of recentTurns) {
        if (!turn || typeof turn.content !== "string") continue;
        const turnLower = turn.content.toLowerCase();
        for (const crop of crops) {
          if (turnLower.includes(crop) && !cropTerms.includes(crop === "rice" ? "paddy" : crop)) {
            cropTerms.push(crop === "rice" ? "paddy" : crop);
            break;
          }
        }
        if (cropTerms.length > 0) break;
      }
    }

    // If still no named terms but user said "what should I buy / order for this?"
    // check if history mentioned a disease/pest to infer category
    if (namedTerms.length === 0) {
      const recentTurns = [...history].slice(-4).reverse();
      for (const turn of recentTurns) {
        if (!turn || typeof turn.content !== "string") continue;
        const turnLower = turn.content.toLowerCase();
        if (turnLower.includes("fungal") || turnLower.includes("blast") || turnLower.includes("blight") || turnLower.includes("spot")) {
          namedTerms.push("fungicide");
          break;
        }
        if (turnLower.includes("pest") || turnLower.includes("insect") || turnLower.includes("aphid") || turnLower.includes("worm")) {
          namedTerms.push("pesticide");
          break;
        }
        if (turnLower.includes("fertilizer") || turnLower.includes("yellowing") || turnLower.includes("deficiency")) {
          namedTerms.push("fertilizer");
          break;
        }
      }
    }
  }

  return [...new Set([...namedTerms, ...cropTerms])].slice(0, 4);
}

/**
 * Query the database for agricultural products matching the search terms.
 * Respects the same isActive rules as the marketplace.
 * Never returns more than MAX_PRODUCTS records.
 * Handles DB errors gracefully by returning an empty array.
 */
export async function searchAgriculturalProducts(
  searchTerms: string[]
): Promise<AIProductRecord[]> {
  if (!searchTerms.length) return [];

  try {
    const orConditions = searchTerms.flatMap((term) => [
      { name: { contains: term, mode: "insensitive" as const } },
      { description: { contains: term, mode: "insensitive" as const } },
      { suitableCrops: { contains: term, mode: "insensitive" as const } },
      { variety: { contains: term, mode: "insensitive" as const } },
      { category: { name: { contains: term, mode: "insensitive" as const } } },
    ]);

    const rawProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: orConditions,
      },
      orderBy: [{ stock: "desc" }, { createdAt: "desc" }],
      take: MAX_PRODUCTS,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        unit: true,
        stock: true,
        description: true,
        suitableCrops: true,
        variety: true,
        packageSize: true,
        dosage: true,
        productType: true,
        category: { select: { name: true } },
        shop: { select: { name: true, district: true, state: true } },
        images: {
          take: 1,
          orderBy: { sortOrder: "asc" },
          select: { imageUrl: true },
        },
      },
    });

    return rawProducts.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price), // Safely convert Prisma Decimal → number
      unit: p.unit,
      stock: p.stock,
      inStock: p.stock > 0,
      description: p.description,
      suitableCrops: p.suitableCrops,
      variety: p.variety,
      packageSize: p.packageSize,
      dosage: p.dosage,
      productType: p.productType,
      categoryName: p.category.name,
      shopName: p.shop.name,
      shopDistrict: p.shop.district,
      shopState: p.shop.state,
      imageUrl: p.images[0]?.imageUrl || FALLBACK_IMAGE,
      detailUrl: `/farmer/marketplace/${p.slug || p.id}`,
    }));
  } catch (err) {
    // Log server-side only; never expose to client
    console.error("[AI Product Search] Database query failed:", err instanceof Error ? err.message : "unknown");
    return [];
  }
}
