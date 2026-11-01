"use client";

import React, { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function DeliveriesFilter({
  currentStatus = "ALL",
}: {
  currentStatus?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const statuses = [
    { label: "All Runs", value: "ALL" },
    { label: "Awaiting Pickup", value: "ASSIGNED" },
    { label: "Picked Up", value: "PICKED_UP" },
    { label: "Out for Delivery", value: "OUT_FOR_DELIVERY" },
    { label: "Delivered", value: "DELIVERED" },
  ];

  const updateStatus = (newStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newStatus && newStatus !== "ALL") {
      params.set("status", newStatus);
    } else {
      params.delete("status");
    }

    startTransition(() => {
      router.push(`/delivery/orders?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-wrap gap-2 pt-1 border-b border-gray-200/80 pb-3">
      {statuses.map((s) => {
        const isSelected = (currentStatus || "ALL") === s.value;
        return (
          <button
            key={s.value}
            disabled={isPending}
            onClick={() => updateStatus(s.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isSelected
                ? "bg-blue-700 text-white shadow-2xs"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
