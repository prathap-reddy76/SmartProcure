"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function ShopSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [term, setTerm] = useState(searchParams.get("search") || "");
  const [district, setDistrict] = useState(searchParams.get("district") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    
    if (term.trim()) {
      params.set("search", term.trim());
    } else {
      params.delete("search");
    }

    if (district.trim()) {
      params.set("district", district.trim());
    } else {
      params.delete("district");
    }

    params.set("page", "1");

    startTransition(() => {
      router.push(`/farmer/marketplace/shops?${params.toString()}`);
    });
  };

  const handleClear = () => {
    setTerm("");
    setDistrict("");
    startTransition(() => {
      router.push("/farmer/marketplace/shops");
    });
  };

  const hasFilters = Boolean(searchParams.get("search") || searchParams.get("district"));

  return (
    <form
      onSubmit={handleSearch}
      className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between"
    >
      <div className="flex-1 flex flex-col sm:flex-row gap-3">
        {/* Name / Keyword Search */}
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
            placeholder="Search by shop name, town, or supplies..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* District Filter */}
        <div className="relative w-full sm:w-56">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="Filter by district..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all text-gray-900 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        {hasFilters && (
          <button
            type="button"
            onClick={handleClear}
            className="px-3.5 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Clear
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 text-xs font-bold text-white bg-green-700 hover:bg-green-800 rounded-xl transition-all shadow-xs disabled:opacity-50"
        >
          {isPending ? "Searching..." : "Search Shops"}
        </button>
      </div>
    </form>
  );
}
