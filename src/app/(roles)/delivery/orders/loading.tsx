import React from "react";

export default function PartnerDeliveriesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-8 w-48 bg-gray-200 rounded" />
      </div>

      <div className="h-10 bg-gray-200 rounded-xl" />

      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 bg-gray-100 rounded-2xl border border-gray-200" />
        ))}
      </div>
    </div>
  );
}
