"use server";

/**
 * SmartProcure Weather — Phase 7: Geocoding & Location Resolution Service
 *
 * Provides:
 * 1. searchLocations(): Resolves village, town, or district names to geographic coordinates.
 *    - Prioritizes known Andhra Pradesh / Telangana agricultural presets.
 *    - Falls back to Open-Meteo Geocoding API for any Indian village or town.
 *    - Zero fabrication: returns empty array if no match is found; never substitutes a fake default city.
 * 2. reverseGeocode(): Maps GPS latitude/longitude to a human-readable place name.
 * 3. saveFarmerWeatherLocation(): Persists verified village/district in FarmerProfile without schema changes.
 */

import { AP_AGRICULTURAL_LOCATIONS, LocationPreset } from "./location-presets";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface GeocodedLocation {
  id: string;
  name: string;
  district?: string;
  state?: string;
  country: string;
  latitude: number;
  longitude: number;
  displayName: string;
}

/**
 * Validates coordinate ranges.
 */
function isValidCoord(lat: unknown, lon: unknown): boolean {
  if (typeof lat !== "number" || typeof lon !== "number") return false;
  if (isNaN(lat) || isNaN(lon)) return false;
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

/**
 * Searches for matching locations across Andhra Pradesh presets and Open-Meteo Geocoding API.
 */
export async function searchLocations(
  rawQuery: string
): Promise<{ success: boolean; data: GeocodedLocation[]; error?: string }> {
  const query = (rawQuery || "").trim();
  if (query.length < 2) {
    return { success: true, data: [] };
  }

  const normalized = query.toLowerCase();
  const results: GeocodedLocation[] = [];
  const seenIds = new Set<string>();

  // 1. Check local AP Agricultural Location presets first (instant, offline-capable)
  for (const preset of AP_AGRICULTURAL_LOCATIONS) {
    const nameMatch = preset.name.toLowerCase().includes(normalized);
    const distMatch = preset.district.toLowerCase().includes(normalized);
    if (nameMatch || distMatch) {
      const id = `preset-${preset.id}`;
      seenIds.add(id);
      results.push({
        id,
        name: preset.name,
        district: preset.district,
        state: preset.state,
        country: "India",
        latitude: preset.latitude,
        longitude: preset.longitude,
        displayName: `${preset.name}, ${preset.district}, ${preset.state}`,
      });
    }
  }

  // 2. Query Open-Meteo Geocoding API for broader Indian villages, mandals, and towns
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query
    )}&count=6&language=en&format=json`;

    const res = await fetch(url, {
      headers: { "User-Agent": "SmartProcure-App/1.0" },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json?.results)) {
        for (const item of json.results) {
          if (!isValidCoord(item.latitude, item.longitude)) continue;
          const id = `openmeteo-${item.id || `${item.latitude}_${item.longitude}`}`;
          if (seenIds.has(id)) continue;
          seenIds.add(id);

          const parts: string[] = [item.name];
          if (item.admin2 && !parts.includes(item.admin2)) parts.push(item.admin2);
          if (item.admin1 && !parts.includes(item.admin1)) parts.push(item.admin1);
          if (item.country && !parts.includes(item.country)) parts.push(item.country);

          results.push({
            id,
            name: item.name,
            district: item.admin2 || undefined,
            state: item.admin1 || undefined,
            country: item.country || "India",
            latitude: Number(item.latitude),
            longitude: Number(item.longitude),
            displayName: parts.join(", "),
          });
        }
      }
    }
  } catch (err) {
    // If external geocoder is unreachable, local preset matches are still returned
    console.warn("[Geocoding] Open-Meteo geocoding search unreachable:", err);
  }

  return { success: true, data: results };
}

/**
 * Reverse-geocodes coordinates into a human-readable place name.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<{
  success: boolean;
  name?: string;
  district?: string;
  state?: string;
  displayName?: string;
  error?: string;
}> {
  if (!isValidCoord(latitude, longitude)) {
    return { success: false, error: "Invalid coordinates provided." };
  }

  // 1. Check distance to known presets (Haversine approximation)
  for (const preset of AP_AGRICULTURAL_LOCATIONS) {
    const dLat = Math.abs(preset.latitude - latitude);
    const dLon = Math.abs(preset.longitude - longitude);
    // ~15 km delta threshold (0.13 degrees)
    if (dLat < 0.13 && dLon < 0.13) {
      return {
        success: true,
        name: preset.name,
        district: preset.district,
        state: preset.state,
        displayName: `${preset.name}, ${preset.district}`,
      };
    }
  }

  // 2. Query BigDataCloud reverse geocode client (free, client-safe, no API key required)
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const res = await fetch(url, {
      headers: { "User-Agent": "SmartProcure-App/1.0" },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data = await res.json();
      const placeName = data.locality || data.city || data.principalSubdivision || "Current Location";
      const district = data.city !== placeName ? data.city : data.principalSubdivision;
      const state = data.principalSubdivision || "Andhra Pradesh";

      const parts = [placeName];
      if (district && district !== placeName && !parts.includes(district)) parts.push(district);
      if (state && !parts.includes(state)) parts.push(state);

      return {
        success: true,
        name: placeName,
        district: district || undefined,
        state: state || undefined,
        displayName: parts.join(", "),
      };
    }
  } catch (err) {
    console.warn("[Geocoding] Reverse geocoding fetch failed:", err);
  }

  // Fallback to coordinates label if reverse geocoding is unavailable
  const fallbackLabel = `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`;
  return {
    success: true,
    name: fallbackLabel,
    displayName: fallbackLabel,
  };
}

/**
 * Saves verified weather location to the authenticated farmer's profile.
 * Reuses existing `village`, `district`, and `state` columns in PostgreSQL without migrations.
 */
export async function saveFarmerWeatherLocation(params: {
  name: string;
  district?: string;
  state?: string;
  latitude: number;
  longitude: number;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "You must be signed in to save your location." };
    }

    if (!isValidCoord(params.latitude, params.longitude)) {
      return { success: false, error: "Invalid coordinates." };
    }

    const userId = session.user.id;

    // Update FarmerProfile existing fields
    await prisma.farmerProfile.upsert({
      where: { userId },
      create: {
        userId,
        village: params.name.slice(0, 100),
        district: params.district ? params.district.slice(0, 100) : undefined,
        state: params.state ? params.state.slice(0, 100) : "Andhra Pradesh",
      },
      update: {
        village: params.name.slice(0, 100),
        district: params.district ? params.district.slice(0, 100) : undefined,
        state: params.state ? params.state.slice(0, 100) : "Andhra Pradesh",
      },
    });

    revalidatePath("/farmer/dashboard");
    revalidatePath("/farmer/weather");

    return { success: true, message: "Location saved successfully." };
  } catch (err) {
    console.error("[Geocoding] Failed to save farmer weather location:", err);
    return { success: false, error: "Unable to save location. Please try again." };
  }
}
