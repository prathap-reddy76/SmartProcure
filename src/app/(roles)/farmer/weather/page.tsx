import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import { getFarmerCrops } from "@/actions/farmer/crop-actions";
import { prisma } from "@/lib/prisma";
import {
  getWeatherForFarmerFarm,
  getWeatherForCoordinates,
} from "@/lib/weather/weather-service";
import { WeatherData } from "@/lib/weather/types";
import { FarmerWeatherDashboard } from "@/components/weather/farmer-weather-dashboard";
import { WeatherIcon } from "@/components/ui/icons";

export default async function FarmerWeatherPage() {
  await requireRole("FARMER");

  // Load farmer crops and active procurement centres in parallel
  const [cropsRes, centres] = await Promise.all([
    getFarmerCrops(),
    prisma.procurementCentre.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        village: true,
        district: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const cropNames = (cropsRes.crops || []).map((c) => c.cropName);

  // Fetch initial weather (prefer farmer's registered farm location)
  let initialWeatherData: WeatherData | null = null;
  const farmWeatherRes = await getWeatherForFarmerFarm();
  if (farmWeatherRes.success && farmWeatherRes.data) {
    initialWeatherData = farmWeatherRes.data;
  } else {
    const fallbackRes = await getWeatherForCoordinates({
      latitude: 15.8281,
      longitude: 78.0373,
      locationName: "Kurnool (Andhra Pradesh)",
      crops: cropNames,
    });
    if (fallbackRes.success && fallbackRes.data) {
      initialWeatherData = fallbackRes.data;
    }
  }

  // Truthful weather state: null when network/API is unavailable — zero fabrication
  const initialWeather: WeatherData | null = initialWeatherData;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-gray-500 flex items-center gap-1.5" aria-label="Breadcrumb">
        <Link href="/farmer/dashboard" className="hover:text-green-700">Dashboard</Link>
        <span>&rsaquo;</span>
        <span className="text-gray-800 font-bold">Agricultural Weather</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <WeatherIcon className="w-6 h-6 text-green-700" />
            <span>Weather & Agricultural Forecast</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time conditions, rainfall outlook, and practical guidance for farming and procurement travel.
          </p>
        </div>
      </div>

      {/* Main Interactive Weather Dashboard */}
      <FarmerWeatherDashboard
        initialWeather={initialWeather}
        farmerCrops={cropNames}
        procurementCentres={centres}
      />

      {/* Weather Data Attribution & Agricultural Advisory Notice */}
      <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 text-[11px] text-gray-500 space-y-1">
        <p className="font-semibold text-gray-700">Data Source & Agricultural Advisory Notice</p>
        <p>
          Weather data is provided via WMO-standard open meteorological observations (Open-Meteo). Conditions and rainfall probabilities are indicative forecasts and may vary across local microclimates. Plan critical field operations like spraying, fertilization, or harvesting with local field verification.
        </p>
      </div>
    </div>
  );
}
