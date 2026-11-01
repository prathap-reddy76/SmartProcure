import React from "react";

export default function FarmerLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading farmer portal">
      {/* Banner Skeleton */}
      <div className="h-36 bg-gray-200 rounded-2xl w-full" />

      {/* Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-xl" />
        ))}
      </div>

      {/* Quick Action Skeleton */}
      <div className="h-20 bg-gray-200 rounded-xl" />

      {/* Content Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64 bg-gray-200 rounded-xl" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}
