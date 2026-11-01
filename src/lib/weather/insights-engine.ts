import {
  CurrentWeather,
  DailyForecast,
  RainSummary,
  FarmingInsight,
  CropAwareInsight,
} from "./types";

/**
 * Generates informational agricultural weather insights based on real meteorological parameters.
 * IMPORTANT: Strictly informational. Does not make clinical agronomic guarantees or disease diagnoses.
 */
export function generateFarmingInsights(
  current: CurrentWeather,
  daily: DailyForecast[],
  rainSummary: RainSummary
): FarmingInsight[] {
  const insights: FarmingInsight[] = [];

  const tomorrow = daily[1];
  const next3DaysRain = daily.slice(0, 3).reduce((acc, d) => acc + d.precipitationAmount, 0);

  // 1. Irrigation & Moisture Insight
  if (rainSummary.todayRainMm >= 15 || (tomorrow && tomorrow.precipitationAmount >= 15)) {
    insights.push({
      id: "irrigation-heavy-rain",
      type: "drainage",
      title: "Heavy Rainfall Expected",
      message:
        "Substantial rainfall is forecast. Consider clearing field drainage channels and postponing scheduled irrigation to prevent root waterlogging.",
      priority: "warning",
    });
  } else if (rainSummary.todayRainMm > 2 || (tomorrow && tomorrow.precipitationProbability >= 60)) {
    insights.push({
      id: "irrigation-moderate-rain",
      type: "irrigation",
      title: "Rain Likely — Adjust Irrigation",
      message:
        "Moderate rainfall or showers are expected. You may be able to reduce or delay scheduled canal or borewell watering.",
      priority: "info",
    });
  } else if (current.temperature >= 35 && rainSummary.rainExpectedNext7DaysMm < 5) {
    insights.push({
      id: "irrigation-heat-stress",
      type: "irrigation",
      title: "High Heat & Dry Period",
      message:
        "Temperatures are elevated with dry conditions. Consider irrigating during early morning or late evening hours to minimize evaporation losses.",
      priority: "warning",
    });
  } else if (rainSummary.rainExpectedNext7DaysMm === 0) {
    insights.push({
      id: "irrigation-dry-spell",
      type: "irrigation",
      title: "Dry Weather Forecast Ahead",
      message:
        "Dry conditions are expected over the coming days. Ensure critical vegetative or flowering crops have adequate soil moisture reserves.",
      priority: "info",
    });
  }

  // 2. Wind & Field Spraying Insight
  if (current.windSpeed >= 25) {
    insights.push({
      id: "wind-high",
      type: "spray",
      title: "Strong Winds — Avoid Foliar Spraying",
      message:
        `Wind speeds around ${Math.round(current.windSpeed)} km/h may cause significant spray drift. Postpone nutrient sprays or pest applications until wind subsides.`,
      priority: "warning",
    });
  } else if (current.windSpeed <= 12 && rainSummary.todayRainMm === 0) {
    insights.push({
      id: "spray-favorable",
      type: "spray",
      title: "Favorable Spraying Window",
      message:
        "Calm winds and dry conditions offer a suitable window for foliar feeding, fertilization, or manual crop inspections.",
      priority: "info",
    });
  }

  // 3. Harvesting & Field Operations
  if (next3DaysRain >= 20) {
    insights.push({
      id: "harvest-caution",
      type: "harvest",
      title: "Upcoming Wet Period — Plan Field Work",
      message:
        "Persistent showers are expected over the next few days. If you have matured crops nearing harvest, arrange protective tarpaulins and prepare storage.",
      priority: "warning",
    });
  } else if (daily.slice(0, 3).every((d) => d.precipitationProbability < 25)) {
    insights.push({
      id: "harvest-favorable",
      type: "harvest",
      title: "Favorable Field Work Weather",
      message:
        "Clear and stable weather forecast for the next 72 hours. Excellent conditions for harvesting, sun drying, threshing, and transport.",
      priority: "info",
    });
  }

  // Fallback general insight if list is short
  if (insights.length === 0) {
    insights.push({
      id: "general-fair",
      type: "general",
      title: "Stable Farming Conditions",
      message:
        "Moderate weather conditions observed. Continue standard agronomic practices and monitor local soil moisture.",
      priority: "info",
    });
  }

  return insights;
}

/**
 * Generates simple, informational relationships between registered farmer crops and weather.
 * Strictly informational foundation for future AI modules.
 */
