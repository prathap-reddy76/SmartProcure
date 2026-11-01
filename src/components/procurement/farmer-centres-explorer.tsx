"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { ProcurementCentreSummary } from "@/types/procurement";
import { calculateDistance, formatDistance } from "@/lib/distance";
import { ProcurementCentreCard } from "./procurement-centre-card";
import { MapWrapper } from "./map-wrapper";
import { FarmIcon, ProcurementIcon } from "@/components/ui/icons";

interface FarmerCentresExplorerProps {
  initialCentres: ProcurementCentreSummary[];
}

type ViewMode = "split" | "list" | "map";
type AvailabilityFilter = "ALL" | "AVAILABLE" | "LIMITED" | "FULL";
type SortOption = "DEFAULT" | "NEAREST" | "SLOTS";

export function FarmerCentresExplorer({ initialCentres }: FarmerCentresExplorerProps) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("ALL");
  const [sortOption, setSortOption] = useState<SortOption>("DEFAULT");

  // Geolocation state (strictly client-side in memory; never saved to DB)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Active/selected centre on map
  const [selectedCentreId, setSelectedCentreId] = useState<string | null>(null);

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Request browser location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coords);
        setSortOption("NEAREST"); // Automatically sort by nearest when location is found
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location permission denied. You can still search centres manually.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information is currently unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("Request to determine your location timed out.");
            break;
          default:
            setLocationError("Unable to detect your location.");
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

  const handleClearLocation = () => {
    setUserLocation(null);
    setLocationError(null);
    if (sortOption === "NEAREST") {
      setSortOption("DEFAULT");
    }
  };

  // Compute raw distance in km for each centre if user location is available
  const centresWithDistance = useMemo(() => {
    return initialCentres.map((centre) => {
      let distanceKm: number | null = null;
      if (
        userLocation &&
        centre.latitude !== null &&
        centre.longitude !== null &&
        !isNaN(centre.latitude) &&
        !isNaN(centre.longitude)
      ) {
        distanceKm = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          centre.latitude,
          centre.longitude
        );
      }
      return {
        ...centre,
        distanceKm,
        formattedDistance: distanceKm !== null ? formatDistance(distanceKm) : "",
      };
    });
  }, [initialCentres, userLocation]);

  // Distances dictionary for MapWrapper
  const distancesMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of centresWithDistance) {
      if (c.formattedDistance) {
        map[c.id] = c.formattedDistance;
      }
    }
    return map;
  }, [centresWithDistance]);

  // Filter & Search
  const filteredCentres = useMemo(() => {
    const query = search.trim().toLowerCase();

    return centresWithDistance.filter((centre) => {
      // Availability filter
      if (availabilityFilter !== "ALL") {
        if (centre.availabilityStatus !== availabilityFilter) {
          return false;
        }
      }

      // Search text filter
      if (!query) return true;

      const inName = centre.name.toLowerCase().includes(query);
      const inCode = centre.code.toLowerCase().includes(query);
      const inVillage = (centre.village || "").toLowerCase().includes(query);
      const inMandal = (centre.mandal || "").toLowerCase().includes(query);
      const inDistrict = (centre.district || "").toLowerCase().includes(query);
      const inAddress = (centre.address || "").toLowerCase().includes(query);
      const inCrops = centre.supportedCrops.some((crop) => crop.toLowerCase().includes(query));

      return inName || inCode || inVillage || inMandal || inDistrict || inAddress || inCrops;
    });
  }, [centresWithDistance, search, availabilityFilter]);

  // Sort
  const sortedCentres = useMemo(() => {
    const list = [...filteredCentres];

    if (sortOption === "NEAREST" && userLocation) {
      list.sort((a, b) => {
        if (a.distanceKm === null && b.distanceKm === null) return 0;
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    } else if (sortOption === "SLOTS") {
      list.sort((a, b) => (b.availableSlotsToday || 0) - (a.availableSlotsToday || 0));
    } else {
      // Default: active centres first, then alphabetical by name
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [filteredCentres, sortOption, userLocation]);

  // Scroll to selected card when selected on map
  useEffect(() => {
    if (selectedCentreId && cardRefs.current[selectedCentreId] && viewMode !== "map") {
      cardRefs.current[selectedCentreId]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedCentreId, viewMode]);

  return (
    <div className="space-y-5">
      {/* Search, GPS, and Controls Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by centre name, village, mandal, district, or crop..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/80 focus:bg-white text-xs text-gray-900 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Location Button */}
          <div className="flex items-center gap-2 shrink-0">
            {userLocation ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                  Location active
                </span>
                <button
                  type="button"
                  onClick={handleClearLocation}
                  className="px-2.5 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  title="Clear location"
                >
                  Clear
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs rounded-xl transition-colors shadow-2xs disabled:opacity-50"
              >
                {isLocating ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin text-blue-700" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Detecting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Use My Location</span>
                  </>
                )}
              </button>
            )}

            {/* View Mode Switcher */}
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setViewMode("split")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "split"
                    ? "bg-white text-gray-900 shadow-2xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                title="Split Map & List"
              >
                Split
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "map"
                    ? "bg-white text-gray-900 shadow-2xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                title="Map Only"
              >
                Map
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "list"
                    ? "bg-white text-gray-900 shadow-2xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                title="List Only"
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Location error message */}
        {locationError && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{locationError}</span>
            </div>
            <button
              type="button"
              onClick={() => setLocationError(null)}
              className="text-amber-800 font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filter and Sort Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 text-xs">
          {/* Availability Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-gray-400 font-semibold mr-1">Status:</span>
            {(
              [
                { id: "ALL", label: "All" },
                { id: "AVAILABLE", label: "Available" },
                { id: "LIMITED", label: "Limited Slots" },
                { id: "FULL", label: "Fully Booked" },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setAvailabilityFilter(filter.id)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  availabilityFilter === filter.id
                    ? "bg-green-700 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Sort Selection */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-semibold">Sort:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold py-1 px-2.5 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-green-600 text-xs"
            >
              <option value="DEFAULT">Name (A-Z)</option>
              <option value="NEAREST" disabled={!userLocation}>
                {userLocation ? "📍 Nearest to Me" : "Nearest (Enable Location)"}
              </option>
              <option value="SLOTS">Most Available Slots</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area based on ViewMode */}
      {viewMode === "map" && (
        <div className="h-[600px] w-full">
          <MapWrapper
            centres={sortedCentres}
            userLocation={userLocation}
            selectedCentreId={selectedCentreId}
            onSelectCentre={setSelectedCentreId}
            distances={distancesMap}
          />
        </div>
      )}

      {viewMode === "list" && (
        <div>
          {sortedCentres.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedCentres.map((centre) => (
                <div
                  key={centre.id}
                  ref={(el) => {
                    cardRefs.current[centre.id] = el;
                  }}
                >
                  <ProcurementCentreCard
                    centre={centre}
                    distance={centre.formattedDistance}
                    isSelected={centre.id === selectedCentreId}
                    onSelect={setSelectedCentreId}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200/90 p-12 text-center">
              <FarmIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900 mb-1">No matching centres found</h3>
              <p className="text-xs text-gray-500">
                Try adjusting your search criteria or resetting filters.
              </p>
            </div>
          )}
        </div>
      )}

      {viewMode === "split" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Centre Cards List */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-500 px-1">
              <span>
                Found <strong>{sortedCentres.length}</strong> centres
              </span>
              {userLocation && (
                <span className="text-blue-700 font-semibold">Distances calculated</span>
              )}
            </div>

            {sortedCentres.length > 0 ? (
              <div className="space-y-4 max-h-[720px] overflow-y-auto pr-1">
                {sortedCentres.map((centre) => (
                  <div
                    key={centre.id}
                    ref={(el) => {
                      cardRefs.current[centre.id] = el;
                    }}
                  >
                    <ProcurementCentreCard
                      centre={centre}
                      distance={centre.formattedDistance}
                      isSelected={centre.id === selectedCentreId}
                      onSelect={(id) => {
                        setSelectedCentreId(id);
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200/90 p-12 text-center">
                <ProcurementIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900 mb-1">No centres found</h3>
                <p className="text-xs text-gray-500">
                  Try clearing search filters to see all available procurement centres.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Interactive Map */}
          <div className="lg:col-span-6 sticky top-20 h-[520px] lg:h-[720px]">
            <MapWrapper
              centres={sortedCentres}
              userLocation={userLocation}
              selectedCentreId={selectedCentreId}
              onSelectCentre={setSelectedCentreId}
              distances={distancesMap}
            />
          </div>
        </div>
      )}
    </div>
  );
}
