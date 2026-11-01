"use client";

import React from "react";
import dynamic from "next/dynamic";
import { TruckIcon } from "@/components/ui/icons";

interface DeliveryTrackingMapWrapperProps {
  partnerLat: number;
  partnerLon: number;
  partnerName: string;
  updatedAt: string | null;
}

const DynamicDeliveryMap = dynamic(
  () => import("@/components/farmer/delivery-tracking-map"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[300px] sm:h-[400px] rounded-2xl bg-gray-50 flex flex-col items-center justify-center border border-gray-200 text-gray-500">
        <TruckIcon className="w-8 h-8 text-gray-400 mb-2 animate-pulse" />
        <span className="text-xs font-semibold animate-pulse">Loading live tracking map...</span>
      </div>
    ),
  }
);

export function DeliveryTrackingMapWrapper(props: DeliveryTrackingMapWrapperProps) {
  return <DynamicDeliveryMap {...props} />;
}
