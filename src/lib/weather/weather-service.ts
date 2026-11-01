"use server";

import { WeatherProvider } from "./provider";
import { OpenMeteoProvider } from "./open-meteo-provider";
import { WeatherData, WeatherQueryParams } from "./types";
import { AP_AGRICULTURAL_LOCATIONS, findMatchingLocation } from "./location-presets";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Short-lived in-memory cache
interface CacheEntry {
  data: WeatherData;
  expiresAt: number;
}
const weatherCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const defaultProvider: WeatherProvider = new OpenMeteoProvider();

/**
 * Validates coordinate ranges.
 */
export async function validateCoordinates(
  lat: number | null | undefined,
  lon: number | null | undefined
): Promise<string | null> {
  if (lat === null || lat === undefined || lon === null || lon === undefined) {
    return "Latitude and longitude are required.";
  }
  if (isNaN(lat) || isNaN(lon)) {
    return "Coordinates must be valid numbers.";
  }
  if (lat < -90 || lat > 90) {
    return "Latitude must be between -90 and +90 degrees.";
  }
  if (lon < -180 || lon > 180) {
    return "Longitude must be between -180 and +180 degrees.";
  }
  return null;
}

/**
 * Primary server action to fetch weather for given coordinates.
 */
export async function getWeatherForCoordinates(
  params: WeatherQueryParams
): Promise<{ success: boolean; data?: WeatherData; error?: string }> {
  const coordError = await validateCoordinates(params.latitude, params.longitude);
  if (coordError) {
    return { success: false, error: coordError };
  }

  // Round coordinates to 2 decimal places (~1.1 km) for privacy & caching
  const roundedLat = Number(params.latitude.toFixed(2));
  const roundedLon = Number(params.longitude.toFixed(2));
  const cropsKey = (params.crops || []).sort().join(",");
  const cacheKey = `${roundedLat}_${roundedLon}_${cropsKey}`;

  const cached = weatherCache.get(cacheKey);
  const now = Date.now();
  if (!params.forceRefresh && cached && cached.expiresAt > now) {
    return {
      success: true,
      data: {
        ...cached.data,
        isCached: true,
      },
    };
  }

  try {
    const data = await defaultProvider.fetchWeather({
      ...params,
      latitude: roundedLat,
      longitude: roundedLon,
    });

    weatherCache.set(cacheKey, {
      data,
      expiresAt: now + CACHE_TTL_MS,
    });

    return { success: true, data };
  } catch (err: unknown) {
    console.error("Error fetching weather data:", err);
    const msg = err instanceof Error ? err.message : "Weather service is temporarily unavailable.";
    return { success: false, error: msg };
  }
}

/**
 * Fetches weather for the authenticated farmer's registered farm.
 */
export async function getWeatherForFarmerFarm(): Promise<{
  success: boolean;
  data?: WeatherData;
  locationName?: string;
  hasFarm: boolean;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, hasFarm: false, error: "Authentication required." };
  }

  const profile = await prisma.farmerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      farm: true,
      crops: true,
    },
  });

  if (!profile) {
    return {
      success: false,
      hasFarm: false,
      error: "Farmer profile not found.",
    };
  }

  const registeredCrops = profile.crops.map((c) => c.cropName);
  const farm = profile.farm;

  // Determine location name from farm or profile
  const targetLocation =
    farm?.village ||
    farm?.district ||
    profile.village ||
    profile.district ||
    "Kurnool";

  const matchedPreset =
    findMatchingLocation(targetLocation) ||
    (farm?.district ? findMatchingLocation(farm.district) : null) ||
    AP_AGRICULTURAL_LOCATIONS[0]; // fallback Kurnool

  const locationTitle = farm?.farmName
    ? `${farm.farmName} (${matchedPreset.name})`
    : `${matchedPreset.name}, ${matchedPreset.district}`;

  const res = await getWeatherForCoordinates({
    latitude: matchedPreset.latitude,
    longitude: matchedPreset.longitude,
    locationName: locationTitle,
    crops: registeredCrops,
  });

  if (!res.success || !res.data) {
    return {
      success: false,
      hasFarm: Boolean(farm),
      error: res.error || "Unable to fetch farm weather.",
    };
  }

  return {
    success: true,
    hasFarm: Boolean(farm),
    locationName: locationTitle,
    data: res.data,
  };
}

/**
 * Fetches weather for a specific procurement centre using Phase 17 coordinates.
 */
export async function getWeatherForProcurementCentre(
  centreId: string
): Promise<{
  success: boolean;
  data?: WeatherData;
  centreName?: string;
  error?: string;
}> {
  const centre = await prisma.procurementCentre.findUnique({
    where: { id: centreId },
    select: {
      id: true,
      name: true,
      code: true,
      village: true,
      district: true,
      latitude: true,
      longitude: true,
    },
  });

  if (!centre) {
    return { success: false, error: "Procurement centre not found." };
  }

  let lat = centre.latitude;
  let lon = centre.longitude;

  // If coordinates are missing on the centre record, fallback to district preset
  if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
    const preset = findMatchingLocation(centre.district || centre.village || centre.name);
    if (preset) {
      lat = preset.latitude;
      lon = preset.longitude;
    } else {
      lat = 15.8281; // Kurnool APMC
      lon = 78.0373;
    }
  }

  const centreLabel = `${centre.name} (${[centre.village, centre.district].filter(Boolean).join(", ")})`;

  const res = await getWeatherForCoordinates({
    latitude: lat,
    longitude: lon,
    locationName: centreLabel,
  });

  if (!res.success || !res.data) {
    return {
      success: false,
      centreName: centre.name,
      error: res.error || "Unable to fetch procurement centre weather.",
    };
  }

  return {
    success: true,
    centreName: centre.name,
    data: res.data,
  };
}
