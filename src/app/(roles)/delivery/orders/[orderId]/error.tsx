"use client";

import React from "react";
import Link from "next/link";

export default function PartnerDeliveryDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-red-200 p-8 text-center space-y-4 max-w-lg mx-auto my-8">
      <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
        !
      </div>
      <h2 className="text-lg font-bold text-gray-900">Failed to load Delivery Run</h2>
      <p className="text-xs text-gray-500">
        An error occurred while loading this delivery assignment, or you do not have permission to manage this run.
      </p>
      <div className="flex items-center justify-center gap-3 pt-2">
        <Link
          href="/delivery/orders"
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
        >
          Back to My Deliveries
        </Link>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
