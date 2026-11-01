import { AIProvider, AIRequest, AIResponse } from "../types";

export class MockAIProvider implements AIProvider {
  name = "MOCK_PROVIDER";

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (request.intent === "WEATHER") {
      const weather = request.contextData?.weather;
      if (!weather) {
        return { text: "I don't currently have weather data for your location.", isMock: true, provider: "mock" };
      }
      return { 
        text: `### Current Weather (SmartProcure Data)\n\nTemperature: ${weather.current?.temperature_2m}°C\nWind Speed: ${weather.current?.wind_speed_10m} km/h\n\nBased on this available data, expect typical seasonal conditions.`, 
        isMock: true,
        provider: "mock" 
      };
    }

    if (request.intent === "MARKET_PRICE") {
      const markets = request.contextData?.marketPrices || [];
      if (markets.length === 0) {
        return { text: "I don't have current market-price data for that crop in your area.", isMock: true, provider: "mock" };
      }
      const p = markets[0];
      return {
        text: `### Market Price: ${p.commodityName} (SmartProcure Data)\n\nMarket: **${p.market?.name || p.marketName}**\nModal price: **₹${p.modalPrice}/${p.priceUnit}**\nRange: ₹${p.minPrice}–₹${p.maxPrice}/${p.priceUnit}\n\n*Source: ${p.dataSource}*\n*Updated: ${new Date(p.priceDate).toLocaleDateString()}*`,
        isMock: true,
        provider: "mock"
      };
    }

    if (request.intent === "PROCUREMENT" || request.intent === "PROCUREMENT_PAYMENT") {
      const bookings = request.contextData?.procurementBookings || [];
      if (bookings.length === 0) {
        return { text: "I couldn't find an active procurement record or booking for you.", isMock: true, provider: "mock" };
      }
      const b = bookings[0];
      return {
        text: `### Your Procurement Status\n\nBooking Number: **${b.bookingNumber}**\nStatus: **${b.status}**\nToken: ${b.tokenNumber || "Not assigned yet"}\n\n*SmartProcure Procurement Record*`,
        isMock: true,
        provider: "mock"
      };
    }

    if (request.intent === "ORDERS") {
      const orders = request.contextData?.orders || [];
      if (orders.length === 0) {
        return { text: "You don't have any recent orders.", isMock: true, provider: "mock" };
      }
      return {
        text: `### Your Recent Order\n\nOrder #: **${orders[0].orderNumber}**\nStatus: **${orders[0].status}**\nTotal: ₹${orders[0].totalAmount}\n\n*SmartProcure Orders Record*`,
        isMock: true,
        provider: "mock"
      };
    }

    if (request.intent === "FARM" || request.intent === "CROP_ADVISORY") {
      const crops = request.contextData?.farmer?.crops || [];
      if (crops.length === 0) {
        return { text: "I see you haven't added any crops to your profile yet. Once added, I can give general information about them.", isMock: true, provider: "mock" };
      }
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        text: `### Crop Advisory\n\nI see you are growing ${crops.map((c: any) => c.cropName).join(", ")}. \n\n*General agricultural guidance:* Ensure proper irrigation and monitor for common pests. I can give general information, but I don't have enough farm-specific data to make a specific recommendation.`,
        isMock: true,
        provider: "mock"
      };
    }

    return {
      text: "I am the SmartProcure AI Assistant (Running in Mock Mode). I can help you with your weather, market prices, and procurement status.",
      isMock: true,
      provider: "mock"
    };
  }
}
