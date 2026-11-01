"use client";

import React, { useState } from "react";
import { WeatherData } from "@/lib/weather/types";
import { AP_AGRICULTURAL_LOCATIONS } from "@/lib/weather/location-presets";
import {
  getWeatherForCoordinates,
  getWeatherForFarmerFarm,
  getWeatherForProcurementCentre,
} from "@/lib/weather/weather-service";
import {
  WeatherIcon,
  SunIcon,
  CloudRainIcon,
  WindIcon,
  DropletIcon,
  AlertTriangleIcon,
  FarmIcon,
} from "@/components/ui/icons";

interface CentreOption {
  id: string;
  name: string;
  village: string | null;
  district: string | null;
}

interface FarmerWeatherDashboardProps {
  initialWeather: WeatherData | null;
  farmerCrops: string[];
  procurementCentres: CentreOption[];
}

export function FarmerWeatherDashboard({
  initialWeather,
  farmerCrops,
  procurementCentres,
}: FarmerWeatherDashboardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(initialWeather);
  const [loading, setLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "info" | "warning" | "success" | "error";
  } | null>(null);

  const [selectedSource, setSelectedSource] = useState<string>("default");

  // Handle "Use My Location" GPS
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setStatusMessage({
        text: "Geolocation is not supported by your browser. Please select a location manually.",
        type: "warning",
      });
      return;
    }

    setIsLocating(true);
    setStatusMessage({
      text: "Requesting your location from browser GPS...",
      type: "info",
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        setStatusMessage({
          text: "Location detected. Fetching agricultural weather...",
          type: "success",
        });

        setLoading(true);
        try {
          const res = await getWeatherForCoordinates({
            latitude,
            longitude,
            locationName: "Your Current Location (GPS)",
            crops: farmerCrops,
          });

          if (res.success && res.data) {
            setWeather(res.data);
            setSelectedSource("gps");
            setStatusMessage({
              text: "Weather updated for your current GPS location.",
              type: "success",
            });
          } else {
            setStatusMessage({
              text: res.error || "Unable to retrieve weather for your coordinates.",
              type: "error",
            });
          }
        } catch (e) {
          console.error(e);
          setStatusMessage({
            text: "Weather service is temporarily unavailable. Please try again later.",
            type: "error",
          });
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setStatusMessage({
              text: "Location permission was denied. You can select a district or centre manually.",
              type: "warning",
            });
            break;
          case error.POSITION_UNAVAILABLE:
            setStatusMessage({
              text: "Unable to determine your location. Please select a district manually.",
              type: "warning",
            });
            break;
          case error.TIMEOUT:
            setStatusMessage({
              text: "Location detection timed out. Please try again or choose a preset location.",
              type: "warning",
            });
            break;
          default:
            setStatusMessage({
              text: "Location error occurred. Please select a district manually.",
              type: "warning",
            });
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Handle "Use My Farm Location"
  const handleUseMyFarm = async () => {
    setLoading(true);
    setStatusMessage(null);
    setSelectedSource("farm");

    try {
      const res = await getWeatherForFarmerFarm();
      if (res.success && res.data) {
        setWeather(res.data);
        setStatusMessage({
          text: `Weather loaded for farm: ${res.locationName}`,
          type: "success",
        });
      } else {
        setStatusMessage({
          text: res.error || "Unable to determine your farm location. Add farm details in profile.",
          type: "warning",
        });
      }
    } catch (e) {
      console.error(e);
      setStatusMessage({
        text: "Weather information is temporarily unavailable.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle District Preset Selection
  const handleSelectDistrict = async (presetId: string) => {
    const preset = AP_AGRICULTURAL_LOCATIONS.find((p) => p.id === presetId);
    if (!preset) return;

    setLoading(true);
    setStatusMessage(null);
    setSelectedSource(presetId);

    try {
      const res = await getWeatherForCoordinates({
        latitude: preset.latitude,
        longitude: preset.longitude,
        locationName: `${preset.name} (${preset.district})`,
        crops: farmerCrops,
      });

      if (res.success && res.data) {
        setWeather(res.data);
      } else {
        setStatusMessage({
          text: res.error || "Weather information is temporarily unavailable.",
          type: "error",
        });
      }
    } catch (e) {
      console.error(e);
      setStatusMessage({
        text: "Weather service is temporarily unavailable.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Procurement Centre Selection
  const handleSelectCentre = async (centreId: string) => {
    if (!centreId) return;

    setLoading(true);
    setStatusMessage(null);
    setSelectedSource(`centre-${centreId}`);

    try {
      const res = await getWeatherForProcurementCentre(centreId);
      if (res.success && res.data) {
        setWeather(res.data);
        setStatusMessage({
          text: `Weather loaded for Procurement Centre: ${res.centreName}`,
          type: "success",
        });
      } else {
        setStatusMessage({
          text: res.error || "Unable to fetch procurement centre weather.",
          type: "error",
        });
      }
    } catch (e) {
      console.error(e);
      setStatusMessage({
        text: "Failed to load procurement centre weather.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const current = weather?.current;
  const daily = weather?.daily || [];
  const hourly = weather?.hourly || [];
  const rainSummary = weather?.rainSummary;
  const alerts = weather?.alerts || [];
  const farmingInsights = weather?.farmingInsights || [];
  const cropInsights = weather?.cropInsights || [];

  const renderWeatherIcon = (iconName: string, className = "w-6 h-6") => {
    switch (iconName) {
      case "sun":
        return <SunIcon className={`${className} text-amber-500`} />;
      case "rain":
      case "drizzle":
        return <CloudRainIcon className={`${className} text-blue-500`} />;
      case "thunderstorm":
        return <AlertTriangleIcon className={`${className} text-amber-600`} />;
      case "cloud":
      case "cloud-sun":
      case "fog":
      default:
        return <WeatherIcon className={`${className} text-gray-500`} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Location Selector Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <WeatherIcon className="w-4 h-4 text-green-700" />
              <span>Location Source</span>
            </h2>
            <p className="text-xs text-gray-500">
              Select your farm, GPS position, a regional agricultural district, or a procurement centre.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* GPS Button */}
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isLocating || loading}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                selectedSource === "gps"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
              } disabled:opacity-50`}
            >
              <span>📍</span>
              <span>{isLocating ? "Detecting GPS..." : "Use My Location"}</span>
            </button>

            {/* Farm Button */}
            <button
              type="button"
              onClick={handleUseMyFarm}
              disabled={loading}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                selectedSource === "farm"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
              } disabled:opacity-50`}
            >
              <FarmIcon className="w-3.5 h-3.5" />
              <span>My Farm</span>
            </button>
          </div>
        </div>

        {/* Dropdowns for Districts & Procurement Centres */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-100">
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
              Select Andhra Pradesh District
            </label>
            <select
              value={selectedSource.startsWith("centre") || selectedSource === "gps" || selectedSource === "farm" ? "" : selectedSource}
              onChange={(e) => handleSelectDistrict(e.target.value)}
              disabled={loading}
              className="w-full bg-gray-50 hover:bg-gray-100/80 border border-gray-200 text-gray-800 font-semibold py-2 px-3 rounded-xl text-xs focus:ring-2 focus:ring-green-600 focus:outline-hidden"
            >
              <option value="" disabled>
                -- Choose Agricultural District --
              </option>
              {AP_AGRICULTURAL_LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.district} District)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
              Procurement Centre Weather
            </label>
            <select
              value={selectedSource.startsWith("centre-") ? selectedSource.replace("centre-", "") : ""}
              onChange={(e) => handleSelectCentre(e.target.value)}
              disabled={loading || procurementCentres.length === 0}
              className="w-full bg-gray-50 hover:bg-gray-100/80 border border-gray-200 text-gray-800 font-semibold py-2 px-3 rounded-xl text-xs focus:ring-2 focus:ring-green-600 focus:outline-hidden"
            >
              <option value="" disabled>
                -- Select Procurement Centre --
              </option>
              {procurementCentres.map((c) => (
                <option key={c.id} value={c.id}>
                  🏢 {c.name} ({[c.village, c.district].filter(Boolean).join(", ")})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status or Alert Notification */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : statusMessage.type === "warning"
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : statusMessage.type === "error"
                ? "bg-red-50 text-red-800 border-red-200"
                : "bg-blue-50 text-blue-800 border-blue-200"
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-gray-500 hover:text-gray-800 font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Active Location Indicator */}
        {current && (
          <div className="flex items-center justify-between text-xs text-gray-600 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-600"></span>
              <span>
                Weather for: <strong className="text-gray-900">{current.locationName}</strong>
              </span>
            </div>
            <span className="text-[11px] text-gray-400">
              Updated {new Date(current.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200/90 shadow-2xs space-y-3">
          <div className="w-8 h-8 border-3 border-green-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-gray-600">Updating weather and agricultural forecast...</p>
        </div>
      ) : !weather || !current || !rainSummary ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-gray-200/90 shadow-2xs space-y-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <WeatherIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Weather Information Currently Unavailable</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Live weather data could not be retrieved from the meteorological provider right now. Please select another district above or try refreshing your location.
          </p>
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-green-700 text-white hover:bg-green-800 transition shadow-2xs"
          >
            <span>📍</span>
            <span>{isLocating ? "Detecting GPS..." : "Retry with My Location"}</span>
          </button>
        </div>
      ) : (
        <>
          {/* 2. Weather Alerts Banner (Part 12 & 13) */}
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 sm:p-5 rounded-2xl border flex items-start gap-3.5 shadow-2xs ${
                    alert.severity === "severe"
                      ? "bg-red-50 border-red-300 text-red-900"
                      : alert.severity === "warning"
                      ? "bg-amber-50 border-amber-300 text-amber-900"
                      : "bg-yellow-50 border-yellow-200 text-yellow-900"
                  }`}
                >
                  <AlertTriangleIcon
                    className={`w-6 h-6 shrink-0 mt-0.5 ${
                      alert.severity === "severe" ? "text-red-600" : "text-amber-600"
                    }`}
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold">{alert.title}</h3>
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-white/80 border border-current">
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed">{alert.description}</p>
                    <p className="text-[10px] text-gray-500 pt-1">Source: {alert.source}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2.5">
                <span className="text-base">✓</span>
                <span className="font-semibold">
                  No active severe weather alerts for this area.
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">Safe field conditions</span>
            </div>
          )}

          {/* 3. Current Weather & Rainfall Overview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Current Weather Card */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                    Current Temperature
                  </span>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
                      {Math.round(current.temperature)}°C
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      Feels like {Math.round(current.feelsLike)}°C
                    </span>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-1">
                    {renderWeatherIcon(current.icon, "w-7 h-7")}
                  </div>
                  <span className="text-xs font-bold text-gray-800">{current.condition}</span>
                </div>
              </div>

              {/* Detailed Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-100">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Humidity</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <DropletIcon className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-bold text-gray-900">{current.humidity}%</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Wind Speed</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <WindIcon className="w-4 h-4 text-teal-500" />
                    <span className="text-sm font-bold text-gray-900">
                      {current.windSpeed} km/h {current.windDirection}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Precipitation</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <CloudRainIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-bold text-gray-900">{current.precipitation} mm</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Pressure</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-sm font-bold text-gray-900">{current.pressure} hPa</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rain Forecast & Moisture Card (Part 11) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 rounded-2xl border border-blue-200/80 shadow-2xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                  <CloudRainIcon className="w-5 h-5 text-blue-600" />
                  <span>Rain Forecast & Moisture</span>
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  7-Day Outlook
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3.5 border border-blue-100 shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Today&apos;s Rain</span>
                  <span className="text-xl font-black text-gray-900 mt-1 block">
                    {rainSummary.todayRainMm} mm
                  </span>
                  <span className="text-[11px] text-blue-700 font-semibold">
                    {rainSummary.rainProbabilityToday}% chance
                  </span>
                </div>

                <div className="bg-white rounded-xl p-3.5 border border-blue-100 shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">7-Day Rain Total</span>
                  <span className="text-xl font-black text-gray-900 mt-1 block">
                    {rainSummary.rainExpectedNext7DaysMm} mm
                  </span>
                  <span className="text-[11px] text-gray-500">Accumulated</span>
                </div>
              </div>

              <div className="text-xs text-blue-900 bg-white/70 p-3 rounded-xl border border-blue-100/70 space-y-1">
                <span className="font-bold block">Rainy Periods Today:</span>
                {rainSummary.rainyPeriods.length > 0 ? (
                  <p className="text-[11px] text-gray-700">
                    Expected during: <strong>{rainSummary.rainyPeriods.join(", ")}</strong>
                  </p>
                ) : (
                  <p className="text-[11px] text-gray-500">
                    No significant rain showers predicted during daytime hours today.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 4. Agricultural Farming Insights (Part 14) */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FarmIcon className="w-5 h-5 text-green-700" />
                <span>Farming Weather Insights</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Practical weather-informed considerations for field operations, irrigation, and crop protection.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {farmingInsights.map((insight) => (
                <div
                  key={insight.id}
                  className={`p-4 rounded-xl border space-y-1.5 ${
                    insight.priority === "warning"
                      ? "bg-amber-50/70 border-amber-200 text-amber-900"
                      : "bg-green-50/50 border-green-200/80 text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {insight.type === "irrigation"
                        ? "💧"
                        : insight.type === "spray"
                        ? "💨"
                        : insight.type === "harvest"
                        ? "🌾"
                        : "🚜"}
                    </span>
                    <h4 className="text-xs font-bold">{insight.title}</h4>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{insight.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Crop-Aware Weather Insights (Part 15) */}
          {cropInsights.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-50/60 to-teal-50/40 rounded-2xl border border-emerald-200/80 shadow-2xs p-5 sm:p-6 space-y-4">
              <div>
                <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                  <span>🌾</span>
                  <span>Crop-Specific Advisory</span>
                </h3>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Informational considerations tailored to your registered farm crops ({farmerCrops.join(", ")}).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cropInsights.map((ci, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-emerald-100 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800">{ci.cropName}</span>
                      <span className="text-[10px] text-gray-400 font-semibold">Registered Crop</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-800">{ci.insight}</p>
                    <p className="text-xs text-gray-600 pt-1 border-t border-gray-50">{ci.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Hourly Forecast (Next 24 Hours) (Part 9) */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Hourly Forecast (Next 24 Hours)</h3>
                <p className="text-xs text-gray-500">Plan daily spray, irrigation, and field work schedules.</p>
              </div>
              <span className="text-xs font-semibold text-gray-400">Scroll &rarr;</span>
            </div>

            <div className="overflow-x-auto pb-3 pt-1">
              <div className="flex items-center gap-3 min-w-max">
                {hourly.map((h, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center justify-between p-3 rounded-xl bg-gray-50/70 hover:bg-green-50/40 border border-gray-200/70 w-24 shrink-0 transition-all text-center space-y-2"
                  >
                    <span className="text-[11px] font-bold text-gray-700">{h.time}</span>
                    <div className="my-1">{renderWeatherIcon(h.icon, "w-6 h-6")}</div>
                    <span className="text-sm font-black text-gray-900">{h.temperature}°C</span>
                    <div className="space-y-0.5 pt-1 border-t border-gray-100 w-full text-[10px]">
                      <span className="text-blue-600 font-semibold block">{h.precipitationProbability}% rain</span>
                      {h.precipitationAmount > 0 && (
                        <span className="text-gray-400 block">{h.precipitationAmount} mm</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 7. 7-Day Forecast (Part 10) */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">7-Day Agricultural Forecast</h3>
              <p className="text-xs text-gray-500">Longer term outlook for sowing, harvesting, and procurement travel.</p>
            </div>

            <div className="divide-y divide-gray-100">
              {daily.map((d, i) => (
                <div
                  key={i}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 px-2 rounded-xl transition-colors"
                >
                  <div className="w-32 shrink-0">
                    <span className="text-xs font-bold text-gray-900 block">{d.dayName}</span>
                    <span className="text-[11px] text-gray-400">{d.formattedDate}</span>
                  </div>

                  <div className="flex items-center gap-3 flex-1">
                    {renderWeatherIcon(d.icon, "w-5 h-5")}
                    <span className="text-xs text-gray-700 font-medium">{d.condition}</span>
                  </div>

                  <div className="flex items-center gap-6 text-xs shrink-0">
                    <div className="w-24 text-right">
                      {d.precipitationProbability > 0 ? (
                        <span className="text-blue-700 font-bold block">
                          💧 {d.precipitationProbability}%
                          {d.precipitationAmount > 0 && (
                            <span className="text-gray-400 font-normal"> ({d.precipitationAmount} mm)</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400">Dry</span>
                      )}
                    </div>

                    <div className="w-24 text-right font-mono font-bold text-gray-900">
                      <span className="text-gray-400">{d.minTemperature}°</span> /{" "}
                      <span>{d.maxTemperature}°C</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
