import { registerTool } from "./tool-registry";
import { getWeatherForFarmerFarm } from "@/lib/weather/weather-service";
import { Type } from "@google/genai";

registerTool({
  declaration: {
    name: "get_weather",
    description: "Get the current weather and forecast for the farmer's registered location.",
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  },
  execute: async (input, farmerId) => {
    try {
      const result = await getWeatherForFarmerFarm();
      if (!result.success) {
        return { error: result.error || "Unable to fetch weather data." };
      }
      if (!result.hasFarm) {
        return { error: "No farm location registered to fetch weather for." };
      }
      return {
        location: result.locationName,
        current: result.data?.current,
        forecast: result.data?.daily?.slice(0, 3) // Only return 3 days to save tokens
      };
    } catch {
      return { error: "An error occurred fetching weather data." };
    }
  }
});