export function generateCropAwareInsights(
  crops: string[],
  current: CurrentWeather,
  daily: DailyForecast[],
  rainSummary: RainSummary
): CropAwareInsight[] {
  if (!crops || crops.length === 0) return [];

  const results: CropAwareInsight[] = [];
  const normalizedCrops = crops.map((c) => c.toLowerCase());
  const hasHighRain = rainSummary.todayRainMm >= 15 || rainSummary.rainExpectedNext7DaysMm >= 35;
  const isHotAndDry = current.temperature >= 34 && rainSummary.rainExpectedNext7DaysMm < 5;
  const isWindy = current.windSpeed >= 22;

  for (const crop of normalizedCrops) {
    if (crop.includes("paddy") || crop.includes("rice")) {
      if (hasHighRain) {
        results.push({
          cropName: "Paddy",
          insight: "Heavy rainfall is forecast across your area.",
          recommendation:
            "Consider checking field bunds and overflow spillways so standing water does not submerge young tillers.",
        });
      } else if (isHotAndDry) {
        results.push({
          cropName: "Paddy",
          insight: "Warm and dry conditions expected.",
          recommendation:
            "Maintain a shallow standing water buffer (2–5 cm) during peak afternoon heat to regulate root temperatures.",
        });
      } else {
        results.push({
          cropName: "Paddy",
          insight: "Normal seasonal moisture conditions.",
          recommendation:
            "Maintain recommended ponding depth according to current tillering or panicle stage.",
        });
      }
    } else if (crop.includes("cotton")) {
      if (hasHighRain) {
        results.push({
          cropName: "Cotton",
          insight: "Wet weather and soil saturation forecast.",
          recommendation:
            "Ensure ridge-and-furrow drainage allows runoff; standing water can trigger square and boll shedding.",
        });
      } else if (current.humidity >= 80) {
        results.push({
          cropName: "Cotton",
          insight: "Elevated atmospheric humidity detected.",
          recommendation:
            "Humid weather may favor sap-sucking insects. Inspect the undersides of leaves during your regular scouting.",
        });
      } else {
        results.push({
          cropName: "Cotton",
          insight: "Favorable conditions for cotton vegetative growth.",
          recommendation:
            "Continue routine intercultural operations and boll monitoring.",
        });
      }
    } else if (crop.includes("groundnut") || crop.includes("peanut")) {
      if (isHotAndDry) {
        results.push({
          cropName: "Groundnut",
          insight: "Dry spell forecast in the region.",
          recommendation:
            "Ensure critical pegging and pod formation stages do not experience acute moisture deficit.",
        });
      } else if (hasHighRain) {
        results.push({
          cropName: "Groundnut",
          insight: "Frequent rainfall anticipated.",
          recommendation:
            "Ensure water does not pool in the pod zone to prevent fungal collar rot issues.",
        });
      } else {
        results.push({
          cropName: "Groundnut",
          insight: "Steady soil moisture conditions.",
          recommendation:
            "Ensure aeration around root zones during pod filling.",
        });
      }
    } else if (crop.includes("chilli") || crop.includes("chili") || crop.includes("pepper")) {
      if (hasHighRain || current.humidity >= 85) {
        results.push({
          cropName: "Chilli",
          insight: "High humidity and wet foliage conditions.",
          recommendation:
            "Persistent leaf wetness increases fungal susceptibility. Inspect crop once dry weather returns.",
        });
      } else {
        results.push({
          cropName: "Chilli",
          insight: "Adequate conditions for flowering and fruit set.",
          recommendation:
            "Monitor soil moisture and support fruit development.",
        });
      }
    } else if (crop.includes("maize") || crop.includes("corn")) {
      if (isWindy) {
        results.push({
          cropName: "Maize",
          insight: "Strong wind gusts forecast.",
          recommendation:
            "High winds can cause stalk lodging in tall vegetative or tasseling maize. Inspect exposed field edges.",
        });
      } else {
        results.push({
          cropName: "Maize",
          insight: "Stable conditions for maize growth.",
          recommendation:
            "Ensure balanced fertilization and maintain clean furrows.",
        });
      }
    } else if (crop.includes("pulse") || crop.includes("gram") || crop.includes("dal")) {
      if (hasHighRain) {
        results.push({
          cropName: "Pulses",
          insight: "Rainfall expected.",
          recommendation:
            "Pulses are sensitive to root asphyxiation; ensure immediate field drainage after heavy showers.",
        });
      } else {
        results.push({
          cropName: "Pulses",
          insight: "Dry, mild conditions favorable for pulses.",
          recommendation:
            "Check for pod borers during flowering and pod development.",
        });
      }
    }
  }

  return results;
}
