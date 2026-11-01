"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { getFarmerMachineryListings } from "@/actions/machinery/machinery-actions";
import { formatDistance } from "@/lib/distance";
import {
  getMachineTypeFromCategory,
  MACHINE_TYPES,
} from "@/lib/machinery-specifications";

interface MachineryCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
}

interface MachineryCard {
  id: string;
  name: string;
  brand?: string | null;
  modelNumber?: string | null;
  horsepower?: number | null;
  fuelType?: string | null;
  condition: string;
  location: string;
  distanceKm?: number | null;
  supportsHourly: boolean;
  pricePerHour?: number | null;
  supportsDaily: boolean;
  pricePerDay?: number | null;
  supportsPerAcre: boolean;
  pricePerAcre?: number | null;
  securityDeposit: number;
  deliveryCharge: number;
  isAvailable: boolean;
  category: { id: string; name: string; slug?: string; icon?: string | null };
  specifications?: Record<string, unknown> | null;
  ownerName: string;
  images: string[];
}

interface MarketplaceClientProps {
  categories: MachineryCategory[];
  initialListings: MachineryCard[];
}

export function MachineryMarketplaceClient({
  categories,
  initialListings,
}: MarketplaceClientProps) {
  const [listings, setListings] = useState<MachineryCard[]>(initialListings);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCondition, setSelectedCondition] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [minHp, setMinHp] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [selectedMode, setSelectedMode] = useState<"ALL" | "HOURLY" | "DAILY" | "PER_ACRE">("ALL");
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "nearest" | "price_asc" | "price_desc">("newest");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFilteredListings();
  };

  const fetchFilteredListings = (override?: {
    cat?: string;
    condition?: string;
    brand?: string;
    minHp?: string;
    maxPrice?: string;
    mode?: "ALL" | "HOURLY" | "DAILY" | "PER_ACRE";
    sort?: "newest" | "nearest" | "price_asc" | "price_desc";
    loc?: { lat: number; lon: number };
  }) => {
    startTransition(async () => {
      const cat = override?.cat !== undefined ? override.cat : selectedCategory;
      const cond = override?.condition !== undefined ? override.condition : selectedCondition;
      const br = override?.brand !== undefined ? override.brand : selectedBrand;
      const hp = override?.minHp !== undefined ? override.minHp : minHp;
      const price = override?.maxPrice !== undefined ? override.maxPrice : maxPrice;
      const mode = override?.mode !== undefined ? override.mode : selectedMode;
      const sort = override?.sort !== undefined ? override.sort : sortBy;
      const loc = override?.loc !== undefined ? override.loc : userLocation;

      const res = await getFarmerMachineryListings({
        search: search.trim() || undefined,
        categoryId: cat || undefined,
        condition: cond ? (cond as "NEW" | "EXCELLENT" | "GOOD" | "FAIR") : undefined,
        brand: br.trim() || undefined,
        minHp: hp ? parseInt(hp) : undefined,
        maxPrice: price ? parseFloat(price) : undefined,
        rentalMode: mode === "ALL" ? undefined : mode,
        userLat: loc?.lat,
        userLon: loc?.lon,
        sortBy: sort,
        availableOnly: true,
      });

      if (res.success) {
        setListings(res.listings as unknown as MachineryCard[]);
      }
    });
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedCondition("");
    setSelectedBrand("");
    setMinHp("");
    setMaxPrice("");
    setSelectedMode("ALL");
    setSortBy("newest");
    fetchFilteredListings({
      cat: "",
      condition: "",
      brand: "",
      minHp: "",
      maxPrice: "",
      mode: "ALL",
      sort: "newest",
    });
  };

  const handleDetectLocation = () => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setUserLocation(loc);
          setSortBy("nearest");
          fetchFilteredListings({ loc, sort: "nearest" });
        },
        (err) => {
          console.warn("Geolocation permission denied or unavailable:", err.message);
          alert("Location access was denied or is unavailable. You can still filter by city or region in search.");
        }
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/farmer/dashboard"
              className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
            >
              &larr; Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">
            Agricultural Machinery Marketplace
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse verified tractors, rotavators, harvesters, and trucks with detailed specifications.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Link
            href="/farmer/machinery/bookings"
            className="px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white font-bold text-sm rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <span>🚜</span>
            <span>My Bookings</span>
          </Link>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 sm:p-5 space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by machine name, brand (Mahindra, John Deere), location..."
              className="w-full px-4 py-2.5 pl-10 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-green-600 bg-gray-50/50"
            />
            <span className="absolute left-3.5 top-3 text-gray-400 text-sm">🔍</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white font-bold text-sm rounded-xl transition-colors shrink-0 shadow-2xs cursor-pointer"
            >
              {isPending ? "Searching..." : "Search"}
            </button>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3.5 py-2.5 border rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                showAdvancedFilters
                  ? "bg-amber-50 border-amber-300 text-amber-900"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>⚙️ Filters</span>
              <span>{showAdvancedFilters ? "▲" : "▼"}</span>
            </button>

            <button
              type="button"
              onClick={handleDetectLocation}
              className="px-3.5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
              title="Find machinery near my GPS coordinates"
            >
              <span>📍</span>
              <span className="hidden md:inline">Near Me</span>
            </button>
          </div>
        </form>

        {/* Categories Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("");
              fetchFilteredListings({ cat: "" });
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors cursor-pointer ${
              selectedCategory === ""
                ? "bg-green-800 text-white shadow-2xs"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Categories ({listings.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                const newCat = selectedCategory === cat.id ? "" : cat.id;
                setSelectedCategory(newCat);
                fetchFilteredListings({ cat: newCat });
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-green-800 text-white shadow-2xs"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span>{cat.icon || "🚜"}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Advanced Filters Drawer (Section 18) */}
        {showAdvancedFilters && (
          <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">
                Equipment Condition
              </label>
              <select
                value={selectedCondition}
                onChange={(e) => {
                  setSelectedCondition(e.target.value);
                  fetchFilteredListings({ condition: e.target.value });
                }}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-300 bg-white"
              >
                <option value="">Any Condition</option>
                <option value="NEW">Brand New</option>
                <option value="EXCELLENT">Excellent Condition</option>
                <option value="GOOD">Good (Operational)</option>
                <option value="FAIR">Fair</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">
                Min Engine Power (HP)
              </label>
              <input
                type="number"
                placeholder="e.g. 40"
                value={minHp}
                onChange={(e) => setMinHp(e.target.value)}
                onBlur={() => fetchFilteredListings({ minHp })}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-300 bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">
                Max Daily Budget (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 3000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                onBlur={() => fetchFilteredListings({ maxPrice })}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-300 bg-white"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full py-1.5 px-3 bg-white hover:bg-gray-100 text-gray-700 font-bold border border-gray-300 rounded-lg transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}

        {/* Secondary filters bar: Rental Mode & Sorting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-bold uppercase text-[10px]">Rental Mode:</span>
            <div className="inline-flex rounded-xl bg-gray-100 p-1">
              {(["ALL", "DAILY", "HOURLY", "PER_ACRE"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setSelectedMode(mode);
                    fetchFilteredListings({ mode });
                  }}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    selectedMode === mode
                      ? "bg-white text-gray-900 shadow-2xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {mode === "ALL"
                    ? "All Modes"
                    : mode === "DAILY"
                    ? "Daily"
                    : mode === "HOURLY"
                    ? "Hourly"
                    : "Per Acre"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-bold uppercase text-[10px]">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                const s = e.target.value as "newest" | "nearest" | "price_asc" | "price_desc";
                setSortBy(s);
                fetchFilteredListings({ sort: s });
              }}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 focus:outline-hidden bg-white"
            >
              <option value="newest">Newest First</option>
              <option value="nearest">Nearest to Me</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Machinery Cards Grid */}
      {listings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl">
            🚜
          </div>
          <h3 className="text-lg font-bold text-gray-900">No machinery listings found</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Try adjusting your search keywords, clearing category filters, or resetting your filter criteria.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 bg-green-700 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((machine) => {
            const machineTypeKey =
              machine.specifications?.machineType ||
              getMachineTypeFromCategory(machine.category?.slug || machine.category?.name);
            const typeMeta = MACHINE_TYPES.find((m) => m.key === machineTypeKey);

            return (
              <div
                key={machine.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Image header */}
                  <div className="h-44 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                    {machine.images && machine.images.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={machine.images[0]}
                        alt={machine.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-5xl opacity-40">
                        {typeMeta?.icon || machine.category.icon || "🚜"}
                      </div>
                    )}

                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-green-900 border border-green-200 shadow-2xs flex items-center gap-1">
                      <span>{typeMeta?.icon || "🚜"}</span>
                      <span>{typeMeta?.label || machine.category.name}</span>
                    </div>

                    <div className="absolute top-3 right-3 bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-2xs">
                      {machine.condition}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-base font-bold text-gray-900 line-clamp-1">
                        {machine.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {machine.brand} {machine.modelNumber ? `• ${machine.modelNumber}` : ""}
                      </p>
                    </div>

                    {/* Machine-specific specs badge row */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-gray-700">
                      {machine.horsepower ? (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-md font-bold">
                          ⚡ {machine.horsepower} HP
                        </span>
                      ) : null}

                      {(machine.specifications as any)?.driveType ? (
                        <span className="px-2 py-0.5 bg-gray-100 rounded-md font-semibold">
                          ⚙️ {String((machine.specifications as any).driveType)}
                        </span>
                      ) : null}

                      {(machine.specifications as any)?.workingWidth ? (
                        <span className="px-2 py-0.5 bg-gray-100 rounded-md font-semibold">
                          📏 {String((machine.specifications as any).workingWidth)}
                        </span>
                      ) : null}

                      {(machine.specifications as any)?.payloadCapacityTons ? (
                        <span className="px-2 py-0.5 bg-gray-100 rounded-md font-semibold">
                          ⚖️ {String((machine.specifications as any).payloadCapacityTons)} Tons
                        </span>
                      ) : null}

                      {machine.fuelType ? (
                        <span className="px-2 py-0.5 bg-gray-100 rounded-md font-semibold">
                          ⛽ {machine.fuelType}
                        </span>
                      ) : null}
                    </div>

                    {/* Location & distance */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                      <span className="flex items-center gap-1 truncate max-w-[180px]">
                        📍 {machine.location}
                      </span>
                      {machine.distanceKm !== null && machine.distanceKm !== undefined && (
                        <span className="text-emerald-700 font-bold font-mono">
                          {formatDistance(machine.distanceKm)}
                        </span>
                      )}
                    </div>

                    {/* Pricing grid */}
                    <div className="p-3 bg-green-50/50 rounded-xl space-y-1 text-xs">
                      {machine.supportsHourly && machine.pricePerHour && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Hourly Rate:</span>
                          <span className="font-bold text-gray-900">₹{machine.pricePerHour}/hr</span>
                        </div>
                      )}
                      {machine.supportsDaily && machine.pricePerDay && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Daily Rate:</span>
                          <span className="font-bold text-gray-900">₹{machine.pricePerDay}/day</span>
                        </div>
                      )}
                      {machine.supportsPerAcre && machine.pricePerAcre && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Per Acre:</span>
                          <span className="font-bold text-gray-900">₹{machine.pricePerAcre}/acre</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action */}
                <div className="p-5 pt-0">
                  <Link
                    href={`/farmer/machinery/${machine.id}`}
                    className="w-full block text-center py-2.5 bg-green-700 hover:bg-green-800 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs"
                  >
                    View Specifications & Book &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
