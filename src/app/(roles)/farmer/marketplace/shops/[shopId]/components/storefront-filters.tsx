"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface StorefrontFiltersProps {
  shopId: string;
  categories: { id: string; name: string; slug: string }[];
}

export function StorefrontFilters({ shopId, categories }: StorefrontFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") || "";
  const currentCategory = searchParams.get("category") || "all";
  const currentAvailability = searchParams.get("availability") || "all";
  const [term, setTerm] = useState(currentSearch);

  const updateFilters = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    params.set("page", "1");

    startTransition(() => {
      router.push(`/farmer/marketplace/shops/${shopId}?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: term.trim() });
  };

  const handleCategorySelect = (slug: string) => {
    updateFilters({ category: slug });
  };

  const handleAvailabilityToggle = () => {
    const nextVal = currentAvailability === "in-stock" ? "all" : "in-stock";
    updateFilters({ availability: nextVal });
  };

  return (
    <div className="space-y-4">
      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search products in this shop..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all text-gray-900 placeholder:text-gray-400 shadow-2xs"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2.5 text-xs font-bold text-white bg-green-700 hover:bg-green-800 rounded-xl transition-all shadow-xs disabled:opacity-50"
        >
          {isPending ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Category Pills & Availability Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleCategorySelect("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              currentCategory === "all"
                ? "bg-green-700 text-white shadow-2xs"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            All Products
          </button>

          {categories.map((c) => {
            const isActive = currentCategory === c.slug;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleCategorySelect(c.slug)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? "bg-green-700 text-white shadow-2xs"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>

        {/* Quick In-Stock filter */}
        <div>
          <button
            type="button"
            onClick={handleAvailabilityToggle}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              currentAvailability === "in-stock"
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                currentAvailability === "in-stock" ? "bg-emerald-600" : "bg-gray-400"
              }`}
            />
            <span>In-Stock Only</span>
          </button>
        </div>
      </div>
    </div>
  );
}
