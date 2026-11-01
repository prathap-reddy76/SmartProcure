import React from "react";

export default function DeliveryProfileLoading() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-8 w-48 bg-gray-200 rounded" />
      </div>
      <div className="h-20 bg-gray-200 rounded-2xl" />
      <div className="h-64 bg-gray-100 rounded-2xl border border-gray-200" />
    </div>
  );
}
