"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptDelivery } from "@/actions/delivery/delivery-actions";

export function AcceptDeliveryButton({
  orderId,
  isAvailable,
}: {
  orderId: string;
  isAvailable: boolean;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!isAvailable) {
      setError("You are currently set to Unavailable. Please toggle on duty in your profile.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await acceptDelivery(orderId);
    setIsLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      router.push(`/delivery/orders/${orderId}`);
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-[11px] rounded-lg font-medium">
          {error}
        </div>
      )}
      <button
        type="button"
        disabled={isLoading}
        onClick={handleAccept}
        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
      >
        <span>{isLoading ? "Accepting..." : "Accept Delivery"}</span>
        <span>→</span>
      </button>
    </div>
  );
}
