"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleAvailability } from "@/actions/delivery/delivery-actions";

export function AvailabilityToggle({ initialAvailable }: { initialAvailable: boolean }) {
  const router = useRouter();
  const [isAvailable, setIsAvailable] = useState(initialAvailable);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    const res = await toggleAvailability();
    setIsLoading(false);

    if (res.success && typeof res.isAvailable === "boolean") {
      setIsAvailable(res.isAvailable);
      router.refresh();
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-2xl">
      <div className="space-y-0.5">
        <div className="text-xs font-bold text-gray-900">Duty Availability Status</div>
        <div className="text-[11px] text-gray-500">
          {isAvailable
            ? "You are marked as Available on Duty. You can accept and claim new delivery orders."
            : "You are marked as Off Duty. You will not be able to claim new delivery runs."}
        </div>
      </div>

      <button
        type="button"
        disabled={isLoading}
        onClick={handleToggle}
        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
          isAvailable
            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            : "bg-gray-200 hover:bg-gray-300 text-gray-700"
        }`}
      >
        {isLoading
          ? "Updating..."
          : isAvailable
          ? "✓ Available on Duty"
          : "Off Duty (Unavailable)"}
      </button>
    </div>
  );
}
