"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function OrdersFilter({
  currentStatus = "ALL",
  currentSearch = "",
}: {
  currentStatus?: string;
  currentSearch?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(currentSearch);

  const statuses = [
    { label: "All Orders", value: "ALL" },
    { label: "Confirmed", value: "CONFIRMED" },
    { label: "Processing", value: "PROCESSING" },
    { label: "Ready for Delivery", value: "READY_FOR_DELIVERY" },
    { label: "Delivered", value: "DELIVERED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  const updateFilters = (newStatus: string, newSearch: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newStatus && newStatus !== "ALL") {
      params.set("status", newStatus);
    } else {
      params.delete("status");
    }

    if (newSearch && newSearch.trim()) {
      params.set("search", newSearch.trim());
    } else {
      params.delete("search");
    }

    startTransition(() => {
      router.push(`/shop/orders?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters(currentStatus, searchTerm);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar & Status Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="Search by order number (e.g. SP-2026...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-24 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-2xs"
          />
          <button
            type="submit"
            disabled={isPending}
            className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            {isPending ? "Searching..." : "Search"}
          </button>
        </form>

        {currentSearch && (
          <button
            onClick={() => {
              setSearchTerm("");
              updateFilters(currentStatus, "");
            }}
            className="text-xs text-gray-500 hover:text-gray-800 underline self-start sm:self-center"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Status Filter Chips */}
      <div className="flex flex-wrap gap-2 pt-1 border-b border-gray-200/80 pb-3">
        {statuses.map((s) => {
          const isSelected = (currentStatus || "ALL") === s.value;
          return (
            <button
              key={s.value}
              onClick={() => updateFilters(s.value, searchTerm)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
