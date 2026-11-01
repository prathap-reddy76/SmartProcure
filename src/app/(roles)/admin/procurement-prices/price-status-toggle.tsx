"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { togglePriceStatus } from "@/actions/admin/price-actions";

export default function PriceStatusToggle({
  priceId,
  isActive,
}: {
  priceId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await togglePriceStatus(priceId, !isActive);
      if (!res.success && "error" in res && res.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to toggle status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition hover:opacity-80 cursor-pointer disabled:opacity-50 ${
        isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
      }`}
      title={`Click to ${isActive ? "deactivate" : "activate"} price`}
    >
      {loading ? "..." : isActive ? "Active" : "Inactive"}
    </button>
  );
}
