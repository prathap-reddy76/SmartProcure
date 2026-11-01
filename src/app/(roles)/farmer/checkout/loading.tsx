import React from "react";

export default function CheckoutLoading() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-pulse" aria-label="Loading checkout">
      <div className="h-12 bg-gray-200 rounded-lg w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-72 bg-gray-200 rounded-2xl" />
          <div className="h-40 bg-gray-200 rounded-2xl" />
        </div>
        <div className="lg:col-span-1">
          <div className="h-80 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
