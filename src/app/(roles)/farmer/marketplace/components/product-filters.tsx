"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);

  const initialMinPrice = searchParams.get("minPrice") || "";
  const initialMaxPrice = searchParams.get("maxPrice") || "";
  const initialAvailability = searchParams.get("availability") || "all";
  const initialProductType = searchParams.get("productType") || "all";
  const initialBrand = searchParams.get("brand") || "";
  const initialSuitableCrops = searchParams.get("suitableCrops") || "";
  const initialSort = searchParams.get("sort") || "newest";

  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [availability, setAvailability] = useState(initialAvailability);
  const [productType, setProductType] = useState(initialProductType);
  const [brand, setBrand] = useState(initialBrand);
  const [suitableCrops, setSuitableCrops] = useState(initialSuitableCrops);
  const [sort, setSort] = useState(initialSort);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (minPrice && Number(minPrice) >= 0) {
      params.set("minPrice", minPrice);
    } else {
      params.delete("minPrice");
    }

    if (maxPrice && Number(maxPrice) >= 0) {
      params.set("maxPrice", maxPrice);
    } else {
      params.delete("maxPrice");
    }

    if (availability && availability !== "all") {
      params.set("availability", availability);
    } else {
      params.delete("availability");
    }

    if (productType && productType !== "all") {
      params.set("productType", productType);
    } else {
      params.delete("productType");
    }
    
    if (brand.trim() !== "") {
      params.set("brand", brand.trim());
    } else {
      params.delete("brand");
    }
    
    if (suitableCrops.trim() !== "") {
      params.set("suitableCrops", suitableCrops.trim());
    } else {
      params.delete("suitableCrops");
    }

    if (sort && sort !== "newest") {
      params.set("sort", sort);
    } else {
      params.delete("sort");
    }

    params.delete("page");
    router.push(`/farmer/marketplace?${params.toString()}`);
  };

  const handleReset = () => {
    setMinPrice("");
    setMaxPrice("");
    setAvailability("all");
    setProductType("all");
    setBrand("");
    setSuitableCrops("");
    setSort("newest");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("availability");
    params.delete("productType");
    params.delete("brand");
    params.delete("suitableCrops");
    params.delete("sort");
    params.delete("search");
    params.delete("category");
    params.delete("page");
    router.push(`/farmer/marketplace?${params.toString()}`);
  };

  const hasActiveFilters = Boolean(
    searchParams.get("minPrice") ||
      searchParams.get("maxPrice") ||
      (searchParams.get("availability") && searchParams.get("availability") !== "all") ||
      (searchParams.get("productType") && searchParams.get("productType") !== "all") ||
      searchParams.get("brand") ||
      searchParams.get("suitableCrops") ||
      (searchParams.get("sort") && searchParams.get("sort") !== "newest") ||
      searchParams.get("search") ||
      searchParams.get("category")
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-4 sm:p-5">
      {/* Header with mobile toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="font-bold text-gray-900 text-sm">Refine Results</span>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="text-xs text-red-600 hover:text-red-800 font-semibold underline"
            >
              Reset All
            </button>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-xs text-gray-500 font-semibold px-2 py-1 bg-gray-100 rounded"
          >
            {isOpen ? "Hide" : "Filter"}
          </button>
        </div>
      </div>

      {/* Filter Form Body */}
      <form
        onSubmit={handleApply}
        className={`${isOpen ? "block" : "hidden"} md:block mt-4 space-y-4 pt-3 border-t border-gray-100`}
      >
        {/* Sort Filter */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Sort By
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 bg-gray-50"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="relevance">Best Match</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>

        {/* Product Type Filter */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Product Category
          </label>
          <select
            value={productType}
            onChange={(e) => {
              setProductType(e.target.value);
              // Reset type-specific filters if we switch away from them
              if (e.target.value !== "FERTILIZER") setSuitableCrops("");
            }}
            className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500"
          >
            <option value="all">All Products</option>
            <option value="FERTILIZER">Fertilizers & Inputs</option>
            <option value="MACHINERY_RENTAL">Machinery Rentals</option>
            <option value="MACHINERY_SALES">New Machinery Sales</option>
          </select>
        </div>
        
        {/* Type Specific: Fertilizer crops */}
        {productType === "FERTILIZER" && (
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Suitable Crop
            </label>
            <input
              type="text"
              value={suitableCrops}
              onChange={(e) => setSuitableCrops(e.target.value)}
              placeholder="e.g., Paddy, Cotton..."
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500"
            />
          </div>
        )}
        
        {/* Deep JSON Brand Filter (Applies to all theoretically) */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Brand
          </label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Search brands..."
            className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500"
          />
        </div>

        {/* Availability Filter */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Stock Availability
          </label>
          <div className="space-y-1.5 text-xs text-gray-700">
            {[
              { id: "all", label: "All Items" },
              { id: "in-stock", label: "In Stock Only" },
              { id: "out-of-stock", label: "Out of Stock" },
            ].map((option) => (
              <label
                key={option.id}
                className="flex items-center gap-2 p-1.5 rounded-md hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name="availability"
                  checked={availability === option.id}
                  onChange={() => setAvailability(option.id)}
                  className="w-3.5 h-3.5 text-green-700 focus:ring-green-500"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range Filter */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Price Range (₹)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min ₹"
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max ₹"
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-2 flex gap-2">
          <button
            type="submit"
            className="flex-1 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
          >
            Apply Filters
          </button>
        </div>
      </form>
    </div>
  );
}
