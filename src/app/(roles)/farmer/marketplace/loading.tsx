import React from "react";

export default function MarketplaceLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading marketplace">
      {/* Banner Skeleton */}
      <div className="h-32 bg-gray-200 rounded-2xl w-full" />

      {/* Search Bar Skeleton */}
      <div className="h-12 bg-gray-200 rounded-xl w-full" />

      {/* Category Pills Skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-9 w-28 bg-gray-200 rounded-full flex-shrink-0" />
        ))}
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        <div className="h-64 bg-gray-200 rounded-xl hidden md:block" />
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
