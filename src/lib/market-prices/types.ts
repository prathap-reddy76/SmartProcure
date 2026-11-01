export interface MarketPriceFilters {
  state?: string;
  district?: string;
  marketName?: string;
  commodityName?: string;
  date?: Date;
}

export interface MarketData {
  name: string;
  type?: string;
  district?: string;
  state: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface MarketPriceData {
  marketName: string;
  district?: string;
  state: string;
  commodityName: string;
  variety?: string;
  grade?: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  priceUnit: string;
  priceDate: Date;
}
