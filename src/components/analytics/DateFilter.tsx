"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { AnalyticsPeriod } from "@/lib/analytics/core";

export default function DateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPeriod = (searchParams.get("period") as AnalyticsPeriod) || "30d";
  
  const [showCustom, setShowCustom] = useState(currentPeriod === "custom");
  const [customFrom, setCustomFrom] = useState(searchParams.get("from") || "");
  const [customTo, setCustomTo] = useState(searchParams.get("to") || "");

  const updateFilter = useCallback((period: AnalyticsPeriod, from?: string, to?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", period);
    
    if (period === "custom" && from && to) {
      params.set("from", from);
      params.set("to", to);
    } else {
      params.delete("from");
      params.delete("to");
    }
    
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const p = e.target.value as AnalyticsPeriod;
    if (p === "custom") {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      updateFilter(p);
    }
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      // Validate dates
      if (new Date(customFrom) > new Date(customTo)) {
        alert("Start date must be before end date");
        return;
      }
      updateFilter("custom", customFrom, customTo);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center p-4 bg-white shadow rounded-md mb-6">
      <label className="text-sm font-medium text-gray-700">Date Range:</label>
      <select 
        value={showCustom ? "custom" : currentPeriod} 
        onChange={handlePeriodChange}
        className="border-gray-300 rounded-md shadow-sm text-sm focus:ring-green-500 focus:border-green-500"
      >
        <option value="today">Today</option>
        <option value="7d">Last 7 Days</option>
        <option value="30d">Last 30 Days</option>
        <option value="90d">Last 90 Days</option>
        <option value="all">All Time</option>
        <option value="custom">Custom Range</option>
      </select>

      {showCustom && (
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center mt-2 sm:mt-0">
          <input 
            type="date" 
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm text-sm"
          />
          <span className="text-gray-500">to</span>
          <input 
            type="date" 
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm text-sm"
          />
          <button 
            onClick={handleCustomApply}
            disabled={!customFrom || !customTo}
            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
