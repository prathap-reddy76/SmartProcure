"use client";

import React from "react";

export default function ShopDashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-red-200 p-8 text-center space-y-4 max-w-lg mx-auto my-8">
      <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
        !
      </div>
      <h2 className="text-lg font-bold text-gray-900">Failed to load Shop Dashboard</h2>
      <p className="text-xs text-gray-500">
        An error occurred while loading your store data and order statistics. Please try refreshing.
      </p>
      <div>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
