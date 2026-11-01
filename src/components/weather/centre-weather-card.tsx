"use client";

import React, { useState, useEffect } from "react";
import { WeatherData } from "@/lib/weather/types";
import { getWeatherForProcurementCentre } from "@/lib/weather/weather-service";
import {
  WeatherIcon,
  WindIcon,
  DropletIcon,
} from "@/components/ui/icons";

interface CentreWeatherCardProps {
  centreId: string;
  centreName: string;
}

export function CentreWeatherCard({ centreId, centreName }: CentreWeatherCardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadWeather() {
      try {
        setLoading(true);
        const res = await getWeatherForProcurementCentre(centreId);
        if (!isMounted) return;

        if (res.success && res.data) {
          setWeather(res.data);
        } else {
          setError(res.error || "Unable to fetch centre weather.");
        }
      } catch (err) {
        console.error("Centre weather error", err);
        if (isMounted) setError("Weather information temporarily unavailable.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadWeather();

    return () => {
      isMounted = false;
    };
  }, [centreId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 space-y-3 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded-sm w-36"></div>
          <div className="h-4 bg-gray-200 rounded-sm w-16"></div>
        </div>
        <div className="h-10 bg-gray-100 rounded-xl"></div>
        <div className="h-12 bg-gray-50 rounded-xl"></div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5 font-bold text-gray-700 mb-1">
          <WeatherIcon className="w-4 h-4 text-gray-400" />
          <span>Centre Weather Conditions</span>
        </div>
        <p>{error || "Weather information unavailable for this centre."}</p>
      </div>
    );
  }

  const { current, daily, alerts, rainSummary } = weather;
  const tomorrow = daily[1];
  const hasAlert = alerts.length > 0;
  const isRainy = rainSummary.todayRainMm > 2 || (tomorrow && tomorrow.precipitationProbability >= 50);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <WeatherIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 leading-tight">
              Weather at Procurement Centre
            </h3>
            <span className="text-[11px] text-gray-400">Current conditions & travel outlook</span>
          </div>
        </div>

        {hasAlert && (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
            Alert Active
          </span>
        )}
      </div>

      {/* Main Temperature & Conditions */}
      <div className="flex items-center justify-between bg-blue-50/50 p-3.5 rounded-xl border border-blue-100/70">
        <div>
          <span className="text-2xl font-black text-gray-900">
            {Math.round(current.temperature)}°C
          </span>
          <span className="text-xs text-gray-600 font-medium block">{current.condition}</span>
        </div>

        <div className="space-y-1 text-right text-[11px] text-gray-600">
          <div className="flex items-center justify-end gap-1">
            <DropletIcon className="w-3 h-3 text-blue-500" />
            <span>{current.humidity}% Humidity</span>
          </div>
          <div className="flex items-center justify-end gap-1">
            <WindIcon className="w-3 h-3 text-teal-600" />
            <span>{current.windSpeed} km/h {current.windDirection}</span>
          </div>
        </div>
      </div>

      {/* Today & Tomorrow Outlook */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
          <span className="text-[10px] text-gray-400 font-bold block uppercase">Today&apos;s Rain</span>
          <span className="font-bold text-gray-800 block mt-0.5">
            {rainSummary.todayRainMm} mm
          </span>
          <span className="text-[11px] text-blue-700 font-semibold">
            {rainSummary.rainProbabilityToday}% chance
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
          <span className="text-[10px] text-gray-400 font-bold block uppercase">Tomorrow</span>
          <span className="font-bold text-gray-800 block mt-0.5">
            {tomorrow?.condition || "Partly Cloudy"}
          </span>
          <span className="text-[11px] text-blue-700 font-semibold">
            {tomorrow?.precipitationProbability ?? 0}% rain
          </span>
        </div>
      </div>

      {/* Farmer Travel Advisory */}
      <div
        className={`p-3 rounded-xl border text-xs leading-relaxed ${
          isRainy
            ? "bg-amber-50/80 border-amber-200 text-amber-900"
            : "bg-emerald-50/70 border-emerald-200 text-emerald-900"
        }`}
      >
        <span className="font-bold block mb-0.5">
          {isRainy ? "⚠️ Travel Caution:" : "✓ Travel Friendly:"}
        </span>
        {isRainy
          ? `Showers or wet roads expected near ${centreName}. Ensure grains or harvest are securely covered with tarpaulins before transit.`
          : `Dry and stable weather forecast around ${centreName}. Good conditions for transporting crops to the procurement yard.`}
      </div>
    </div>
  );
}
