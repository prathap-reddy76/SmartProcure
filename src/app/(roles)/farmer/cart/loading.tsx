import React from "react";

export default function CartLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading cart">
      {/* Header skeleton */}
      <div className="h-10 bg-gray-200 rounded-lg w-48" />

      {/* Two column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left items */}
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl" />
          ))}
        </div>

        {/* Right summary */}
        <div className="lg:col-span-1">
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
