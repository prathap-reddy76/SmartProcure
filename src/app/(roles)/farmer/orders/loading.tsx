import React from "react";

export default function OrdersLoading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-pulse" aria-label="Loading orders">
      <div className="h-10 bg-gray-200 rounded-lg w-64" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
