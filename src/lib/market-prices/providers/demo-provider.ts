import { MarketPriceProvider } from "../provider";
import { MarketPriceData, MarketPriceFilters } from "../types";

export class DemoMarketPriceProvider extends MarketPriceProvider {
  readonly name = "DEMO_PROVIDER";

  async fetchPrices(filters: MarketPriceFilters): Promise<MarketPriceData[]> {
    // Return some mock data based on the requested date or today
    const date = filters.date || new Date();
    
    const commodities = filters.commodityName 
      ? [filters.commodityName]
      : ["Paddy", "Cotton", "Maize", "Chilli", "Tomato"];

    const markets = [
      { name: "Guntur APMC", district: "Guntur", state: "Andhra Pradesh" },
      { name: "Kurnool APMC", district: "Kurnool", state: "Andhra Pradesh" },
      { name: "Vijayawada Market", district: "NTR", state: "Andhra Pradesh" }
    ];

    const results: MarketPriceData[] = [];

    for (const market of markets) {
      if (filters.district && market.district !== filters.district) continue;
      if (filters.state && market.state !== filters.state) continue;
      if (filters.marketName && !market.name.toLowerCase().includes(filters.marketName.toLowerCase())) continue;

      for (const commodity of commodities) {
        // Deterministic baseline price for verified benchmark display
        let basePrice = 2180; // Standard Paddy MSP / benchmark
        if (commodity.toLowerCase().includes("cotton")) basePrice = 7120;
        if (commodity.toLowerCase().includes("chilli")) basePrice = 14500;
        if (commodity.toLowerCase().includes("tomato")) basePrice = 950;
        if (commodity.toLowerCase().includes("maize")) basePrice = 2090;

        const modalPrice = basePrice;
        const minPrice = Math.round(basePrice * 0.94);
        const maxPrice = Math.round(basePrice * 1.06);

        results.push({
          marketName: market.name,
          district: market.district,
          state: market.state,
          commodityName: commodity,
          variety: "Common",
          grade: "FAQ",
          minPrice,
          maxPrice,
          modalPrice,
          priceUnit: "Quintal",
          priceDate: date,
        });
      }
    }

    return results;
  }
}
