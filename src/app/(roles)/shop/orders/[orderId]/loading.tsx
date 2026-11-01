import React from "react";

export default function ShopOrderDetailLoading() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-pulse">
      <div className="h-6 w-32 bg-gray-200 rounded" />
      <div className="h-10 w-64 bg-gray-200 rounded" />

      {/* Stepper skeleton */}
      <div className="h-40 bg-gray-100 rounded-2xl border border-gray-200" />

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-72 bg-gray-100 rounded-2xl border border-gray-200" />
        <div className="space-y-6">
          <div className="h-48 bg-gray-100 rounded-2xl border border-gray-200" />
          <div className="h-32 bg-gray-100 rounded-2xl border border-gray-200" />
        </div>
      </div>
    </div>
  );
}
