"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { callNextBooking } from "@/actions/procurement/queue-actions";

type BookingData = { id: string; status: string; arrivedAt?: string | Date | null; tokenNumber: string; farmerName: string; cropName: string; expectedQuantity: number | string; slotStartTime?: string; slotEndTime?: string; };

export default function OfficerQueueClient({ centreName, bookings }: { centreName: string, bookings: BookingData[] }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeBookings = bookings.filter(b => ["BOOKED", "ARRIVED", "WAITING", "IN_PROGRESS", "WEIGHING"].includes(b.status));

  // Sort queue: IN_PROGRESS/WEIGHING first, then WAITING by arrival, then ARRIVED by arrival, then BOOKED.
  const sortedBookings = [...activeBookings].sort((a, b) => {
    const statusWeight: Record<string, number> = {
      WEIGHING: 1,
      IN_PROGRESS: 2,
      WAITING: 3,
      ARRIVED: 4,
      BOOKED: 5,
    };
    
    if (statusWeight[a.status] !== statusWeight[b.status]) {
      return statusWeight[a.status] - statusWeight[b.status];
    }
    
    // Within same status, sort by arrival time if available
    if (a.arrivedAt && b.arrivedAt) {
      return new Date(a.arrivedAt).getTime() - new Date(b.arrivedAt).getTime();
    }
    return 0;
  });

  const currentlyServing = sortedBookings.find(b => b.status === "IN_PROGRESS" || b.status === "WEIGHING");
  const waitingList = sortedBookings.filter(b => b.status !== "IN_PROGRESS" && b.status !== "WEIGHING");

  const handleCallNext = async () => {
    if (currentlyServing) {
      setError("Please complete the current weighing process before calling the next token.");
      return;
    }

    setIsLoading(true);
    setError(null);
    const res = await callNextBooking();
    if (res.success && 'bookingId' in res && res.bookingId) {
      router.push(`/procurement-officer/bookings/${res.bookingId}`);
    } else {
      setError('error' in res && res.error ? String(res.error) : "Failed to call next booking.");
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-800 text-sm font-bold rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {/* Currently Serving Box */}
      {currentlyServing && (
        <div className="bg-blue-900 text-white rounded-2xl p-6 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-1 block">Currently Serving</span>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-mono font-bold tracking-tight">{currentlyServing.tokenNumber}</span>
              <span className="px-2.5 py-1 text-[10px] font-bold rounded bg-blue-800 text-blue-200 border border-blue-700 uppercase">
                {currentlyServing.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-blue-100 text-sm mt-2">{currentlyServing.farmerName} &bull; {currentlyServing.cropName}</p>
          </div>
          <button 
            onClick={() => router.push(`/procurement-officer/bookings/${currentlyServing.id}`)}
            className="px-6 py-3 bg-white text-blue-900 font-bold rounded-xl shadow-xs hover:bg-blue-50 transition-colors text-sm"
          >
            Open Booking &rarr;
          </button>
        </div>
      )}

      {/* Queue Header Actions */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Waiting Queue</h2>
          <p className="text-xs text-gray-500">Farmers currently registered and waiting.</p>
        </div>
        <button
          onClick={handleCallNext}
          disabled={isLoading || waitingList.length === 0 || !!currentlyServing}
          className="px-5 py-2.5 bg-green-700 hover:bg-green-800 disabled:opacity-50 disabled:hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-xs transition-colors"
        >
          {isLoading ? "Calling..." : "Call Next Token"}
        </button>
      </div>

      {/* Queue List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {waitingList.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {waitingList.map((b, index) => (
              <div key={b.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-500 text-xs shrink-0 mt-1">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono font-bold text-lg text-gray-900">{b.tokenNumber}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">
                        {b.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm">{b.farmerName}</h3>
                    <p className="text-xs text-gray-500">
                      {b.cropName} &bull; {b.expectedQuantity} quintals
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Arrived: {b.arrivedAt ? new Date(b.arrivedAt).toLocaleTimeString() : "Not Arrived"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 pl-12 sm:pl-0">
                  <button 
                    onClick={() => router.push(`/procurement-officer/bookings/${b.id}`)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center">
            <p className="text-gray-500 font-medium">The queue is currently empty.</p>
          </div>
        )}
      </div>
    </div>
  );
}
