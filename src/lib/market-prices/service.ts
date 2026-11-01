import { prisma as db } from "@/lib/prisma";
import { MarketPriceProvider } from "./provider";
import { AgmarknetProvider } from "./providers/agmarknet-provider";
import { DemoMarketPriceProvider } from "./providers/demo-provider";
import { MarketPriceFilters, MarketPriceData } from "./types";
import { PriceDataSource, Prisma } from "@prisma/client";

export class MarketPriceService {
  private provider: MarketPriceProvider;

  constructor(provider?: MarketPriceProvider) {
    if (provider) {
      this.provider = provider;
    } else if (process.env.DATAGOVIN_API_KEY || process.env.AGMARKNET_API_KEY) {
      this.provider = new AgmarknetProvider();
    } else {
      this.provider = new DemoMarketPriceProvider();
    }
  }

  /**
   * Tries to find matching crops in our database to link market prices to them.
   */
  private async findCropIdByName(commodityName: string): Promise<string | null> {
    const crop = await db.crop.findFirst({
      where: {
        OR: [
          { name: { equals: commodityName, mode: "insensitive" } },
          { nameTe: { equals: commodityName, mode: "insensitive" } },
        ],
      },
    });
    return crop?.id || null;
  }

  /**
   * Ensures a market exists in the database.
   */
  private async ensureMarket(name: string, state: string, district?: string) {
    let market = await db.market.findFirst({
      where: { name, state, district: district || null },
    });

    if (!market) {
      market = await db.market.create({
        data: {
          name,
          state,
          district,
          type: "APMC", // default assumption for demo
        },
      });
    }

    return market;
  }

  /**
   * Fetches latest prices, hitting the provider if cache is missing or stale.
   */
  async getLatestPrices(filters: MarketPriceFilters) {
    const targetDate = filters.date || new Date();
    targetDate.setHours(0, 0, 0, 0); // Normalize to start of day

    // Build DB query
    const whereClause: Prisma.MarketCropPriceWhereInput = {
      priceDate: targetDate,
    };

    const marketFilter: Prisma.MarketWhereInput = {};
    let hasMarketFilter = false;

    if (filters.state) {
      marketFilter.state = filters.state;
      hasMarketFilter = true;
    }
    if (filters.district) {
      marketFilter.district = filters.district;
      hasMarketFilter = true;
    }
    if (filters.marketName) {
      marketFilter.name = { contains: filters.marketName, mode: "insensitive" };
      hasMarketFilter = true;
    }

    if (hasMarketFilter) {
      whereClause.market = marketFilter;
    }
    
    if (filters.commodityName) {
      whereClause.commodityName = { contains: filters.commodityName, mode: "insensitive" };
    }

    // 1. Check DB for cached data
    const cachedData = await db.marketCropPrice.findMany({
      where: whereClause,
      include: {
        market: true,
        crop: true,
      },
    });

    // If we have data for this exact date from DB, return it (it's CACHED, ADMIN, or DEMO)
    if (cachedData.length > 0) {
      return cachedData;
    }

    // 2. Fetch from Provider
    let externalData: MarketPriceData[] = [];
    try {
      externalData = await this.provider.fetchPrices({
        ...filters,
        date: targetDate,
      });
    } catch (error) {
      console.error("Error fetching from MarketPriceProvider:", error);
      return []; // Return empty if provider fails and no cache exists
    }

    // 3. Normalize and Store into DB
    const savedRecords = [];
    const dataSource =
      this.provider.name === "AGMARKNET_GOV"
        ? PriceDataSource.LIVE
        : this.provider.name === "DEMO_PROVIDER"
        ? PriceDataSource.DEMO
        : PriceDataSource.CACHED;

    for (const data of externalData) {
      const market = await this.ensureMarket(data.marketName, data.state, data.district);
      const cropId = await this.findCropIdByName(data.commodityName);

      // Upsert to prevent duplicates if multiple requests happen concurrently
      const record = await db.marketCropPrice.create({
        data: {
          marketId: market.id,
          cropId,
          commodityName: data.commodityName,
          variety: data.variety,
          grade: data.grade,
          minPrice: data.minPrice,
          maxPrice: data.maxPrice,
          modalPrice: data.modalPrice,
          priceUnit: data.priceUnit,
          priceDate: targetDate,
          dataSource: dataSource,
        },
        include: {
          market: true,
          crop: true,
        },
      });

      savedRecords.push(record);
    }

    return savedRecords;
  }

  /**
   * Get price history for a specific commodity in a specific market
   */
  async getPriceHistory(marketId: string, commodityName: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await db.marketCropPrice.findMany({
      where: {
        marketId,
        commodityName: { equals: commodityName, mode: "insensitive" },
        priceDate: { gte: startDate },
      },
      orderBy: { priceDate: "asc" },
      include: {
        market: true,
      }
    });
  }
}

// Export singleton instance
export const marketPriceService = new MarketPriceService();
