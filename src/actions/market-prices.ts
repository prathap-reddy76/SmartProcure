"use server";
import { getTodayAsUTCDate } from "@/lib/date-utils";

import { marketPriceService } from "@/lib/market-prices/service";
import { MarketPriceFilters } from "@/lib/market-prices/types";
import { prisma as db } from "@/lib/prisma";
import { AlertDirection } from "@prisma/client";

export async function getMarketPrices(filters: MarketPriceFilters) {
  try {
    const prices = await marketPriceService.getLatestPrices(filters);
    // Convert Decimal and Date to standard types for client serialization
    return {
      success: true,
      data: prices.map(p => ({
        ...p,
        minPrice: p.minPrice.toNumber(),
        maxPrice: p.maxPrice.toNumber(),
        modalPrice: p.modalPrice.toNumber(),
        priceDate: p.priceDate.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Error getting market prices:", error);
    return { success: false, error: "Failed to fetch market prices." };
  }
}

export async function getMarketPriceHistory(marketId: string, commodityName: string, days: number = 30) {
  try {
    const history = await marketPriceService.getPriceHistory(marketId, commodityName, days);
    return {
      success: true,
      data: history.map(p => ({
        ...p,
        minPrice: p.minPrice.toNumber(),
        maxPrice: p.maxPrice.toNumber(),
        modalPrice: p.modalPrice.toNumber(),
        priceDate: p.priceDate.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Error getting market price history:", error);
    return { success: false, error: "Failed to fetch market price history." };
  }
}

export async function getFarmerCropsMarketPrices(farmerId: string) {
  try {
    // 1. Get farmer's registered crops
    const farmerProfile = await db.farmerProfile.findUnique({
      where: { userId: farmerId },
      include: { crops: true },
    });

    if (!farmerProfile || farmerProfile.crops.length === 0) {
      return { success: true, data: [] };
    }

    const cropNames = farmerProfile.crops.map(c => c.cropName);
    
    // 2. Fetch prices for these crops in farmer's state/district if available
    const today = getTodayAsUTCDate();
    //
    
    // As a simplification, we fetch without district first, or we do multiple fetches
    const allPrices = [];
    for (const name of cropNames) {
      const prices = await marketPriceService.getLatestPrices({
        commodityName: name,
        state: farmerProfile.state || "Andhra Pradesh",
      });
      allPrices.push(...prices);
    }

    return {
      success: true,
      data: allPrices.map(p => ({
        ...p,
        minPrice: p.minPrice.toNumber(),
        maxPrice: p.maxPrice.toNumber(),
        modalPrice: p.modalPrice.toNumber(),
        priceDate: p.priceDate.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Error getting farmer crops market prices:", error);
    return { success: false, error: "Failed to fetch prices for your crops." };
  }
}

export async function createMarketPriceAlert(data: {
  userId: string;
  cropId: string;
  marketId?: string;
  thresholdPrice: number;
  direction: AlertDirection;
}) {
  try {
    const alert = await db.marketPriceAlert.create({
      data: {
        userId: data.userId,
        cropId: data.cropId,
        marketId: data.marketId || null,
        thresholdPrice: data.thresholdPrice,
        direction: data.direction,
      },
    });
    return { success: true, data: alert };
  } catch (error) {
    console.error("Error creating market price alert:", error);
    return { success: false, error: "Failed to create price alert." };
  }
}

export async function deleteMarketPriceAlert(alertId: string, userId: string) {
  try {
    await db.marketPriceAlert.delete({
      where: { id: alertId, userId: userId },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting market price alert:", error);
    return { success: false, error: "Failed to delete price alert." };
  }
}
