"use client";

import React, { useState } from "react";
import { ProcurementCentreDetail } from "@/types/procurement";
import { MapWrapper } from "@/components/procurement/map-wrapper";
import { calculateDistance, formatDistance, getDirectionsUrl } from "@/lib/distance";

interface CentreLocationCardProps {
  centre: ProcurementCentreDetail;
}

export function CentreLocationCard({ centre }: CentreLocationCardProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [distanceText, setDistanceText] = useState<string | null>(null);

  const hasCoords =
    centre.latitude !== null &&
    centre.longitude !== null &&
    !isNaN(centre.latitude) &&
    !isNaN(centre.longitude);

  const handleGetDistance = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        if (hasCoords) {
          const dist = calculateDistance(
            loc.lat,
            loc.lng,
            centre.latitude!,
            centre.longitude!
          );
          setDistanceText(formatDistance(dist));
        }
      },
      () => {
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const directionsUrl = hasCoords
    ? getDirectionsUrl(centre.latitude!, centre.longitude!)
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        [centre.name, centre.village, centre.district, "Andhra Pradesh"].filter(Boolean).join(", ")
      )}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <svg className="w-4 h-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Centre Location & Navigation</span>
        </h3>
        {distanceText && (
          <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
            📍 {distanceText}
          </span>
        )}
      </div>

      {/* Address breakdown */}
      <div className="text-xs space-y-1.5 text-gray-600 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
        <p className="font-semibold text-gray-900">
          {[centre.address, centre.village].filter(Boolean).join(", ") || "Main Procurement Yard"}
        </p>
        <p>
          {[centre.mandal, centre.district, centre.state].filter(Boolean).join(", ")}
          {centre.pincode ? ` - ${centre.pincode}` : ""}
        </p>
        {hasCoords && (
          <p className="text-[11px] font-mono text-gray-400 pt-1">
            GPS: {centre.latitude?.toFixed(4)}° N, {centre.longitude?.toFixed(4)}° E
          </p>
        )}
      </div>

      {/* Mini Interactive Map */}
      {hasCoords ? (
        <div className="h-48 w-full rounded-xl overflow-hidden border border-gray-200">
          <MapWrapper
            centres={[centre]}
            userLocation={userLocation}
            selectedCentreId={centre.id}
            onSelectCentre={() => {}}
            distances={distanceText ? { [centre.id]: distanceText } : {}}
          />
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-gray-50 border border-dashed border-gray-300 text-center text-xs text-gray-500">
          Precise map coordinates not yet mapped for this centre.
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-2xs"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Get Directions ↗
        </a>

        {!distanceText && (
          <button
            type="button"
            onClick={handleGetDistance}
            disabled={isLocating}
            className="px-3 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
          >
            {isLocating ? "Locating..." : "Find Distance"}
          </button>
        )}
      </div>
    </div>
  );
}
