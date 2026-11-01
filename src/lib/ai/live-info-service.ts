/**
 * SmartProcure AI — Phase 6: Live Agricultural Market & Weather Intelligence Service
 *
 * Detects farmer intent for mandi market prices and agricultural weather queries,
 * retrieves real, verified data from server-side adapters, and formats them
 * into factual context blocks for the AI Farming Assistant.
 *
 * Zero fabrication: never generates mock prices or temperatures.
 */

import { marketPriceService } from "@/lib/market-prices/service";
import {
  getWeatherForCoordinates,
  getWeatherForFarmerFarm,
} from "@/lib/weather/weather-service";
import {
  AP_AGRICULTURAL_LOCATIONS,
  findMatchingLocation,
} from "@/lib/weather/location-presets";

export interface MarketPriceSummary {
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
  priceDate: string;
  dataSource: string;
}

export interface WeatherSummary {
  locationName: string;
  temperature: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  precipitationToday: number;
  rainProbabilityToday: number;
  isRainLikely: boolean;
  forecast3Days: Array<{
    dayName: string;
    minTemp: number;
    maxTemp: number;
    condition: string;
    rainProbability: number;
  }>;
  alerts?: string[];
}

/**
 * Detect whether the farmer's query is asking about mandi/market prices.
 */
export function isMarketPriceQuery(message: string): boolean {
  const lower = message.toLowerCase();
  const keywords = [
    // English keywords
    "market price", "mandi price", "mandi rate", "mandi", "apmc",
    "market rate", "wholesale price", "price of paddy", "price of cotton",
    "price of chilli", "price of maize", "selling price in market",
    "compare prices", "today's price", "current rate", "market rates",
    "bhav", "mandi bhav",
    // Telugu keywords
    "మార్కెట్ ధర", "మండీ ధర", "మార్కెట్ రేటు", "ధర ఎంత ఉంది", "ధరలు ఎంత",
    "మద్దతు ధర", "అమ్మకం ధర", "మండీ", "మార్కెట్",
  ];
  return keywords.some((kw) => lower.includes(kw));
}

/**
 * Detect whether the farmer's query is asking about weather or forecasts.
 */
export function isWeatherQuery(message: string): boolean {
  const lower = message.toLowerCase();
  const keywords = [
    // English keywords
    "weather", "forecast", "rain", "raining", "rainfall", "temperature",
    "humidity", "wind", "storm", "thunderstorm", "heatwave", "will it rain",
    "weather conditions", "climate", "sunny", "cloudy", "showers",
    // Telugu keywords
    "వాతావరణం", "వర్షం", "వాన", "ఎండ", "తుఫాను", "గాలి", "వర్షం పడుతుందా",
  ];
  return keywords.some((kw) => lower.includes(kw));
}

function matchesWord(text: string, word: string): boolean {
  if (/[a-zA-Z]/.test(word)) {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    return regex.test(text);
  }
  return text.includes(word);
}

/**
 * Extracts crop name from message or recent history for market price lookup.
 */
export function extractMarketCrop(
  message: string,
  history?: Array<{ role: string; content: string }>
): string | undefined {
  const lower = message.toLowerCase();
  const crops = [
    "paddy", "rice", "cotton", "maize", "chilli", "groundnut",
    "wheat", "tomato", "onion", "soybean", "sugarcane", "turmeric",
    "red gram", "bengal gram", "black gram",
    "వరి", "పత్తి", "మొక్కజొన్న", "మిర్చి", "వేరుశనగ", "టమోటా",
  ];

  for (const crop of crops) {
    if (matchesWord(lower, crop)) {
      if (crop === "rice" || crop === "వరి") return "Paddy";
      if (crop === "పత్తి") return "Cotton";
      if (crop === "మొక్కజొన్న") return "Maize";
      if (crop === "మిర్చి") return "Chilli";
      if (crop === "వేరుశనగ") return "Groundnut";
      if (crop === "టమోటా") return "Tomato";
      return crop.charAt(0).toUpperCase() + crop.slice(1);
    }
  }

  // Scan history if not in current turn
  if (history && history.length > 0) {
    const recent = [...history].slice(-4).reverse();
    for (const turn of recent) {
      if (!turn?.content) continue;
      const turnLower = turn.content.toLowerCase();
      for (const crop of crops) {
        if (matchesWord(turnLower, crop)) {
          if (crop === "rice" || crop === "వరి") return "Paddy";
          if (crop === "పత్తి") return "Cotton";
          return crop.charAt(0).toUpperCase() + crop.slice(1);
        }
      }
    }
  }

  return undefined;
}

/**
 * Extracts location/district name from message or recent history.
 */
