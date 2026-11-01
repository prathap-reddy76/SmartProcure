import React from "react";

export default function DeliveryDashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-44 bg-gray-200 rounded-3xl" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-4">
        <div className="h-6 w-48 bg-gray-200 rounded" />
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
