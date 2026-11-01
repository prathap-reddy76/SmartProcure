"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelBooking } from "@/actions/procurement/booking-actions";

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    setIsCancelling(true);
    const res = await cancelBooking(bookingId);
    setIsCancelling(false);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || "Failed to cancel booking.");
      setIsConfirming(false);
    }
  };

  if (isConfirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-600 font-bold">Are you sure?</span>
        <button
          onClick={handleCancel}
          disabled={isCancelling}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg disabled:opacity-50"
        >
          {isCancelling ? "Cancelling..." : "Yes, Cancel"}
        </button>
        <button
          onClick={() => setIsConfirming(false)}
          disabled={isCancelling}
          className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-lg"
        >
          No, Keep it
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsConfirming(true)}
      className="px-4 py-2 bg-white border border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 text-xs font-bold rounded-lg transition-colors"
    >
      Cancel Booking
    </button>
  );
}
