import React from "react";

export default function ShopOrdersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-8 w-48 bg-gray-200 rounded" />
      </div>

      {/* Filter skeleton */}
      <div className="h-10 bg-gray-200 rounded-xl" />

      {/* Order cards skeleton */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-44 bg-gray-100 rounded-2xl border border-gray-200" />
        ))}
      </div>
    </div>
  );
}
