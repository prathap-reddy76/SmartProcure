import { MarketPriceData, MarketPriceFilters } from "./types";

export abstract class MarketPriceProvider {
  /**
   * Unique name of the provider (e.g., 'GOV_DATA_PORTAL', 'DEMO_PROVIDER')
   */
  abstract readonly name: string;

  /**
   * Fetch market prices based on provided filters.
   * Providers should return normalized data.
   */
  abstract fetchPrices(filters: MarketPriceFilters): Promise<MarketPriceData[]>;
}
