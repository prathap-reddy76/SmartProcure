import { registerTool } from "./tool-registry";
import { marketPriceService } from "@/lib/market-prices/service";
import { Type } from "@google/genai";
import { z } from "zod";

const inputSchema = z.object({
  cropName: z.string(),
  state: z.string().optional(),
  district: z.string().optional()
});

registerTool({
  declaration: {
    name: "get_market_prices",
    description: "Get current market prices for crops. Important: always pass a crop name.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        cropName: { type: Type.STRING, description: "The name of the crop (e.g. Paddy, Cotton)" },
        state: { type: Type.STRING, description: "State filter" },
        district: { type: Type.STRING, description: "District filter" }
      },
      required: ["cropName"]
    }
  },
  execute: async (rawInput, farmerId) => {
    try {
      const input = inputSchema.parse(rawInput);
      const prices = await marketPriceService.getLatestPrices({
        commodityName: input.cropName,
        state: input.state,
        district: input.district
      });

      if (!prices || prices.length === 0) {
        return { message: "No recent market prices found for this crop in the specified area." };
      }

      // Return top 5 matches to keep tokens minimal
      return prices.slice(0, 5).map((p: any) => ({
        market: p.market?.name || p.marketName || "Unknown",
        district: p.market?.district || p.district || "Unknown",
        state: p.market?.state || p.state || "Unknown",
        commodity: p.commodityName,
        variety: p.variety,
        minPrice: p.minPrice && p.minPrice.toNumber ? p.minPrice.toNumber() : Number(p.minPrice || 0),
        maxPrice: p.maxPrice && p.maxPrice.toNumber ? p.maxPrice.toNumber() : Number(p.maxPrice || 0),
        modalPrice: p.modalPrice && p.modalPrice.toNumber ? p.modalPrice.toNumber() : Number(p.modalPrice || 0),
        priceUnit: p.priceUnit,
        date: (p.priceDate instanceof Date ? p.priceDate : new Date(p.priceDate)).toISOString().split("T")[0],
        dataSource: p.dataSource || "UNKNOWN"
      }));
    } catch {
      return { error: "An error occurred fetching market prices. Invalid parameters or service unavailable." };
    }
  }
});
