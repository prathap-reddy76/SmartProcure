import { prisma as db } from "@/lib/prisma";
import { IntentType } from "./types";
import { marketPriceService } from "@/lib/market-prices/service";

export async function buildFarmerContext(farmerId: string, intent: IntentType) {
  const context: Record<string, unknown> = {};

  // Always fetch base farmer profile to know state/district/location
  const profile = await db.farmerProfile.findUnique({
    where: { userId: farmerId },
    include: { 
      farm: true,
      crops: true 
    }
  });

  if (!profile) return context;
  context.farmer = {
    state: profile.state,
    district: profile.district,
    farm: profile.farm,
    crops: profile.crops,
  };

  switch (intent) {
    case "WEATHER":
      // Attempt to get weather if we have lat/lng. 
      // In Phase 18, lat/lng might not be stored in DB, so we might not have it.
      // We will try fetching generic weather based on coords if available, or just return empty.
      // Assuming UI can pass coords or we rely on some generic fallback.
      // For safe server-side, we can just say weather needs coords passed from client, 
      // but let's see if we can get it from profile location. 
      break;

    case "MARKET_PRICE":
    case "MARKET_COMPARISON":
      if (profile.crops && profile.crops.length > 0) {
        // Fetch prices for their first crop as default context
        const prices = await marketPriceService.getLatestPrices({
          commodityName: profile.crops[0].cropName,
          state: profile.state || "Andhra Pradesh",
        });
        context.marketPrices = prices;
      }
      break;

    case "PROCUREMENT":
    case "PROCUREMENT_PAYMENT":
    case "PROCUREMENT_QUALITY":
      const bookings = await db.procurementBooking.findMany({
        where: { farmerId },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: {
          centre: true,
          crop: true,
          weighing: true,
          qualityInspection: true,
          payment: true,
        }
      });
      context.procurementBookings = bookings;
      break;

    case "ORDERS":
    case "PRODUCTS":
      const orders = await db.order.findMany({
        where: { userId: farmerId },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { items: true }
      });
      context.orders = orders;
      break;
      
    case "FARM":
    case "CROP_ADVISORY":
    case "GENERAL_AGRICULTURE":
      // Profile crops already included
      break;
  }

  return context;
}
