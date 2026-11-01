"use client";

/**
 * SmartProcure Weather — Phase 7: Location-Based Weather Card for Farmer Home Dashboard
 *
 * Implements:
 * 1. Scenario A: Existing saved location (from localStorage preference or farmer profile/farm).
 * 2. Scenario B: Current device location ("Use My Current Location" via browser GPS on farmer click).
 * 3. Scenario C: Manual location search & resolution via Open-Meteo Geocoding & AP Presets.
 * 4. Location Persistence: Saves to client localStorage and updates FarmerProfile via server action.
 * 5. All 14 required metrics (Temp, Feels-like, Humidity, Wind, Rain %, Rain mm, Max/Min, 3-day forecast, etc.).
 * 6. Zero fabrication: Shows "Weather information is temporarily unavailable." with retry if provider fails.
 * 7. Full English & Telugu internationalization with instant toggle.
 */

import React, { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { WeatherData } from "@/lib/weather/types";
import {
  getWeatherForFarmerFarm,
  getWeatherForCoordinates,
} from "@/lib/weather/weather-service";
import {
  searchLocations,
  reverseGeocode,
  saveFarmerWeatherLocation,
  GeocodedLocation,
} from "@/lib/weather/geocoding";
import {
  SupportedLanguage,
  CHAT_TRANSLATIONS,
} from "@/lib/ai/i18n";
import {
  WeatherIcon,
  SunIcon,
  CloudRainIcon,
  WindIcon,
  DropletIcon,
  AlertTriangleIcon,
} from "@/components/ui/icons";

const WEATHER_PREF_KEY = "smartprocure-weather-pref";
const LANG_PREF_KEY = "smartprocure-lang-pref";

interface SavedWeatherLocation {
  name: string;
  latitude: number;
  longitude: number;
  district?: string;
  state?: string;
}

export function FarmerDashboardWeatherCard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [language, setLanguage] = useState<SupportedLanguage>("en");
  const [, startTransition] = useTransition();

  // Location tracking
  const [locationName, setLocationName] = useState<string>("Current Location");
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [canSaveLocation, setCanSaveLocation] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Manual location search modal state
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodedLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Last-updated timestamp
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const t = CHAT_TRANSLATIONS[language];

  // Helper to format local Indian time
  const formatTime = (date: Date = new Date()): string => {
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Load weather for a given coordinate pair
  const fetchWeatherForLocation = useCallback(
    async (
      lat: number,
      lon: number,
      locName: string,
      isRefresh = false
    ) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const res = await getWeatherForCoordinates({
          latitude: lat,
          longitude: lon,
          locationName: locName,
          forceRefresh: isRefresh,
        });

        if (res.success && res.data) {
          setWeather(res.data);
          setLocationName(locName);
          setCoordinates({ latitude: lat, longitude: lon });
          setLastUpdated(formatTime());
          setError(null);
        } else {
          setError(t.weatherUnavailable);
        }
      } catch (err) {
        console.error("Dashboard weather fetch error:", err);
        setError(t.weatherUnavailable);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t.weatherUnavailable]
  );

  // Scenario A: Existing saved location on initial mount (zero auto-GPS prompt)
  useEffect(() => {
    let isMounted = true;

    // Load language preference
    const savedLang = localStorage.getItem(LANG_PREF_KEY) as SupportedLanguage | null;
    if (savedLang === "en" || savedLang === "te") {
      setLanguage(savedLang);
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === LANG_PREF_KEY && (e.newValue === "en" || e.newValue === "te")) {
        setLanguage(e.newValue);
      }
    };
    const handleCustom = (e: Event) => {
      const customEvent = e as CustomEvent<SupportedLanguage>;
      if (customEvent.detail === "en" || customEvent.detail === "te") {
        setLanguage(customEvent.detail);
      }
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("smartprocure-lang-change", handleCustom);

    async function loadSavedLocationWeather() {
      // 1. Check client localStorage preference
      try {
        const savedRaw = localStorage.getItem(WEATHER_PREF_KEY);
        if (savedRaw) {
          const parsed = JSON.parse(savedRaw) as SavedWeatherLocation;
          if (
            parsed &&
            typeof parsed.latitude === "number" &&
            typeof parsed.longitude === "number"
          ) {
            if (!isMounted) return;
            await fetchWeatherForLocation(
              parsed.latitude,
              parsed.longitude,
              parsed.name || "Saved Location"
            );
            return;
          }
        }
      } catch {
        // Continue to server farm location fallback
      }

      // 2. Fetch authenticated farmer's registered farm/profile location
      try {
        const farmRes = await getWeatherForFarmerFarm();
        if (!isMounted) return;

        if (farmRes.success && farmRes.data) {
          setWeather(farmRes.data);
          const name = farmRes.locationName || farmRes.data.current.locationName;
          setLocationName(name);
          setCoordinates({
            latitude: farmRes.data.current.latitude,
            longitude: farmRes.data.current.longitude,
          });
          setLastUpdated(formatTime());
          setLoading(false);
          return;
        }

        // 3. Fallback: Andhra Pradesh central hub Kurnool
        await fetchWeatherForLocation(15.8281, 78.0373, "Kurnool, Andhra Pradesh");
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load initial farm weather:", err);
        setError(t.weatherUnavailable);
        setLoading(false);
      }
    }

    loadSavedLocationWeather();

    return () => {
      isMounted = false;
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("smartprocure-lang-change", handleCustom);
    };
  }, [fetchWeatherForLocation, t.weatherUnavailable]);

  // Scenario B: Current Device Location ("Use My Current Location")
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError(t.gpsUnavailable);
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
          // Resolve human-readable place name
          const revRes = await reverseGeocode(lat, lon);
          const resolvedName = revRes.displayName || revRes.name || "Current GPS Location";

          await fetchWeatherForLocation(lat, lon, resolvedName, true);
          setCanSaveLocation(true);
          setSaveSuccessMessage(null);
        } catch (e) {
          console.error("Error retrieving GPS weather:", e);
          setError(t.weatherUnavailable);
        } finally {
          setIsLocating(false);
        }
      },
      (geoError) => {
        setIsLocating(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError(t.gpsPermissionDenied);
        } else {
          setError(t.gpsUnavailable);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 9000,
        maximumAge: 60000,
      }
    );
  };

  // Scenario C: Manual Location Search
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const res = await searchLocations(searchQuery.trim());
      if (res.success && res.data.length > 0) {
        setSearchResults(res.data);
      } else {
        setSearchError(t.noLocationsFound);
      }
    } catch (err) {
      console.error("Search error:", err);
      setSearchError(t.noLocationsFound);
    } finally {
      setIsSearching(false);
    }
  };

  // Farmer selects a location candidate
  const handleSelectLocationCandidate = async (loc: GeocodedLocation) => {
    setShowSearchModal(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);

    await fetchWeatherForLocation(loc.latitude, loc.longitude, loc.displayName, true);
    setCanSaveLocation(true);
    setSaveSuccessMessage(null);
  };

  // Save current location as default
  const handleSaveLocation = async () => {
    if (!coordinates) return;

    setIsSaving(true);
    try {
      // 1. Client localStorage
      const prefData: SavedWeatherLocation = {
        name: locationName,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      };
      localStorage.setItem(WEATHER_PREF_KEY, JSON.stringify(prefData));

      // 2. Persist to PostgreSQL FarmerProfile
      await saveFarmerWeatherLocation({
        name: locationName,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });

      setCanSaveLocation(false);
      setSaveSuccessMessage(t.locationSavedSuccess);
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (err) {
      console.error("Error saving location:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Manual Refresh Button
  const handleRefresh = () => {
    if (!coordinates) return;
    fetchWeatherForLocation(
      coordinates.latitude,
      coordinates.longitude,
      locationName,
      true
    );
  };

  // Language toggle
  const toggleLanguage = () => {
    const newLang: SupportedLanguage = language === "en" ? "te" : "en";
    setLanguage(newLang);
    localStorage.setItem(LANG_PREF_KEY, newLang);
    window.dispatchEvent(new CustomEvent("smartprocure-lang-change", { detail: newLang }));
  };

  // Icon renderer
  const renderWeatherIcon = (iconName: string, className = "w-7 h-7") => {
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

  // 1. Loading Skeleton State
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 rounded-md w-36"></div>
          <div className="h-4 bg-gray-200 rounded-md w-20"></div>
        </div>
        <div className="flex items-center gap-4 my-4">
          <div className="w-14 h-14 bg-gray-200 rounded-2xl shrink-0"></div>
          <div className="space-y-2 flex-1">
            <div className="h-7 bg-gray-200 rounded-md w-28"></div>
            <div className="h-3.5 bg-gray-200 rounded-md w-40"></div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-100">
          <div className="h-10 bg-gray-100 rounded-xl"></div>
          <div className="h-10 bg-gray-100 rounded-xl"></div>
          <div className="h-10 bg-gray-100 rounded-xl"></div>
          <div className="h-10 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // 2. Truthful Error / Unavailable State (Zero Fabrication)
  if (error || !weather) {
    return (
      <div className="bg-white rounded-2xl border border-amber-200/90 shadow-2xs p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <WeatherIcon className="w-5 h-5 text-amber-600" />
            <span>{t.weatherCardTitle}</span>
          </div>
          <button
            type="button"
            onClick={toggleLanguage}
            className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            {language === "en" ? "తెలుగు" : "English"}
          </button>
        </div>

        <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900">
          <p className="font-semibold">{error || t.weatherUnavailable}</p>
          <p className="text-[11px] text-amber-700 mt-1">
            Live meteorological data could not be reached. You may retry or select a district manually.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleRefresh}
            className="px-3.5 py-1.5 bg-green-700 text-white rounded-xl text-xs font-bold hover:bg-green-800 transition"
          >
            {t.retryButton}
          </button>
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={isLocating}
            className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition"
          >
            {isLocating ? t.gpsDetecting : t.useCurrentLocation}
          </button>
          <button
            type="button"
            onClick={() => setShowSearchModal(true)}
            className="px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-100 transition"
          >
            {t.changeLocation}
          </button>
        </div>
      </div>
    );
  }

  const { current, daily, rainSummary, alerts } = weather;
  const todayForecast = daily[0];
  // 3-day compact outlook (days 1, 2, 3)
  const compactForecast = daily.slice(1, 4);

  return (
    <div className="bg-gradient-to-br from-white via-white to-blue-50/40 rounded-2xl border border-blue-200/70 shadow-2xs p-4 sm:p-5 hover:border-blue-300 transition-all space-y-4">
      {/* 1. Header Bar: Location & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-gray-100">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-blue-950 font-bold text-sm sm:text-base">
            <WeatherIcon className="w-4 h-4 text-blue-600 shrink-0" />
            <h2 className="truncate font-black" title={locationName}>
              {locationName}
            </h2>
          </div>
          <p className="text-[11px] text-gray-500 font-medium">
            {t.weatherCardTitle} &bull; {lastUpdated ? `${t.updatedAtPrefix} ${lastUpdated}` : t.updatedJustNow}
          </p>
        </div>

        {/* Action Buttons: Language, Refresh, GPS, Change */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
            title="Toggle English / తెలుగు"
          >
            {language === "en" ? "తెలుగు" : "EN"}
          </button>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition disabled:opacity-50"
            title={t.refreshWeather}
            aria-label={t.refreshWeather}
          >
            <span className={`block text-xs ${refreshing ? "animate-spin" : ""}`}>🔄</span>
          </button>

          {/* Use My Current Location (GPS) */}
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 transition shadow-2xs disabled:opacity-60"
          >
            <span>📍</span>
            <span>{isLocating ? t.gpsDetecting : t.useCurrentLocation}</span>
          </button>

          {/* Manual Location Selection */}
          <button
            type="button"
            onClick={() => setShowSearchModal(true)}
            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] font-bold transition"
          >
            {t.changeLocation}
          </button>
        </div>
      </div>

      {/* Save Location Confirmation Banner */}
      {canSaveLocation && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between text-xs text-emerald-900">
          <span>Set <strong>{locationName}</strong> as your home dashboard weather location?</span>
          <button
            type="button"
            onClick={handleSaveLocation}
            disabled={isSaving}
            className="px-3 py-1 bg-emerald-700 text-white font-bold rounded-lg hover:bg-emerald-800 transition shrink-0 ml-2 shadow-2xs"
          >
            {isSaving ? "Saving..." : t.saveLocationAsDefault}
          </button>
        </div>
      )}

      {saveSuccessMessage && (
        <div className="bg-emerald-100 text-emerald-900 text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5">
          <span>✓</span>
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Active Alerts Badge if present */}
      {alerts && alerts.length > 0 && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-center gap-2">
          <AlertTriangleIcon className="w-4 h-4 text-red-600 shrink-0" />
          <span className="font-bold">{alerts[0].title}:</span>
          <span className="truncate">{alerts[0].description}</span>
        </div>
      )}

      {/* 2. Main Temperature & Condition Display */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-white border border-blue-100 shadow-2xs shrink-0">
            {renderWeatherIcon(current.icon, "w-10 h-10")}
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
                {Math.round(current.temperature)}°C
              </span>
              <span className="text-xs text-gray-500 font-medium">
                {t.feelsLikeLabel} {Math.round(current.feelsLike)}°C
              </span>
            </div>
            <p className="text-sm font-bold text-gray-800 mt-0.5">
              {current.condition}
            </p>
          </div>
        </div>

        {/* Today's Range & Rain Prob */}
        <div className="sm:text-right flex sm:flex-col justify-between items-center sm:items-end text-xs">
          <div>
            <span className="text-gray-400 font-bold block text-[10px] uppercase">
              {t.todayLabel} Min / Max
            </span>
            <span className="font-extrabold text-sm text-gray-800">
              {todayForecast?.minTemperature ?? 0}° / {todayForecast?.maxTemperature ?? 0}°C
            </span>
          </div>
          <div className="sm:mt-1">
            <span className="text-gray-400 font-bold block text-[10px] uppercase">
              {t.rainProbabilityLabel}
            </span>
            <span className="font-bold text-blue-700">
              💧 {rainSummary.rainProbabilityToday}%
              {current.precipitation > 0 && ` (${current.precipitation} mm)`}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Weather Metrics Bar (Humidity, Wind, Precipitation, Rain %) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-xl bg-white border border-blue-100/70 text-xs">
        <div className="text-center p-1">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">{t.humidityLabel}</span>
          <span className="font-extrabold text-gray-800 flex items-center justify-center gap-1 mt-0.5">
            <DropletIcon className="w-3.5 h-3.5 text-blue-500" />
            {current.humidity}%
          </span>
        </div>

        <div className="text-center p-1 border-l border-gray-100">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">{t.windSpeedLabel}</span>
          <span className="font-extrabold text-gray-800 flex items-center justify-center gap-1 mt-0.5">
            <WindIcon className="w-3.5 h-3.5 text-teal-600" />
            {current.windSpeed} km/h
          </span>
        </div>

        <div className="text-center p-1 sm:border-l border-gray-100">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">{t.precipitationLabel}</span>
          <span className="font-extrabold text-gray-800 block mt-0.5">
            {current.precipitation} mm
          </span>
        </div>

        <div className="text-center p-1 border-l border-gray-100">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">{t.rainProbabilityLabel}</span>
          <span className="font-extrabold text-blue-700 block mt-0.5">
            {rainSummary.rainProbabilityToday}%
          </span>
        </div>
      </div>

      {/* 4. Compact 3-Day Forecast Section */}
      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            {t.forecast3DayHeading}
          </span>
          <Link
            href="/farmer/weather"
            className="text-xs font-bold text-green-700 hover:text-green-800 inline-flex items-center gap-1 transition"
          >
            <span>{t.detailedForecastLink}</span>
            <span>&rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {compactForecast.map((day, idx) => (
            <div
              key={day.date || idx}
              className="bg-white rounded-xl border border-gray-200/80 p-2 text-center flex flex-col justify-between shadow-3xs"
            >
              <div>
                <span className="text-[11px] font-bold text-gray-700 block truncate">
                  {idx === 0 ? t.tomorrowLabel : day.dayName}
                </span>
                <div className="my-1 flex justify-center">
                  {renderWeatherIcon(day.icon, "w-5 h-5")}
                </div>
                <span className="text-[10px] text-gray-500 block truncate font-medium">
                  {day.condition}
                </span>
              </div>

              <div className="mt-1 pt-1 border-t border-gray-50">
                <span className="text-xs font-black text-gray-900 block">
                  {day.minTemperature}° / {day.maxTemperature}°C
                </span>
                <span className="text-[10px] font-bold text-blue-600 block">
                  💧 {day.precipitationProbability}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Manual Location Selection Modal */}
      {showSearchModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-location-title"
        >
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 id="modal-location-title" className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <span>📍</span>
                <span>{t.selectLocationHeading}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchResults([]);
                  setSearchError(null);
                }}
                className="text-gray-400 hover:text-gray-700 font-bold text-base p-1"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Search Input Form */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchLocationPlaceholder}
                className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-green-600"
                autoFocus
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2 bg-green-700 text-white rounded-xl text-xs font-bold hover:bg-green-800 transition shrink-0 disabled:opacity-50"
              >
                {isSearching ? t.searchingLocation : t.searchLocationButton}
              </button>
            </form>

            {/* Error or Not Found Notification */}
            {searchError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900">
                {searchError}
              </div>
            )}

            {/* Results List */}
            {searchResults.length > 0 && (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  {t.selectLocationHeading}
                </span>
                {searchResults.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleSelectLocationCandidate(loc)}
                    className="w-full text-left p-2.5 rounded-xl border border-gray-100 hover:border-green-300 hover:bg-green-50/50 transition flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-gray-900 block">{loc.name}</span>
                      <span className="text-[11px] text-gray-500">
                        {[loc.district, loc.state].filter(Boolean).join(", ")}
                      </span>
                    </div>
                    <span className="text-green-700 font-bold text-xs">Set &rarr;</span>
                  </button>
                ))}
              </div>
            )}

            {/* Quick Agricultural District Presets */}
            {searchResults.length === 0 && !searchError && (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Popular Andhra Pradesh Districts:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {["Kurnool", "Guntur", "Vijayawada", "Anantapur", "Tirupati", "Kadapa"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setSearchQuery(d);
                        startTransition(() => {
                          searchLocations(d).then((res) => {
                            if (res.success) setSearchResults(res.data);
                          });
                        });
                      }}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-semibold rounded-lg transition"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
