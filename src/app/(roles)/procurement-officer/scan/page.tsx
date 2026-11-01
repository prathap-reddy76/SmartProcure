"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { findBookingByToken } from "@/actions/procurement/queue-actions";
import { ProcurementIcon } from "@/components/ui/icons";

export default function OfficerScanPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const booking = await findBookingByToken(token.trim(), token.trim());
      if (booking) {
        router.push(`/procurement-officer/bookings/${booking.id}`);
      } else {
        setError("No booking found with this token or booking number for your centre today.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex flex-col gap-1 pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <ProcurementIcon className="w-6 h-6 text-green-700" />
          Scan or Lookup Token
        </h1>
        <p className="text-sm text-gray-500">
          Enter a farmer&apos;s token number or booking number to register their arrival.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-8">
        <form onSubmit={handleSearch} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 text-red-800 text-sm font-bold rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Token / Booking Number</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="e.g. KRN-4F2A or BKG-123456"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none font-mono text-lg uppercase"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!token.trim() || isLoading}
            className="w-full py-3.5 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-colors"
          >
            {isLoading ? "Searching..." : "Lookup Booking"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">QR Code scanning coming in future phases. For now, please enter the token manually.</p>
        </div>
      </div>
    </div>
  );
}