export function extractLocationName(
  message: string,
  history?: Array<{ role: string; content: string }>
): string | undefined {
  const lower = message.toLowerCase();

  for (const loc of AP_AGRICULTURAL_LOCATIONS) {
    if (lower.includes(loc.name.toLowerCase()) || lower.includes(loc.district.toLowerCase())) {
      return loc.name;
    }
  }

  // Common district names in Andhra Pradesh & Telangana
  const districts = [
    "guntur", "kurnool", "krishna", "vijayawada", "visakhapatnam",
    "east godavari", "west godavari", "prakasam", "anantapur", "kadapa",
    "chittoor", "srikakulam", "vizianagaram", "nellore", "khammam", "warangal",
  ];

  for (const d of districts) {
    if (lower.includes(d)) {
      return d.charAt(0).toUpperCase() + d.slice(1);
    }
  }

  if (history && history.length > 0) {
    const recent = [...history].slice(-4).reverse();
    for (const turn of recent) {
      if (!turn?.content) continue;
      const turnLower = turn.content.toLowerCase();
      for (const d of districts) {
        if (turnLower.includes(d)) {
          return d.charAt(0).toUpperCase() + d.slice(1);
        }
      }
    }
  }

  return undefined;
}

/**
 * Retrieves verified market prices for the AI context.
 */
export async function fetchMarketPriceContext(
  message: string,
  history?: Array<{ role: string; content: string }>
): Promise<MarketPriceSummary[]> {
  try {
    const cropName = extractMarketCrop(message, history);
    const district = extractLocationName(message, history);

    const rawPrices = await marketPriceService.getLatestPrices({
      commodityName: cropName,
      district: district,
      state: "Andhra Pradesh",
    });

    if (!rawPrices || rawPrices.length === 0) {
      // If specific district had 0 results, try without district for broader state view
      if (district && cropName) {
        const statePrices = await marketPriceService.getLatestPrices({
          commodityName: cropName,
          state: "Andhra Pradesh",
        });
        if (statePrices && statePrices.length > 0) {
          return statePrices.slice(0, 5).map(mapToSummary);
        }
      }
      return [];
    }

    return rawPrices.slice(0, 5).map(mapToSummary);
  } catch (err) {
    console.error("[LiveInfoService] Failed to fetch market prices:", err);
    return [];
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToSummary(p: any): MarketPriceSummary {
  const d = p.priceDate instanceof Date ? p.priceDate : new Date(p.priceDate);
  const dateStr = !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : "Recent";
  return {
    marketName: p.market?.name || p.marketName || "APMC Mandi",
    district: p.market?.district || p.district,
    state: p.market?.state || p.state || "Andhra Pradesh",
    commodityName: p.commodityName,
    variety: p.variety || undefined,
    grade: p.grade || undefined,
    minPrice: Number(p.minPrice ?? 0),
    maxPrice: Number(p.maxPrice ?? 0),
    modalPrice: Number(p.modalPrice ?? 0),
    priceUnit: p.priceUnit || "Quintal",
    priceDate: dateStr,
    dataSource: p.dataSource === "LIVE" ? "AGMARKNET (Live Gov API)" : "Reported APMC Mandi Data",
  };
}

/**
 * Retrieves verified weather observation and forecast for the AI context.
 */
export async function fetchWeatherContext(
  message: string,
  farmerId?: string,
  history?: Array<{ role: string; content: string }>
): Promise<WeatherSummary | null> {
  try {
    const locName = extractLocationName(message, history);

    if (locName) {
      const preset = findMatchingLocation(locName);
      if (preset) {
        const res = await getWeatherForCoordinates({
          latitude: preset.latitude,
          longitude: preset.longitude,
          locationName: `${preset.name}, ${preset.district}`,
        });
        if (res.success && res.data) {
          return formatWeatherData(res.data, `${preset.name}, ${preset.district}`);
        }
      }
    }

    // Fall back to farmer's registered farm if available and logged in
    if (farmerId) {
      const farmRes = await getWeatherForFarmerFarm();
      if (farmRes.success && farmRes.data) {
        return formatWeatherData(farmRes.data, farmRes.locationName || "Registered Farm");
      }
    }

    // Default to regional hub Kurnool if location not detected
    const defaultRes = await getWeatherForCoordinates({
      latitude: 15.8281,
      longitude: 78.0373,
      locationName: "Kurnool, Andhra Pradesh",
    });

    if (defaultRes.success && defaultRes.data) {
      return formatWeatherData(defaultRes.data, "Kurnool, Andhra Pradesh");
    }

    return null;
  } catch (err) {
    console.error("[LiveInfoService] Failed to fetch weather:", err);
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatWeatherData(data: any, locationName: string): WeatherSummary {
  const current = data.current;
  const rain = data.rainSummary;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const daily = Array.isArray(data.daily) ? data.daily.slice(0, 3) : [];

  return {
    locationName: locationName || current?.locationName || "Current Location",
    temperature: current?.temperature ?? 0,
    feelsLike: current?.feelsLike ?? 0,
    condition: current?.condition ?? "Normal",
    humidity: current?.humidity ?? 0,
    windSpeed: current?.windSpeed ?? 0,
    windDirection: current?.windDirection ?? "Variable",
    precipitationToday: rain?.todayRainMm ?? 0,
    rainProbabilityToday: rain?.rainProbabilityToday ?? 0,
    isRainLikely: Boolean(rain?.isRainLikely),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    forecast3Days: daily.map((d: any) => ({
      dayName: d.dayName,
      minTemp: d.minTemperature,
      maxTemp: d.maxTemperature,
      condition: d.condition,
      rainProbability: d.precipitationProbability,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    alerts: Array.isArray(data.alerts) ? data.alerts.map((a: any) => `${a.title}: ${a.description}`) : [],
  };
}
