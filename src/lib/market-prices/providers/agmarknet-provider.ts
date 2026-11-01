/**
 * SmartProcure — AGMARKNET Live Mandi Price Provider
 *
 * Sourced from the Open Government Data (OGD) Platform India (data.gov.in)
 * Directorate of Marketing & Inspection (DMI), Ministry of Agriculture & Farmers Welfare.
 *
 * Endpoint: https://api.data.gov.in/resource/{RESOURCE_ID}
 * License: Open Government Data License – India (OGDL - India)
 * Update frequency: Daily wholesale arrivals reported by APMC market committees.
 */

import { MarketPriceProvider } from "../provider";
import { MarketPriceData, MarketPriceFilters } from "../types";

export const DEFAULT_AGMARKNET_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";

export interface AgmarknetRecord {
  state?: string;
  district?: string;
  market?: string;
  commodity?: string;
  variety?: string;
  grade?: string;
  arrival_date?: string;
  min_price?: string | number;
  max_price?: string | number;
  modal_price?: string | number;
  [key: string]: unknown;
}

export interface AgmarknetApiResponse {
  status?: string;
  total?: number;
  count?: number;
  limit?: string | number;
  offset?: string | number;
  records?: AgmarknetRecord[];
  message?: string;
}

/**
 * Parses Indian date strings ("DD/MM/YYYY" or "YYYY-MM-DD") into a Date object.
 */
export function parseAgmarknetDate(dateStr?: string): Date {
  if (!dateStr || typeof dateStr !== "string") return new Date();

  const trimmed = dateStr.trim();
  // Check DD/MM/YYYY
  const partsDmy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (partsDmy) {
    const day = parseInt(partsDmy[1], 10);
    const month = parseInt(partsDmy[2], 10) - 1;
    const year = parseInt(partsDmy[3], 10);
    return new Date(Date.UTC(year, month, day));
  }

  // Check YYYY-MM-DD
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return new Date();
}

/**
 * Safely parses price string or number to a valid positive number.
 */
export function parsePrice(val: unknown): number {
  if (typeof val === "number" && !isNaN(val)) return Math.max(0, val);
  if (typeof val === "string") {
    const cleaned = val.replace(/[^0-9.]/g, "");
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) return Math.max(0, parsed);
  }
  return 0;
}

export class AgmarknetProvider extends MarketPriceProvider {
  readonly name = "AGMARKNET_GOV";

  private apiKey: string | null;
  private resourceId: string;

  constructor(apiKey?: string, resourceId?: string) {
    super();
    this.apiKey =
      apiKey ||
      process.env.DATAGOVIN_API_KEY ||
      process.env.AGMARKNET_API_KEY ||
      null;
    this.resourceId =
      resourceId ||
      process.env.AGMARKNET_RESOURCE_ID ||
      DEFAULT_AGMARKNET_RESOURCE_ID;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async fetchPrices(filters: MarketPriceFilters): Promise<MarketPriceData[]> {
    if (!this.isConfigured()) {
      throw new Error(
        "DATAGOVIN_API_KEY is not configured. Please set DATAGOVIN_API_KEY in .env.local to enable live AGMARKNET mandi price data."
      );
    }

    const url = new URL(`https://api.data.gov.in/resource/${this.resourceId}`);
    url.searchParams.set("api-key", this.apiKey!);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "50");

    if (filters.state) {
      url.searchParams.set("filters[state.keyword]", filters.state);
    }
    if (filters.district) {
      url.searchParams.set("filters[district.keyword]", filters.district);
    }
    if (filters.commodityName) {
      url.searchParams.set("filters[commodity.keyword]", filters.commodityName);
    }
    if (filters.marketName) {
      url.searchParams.set("filters[market.keyword]", filters.marketName);
    }

    let res: Response;
    try {
      res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "SmartProcure-Agricultural-Assistant/1.0",
        },
        signal: AbortSignal.timeout(8000),
      });
    } catch (networkErr: unknown) {
      const msg = networkErr instanceof Error ? networkErr.message : "Network error";
      console.error("[AGMARKNET Provider] Network fetch failed:", msg);
      throw new Error(`Failed to connect to data.gov.in AGMARKNET service: ${msg}`);
    }

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          "data.gov.in API authentication failed. Please verify your DATAGOVIN_API_KEY."
        );
      }
      if (res.status === 429) {
        throw new Error(
          "data.gov.in rate limit exceeded. Please wait a few moments before requesting mandi prices again."
        );
      }
      throw new Error(`data.gov.in API returned HTTP status ${res.status}`);
    }

    let json: AgmarknetApiResponse;
    try {
      json = (await res.json()) as AgmarknetApiResponse;
    } catch {
      throw new Error("Invalid JSON response received from data.gov.in AGMARKNET API.");
    }

    const records = Array.isArray(json.records) ? json.records : [];
    const results: MarketPriceData[] = [];

    for (const r of records) {
      // Find properties case-insensitively
      const state = r.state || (r["State"] as string) || "Unknown";
      const district = r.district || (r["District"] as string) || undefined;
      const marketName = r.market || (r["Market"] as string) || "Unknown Market";
      const commodityName = r.commodity || (r["Commodity"] as string) || "Unknown Commodity";
      const variety = r.variety || (r["Variety"] as string) || undefined;
      const grade = r.grade || (r["Grade"] as string) || undefined;
      const arrivalDateStr = r.arrival_date || (r["Arrival_Date"] as string) || undefined;

      const minPrice = parsePrice(r.min_price ?? r["Min_Price"]);
      const maxPrice = parsePrice(r.max_price ?? r["Max_Price"]);
      const modalPrice = parsePrice(r.modal_price ?? r["Modal_Price"]);

      if (modalPrice <= 0 && minPrice <= 0 && maxPrice <= 0) {
        continue; // Skip records with zero or missing price
      }

      results.push({
        marketName,
        district,
        state,
        commodityName,
        variety: variety || "Normal",
        grade: grade || "FAQ",
        minPrice: minPrice || modalPrice,
        maxPrice: maxPrice || modalPrice,
        modalPrice: modalPrice || minPrice || maxPrice,
        priceUnit: "Quintal",
        priceDate: parseAgmarknetDate(arrivalDateStr),
      });
    }

    return results;
  }
}
