"use client";

import React, { useEffect } from "react";
import Link from "next/link";

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Checkout error:", error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
          !
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Unable to process checkout</h1>
        <p className="text-sm text-gray-500 mb-6">
          An error occurred while loading your checkout information. Please review your cart and try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg text-sm transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/farmer/cart"
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition-colors"
          >
            Back to Cart
          </Link>
        </div>
      </div>
    </div>
  );
}
