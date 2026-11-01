"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ProcurementCentreSummary } from "@/types/procurement";

const DynamicCentreMap = dynamic(
  () => import("@/components/procurement/procurement-centre-map"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[360px] sm:min-h-[440px] rounded-2xl bg-gray-100 flex flex-col items-center justify-center border border-gray-200 text-gray-500 animate-pulse">
        <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <span className="text-xs font-semibold">Loading interactive map...</span>
      </div>
    ),
  }
);

interface MapWrapperProps {
  centres: ProcurementCentreSummary[];
  userLocation: { lat: number; lng: number } | null;
  selectedCentreId: string | null;
  onSelectCentre: (id: string) => void;
  distances?: Record<string, string>;
}

export function MapWrapper(props: MapWrapperProps) {
  return <DynamicCentreMap {...props} />;
}
