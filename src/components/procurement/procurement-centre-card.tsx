"use client";

import React from "react";
import Link from "next/link";
import { ProcurementCentreSummary } from "@/types/procurement";
import { getDirectionsUrl } from "@/lib/distance";

interface CentreCardProps {
  centre: ProcurementCentreSummary;
  distance?: string;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export function ProcurementCentreCard({
  centre,
  distance,
  isSelected = false,
  onSelect,
}: CentreCardProps) {
  const hasCoordinates =
    centre.latitude !== null &&
    centre.longitude !== null &&
    !isNaN(centre.latitude) &&
    !isNaN(centre.longitude);

  const directionsUrl = hasCoordinates
    ? getDirectionsUrl(centre.latitude!, centre.longitude!)
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        [centre.name, centre.village, centre.district, "Andhra Pradesh"].filter(Boolean).join(", ")
      )}`;

  const statusBadge = () => {
    switch (centre.availabilityStatus) {
      case "FULL":
        return (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
            Fully Booked
          </span>
        );
      case "LIMITED":
        return (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            Limited Slots
          </span>
        );
      case "CLOSED":
        return (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
            Closed
          </span>
        );
      case "AVAILABLE":
      default:
        return (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            Available
          </span>
        );
    }
  };

  return (
    <div
      onClick={() => onSelect?.(centre.id)}
      className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between cursor-pointer ${
        isSelected
          ? "border-green-600 ring-2 ring-green-600/20 shadow-md bg-green-50/10"
          : "border-gray-200/90 hover:border-green-300 hover:shadow-xs shadow-2xs"
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="text-base font-bold text-gray-900 group-hover:text-green-700 transition-colors">
              {centre.name}
            </h3>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{centre.code}</p>
          </div>
          <div>{statusBadge()}</div>
        </div>

        {/* Distance Badge if available */}
        {distance && (
          <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold">
            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{distance}</span>
          </div>
        )}

        {/* Location & Details */}
        <div className="space-y-2 text-xs text-gray-600 mb-4">
          <div className="flex items-start gap-2">
            <span className="font-semibold text-gray-900 w-16 shrink-0">Location:</span>
            <span className="text-gray-700">
              {[centre.village, centre.mandal, centre.district].filter(Boolean).join(", ") ||
                centre.address ||
                "Location not specified"}
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="font-semibold text-gray-900 w-16 shrink-0">Hours:</span>
            <span className="text-gray-700">
              {centre.operatingStartTime || "09:00"} - {centre.operatingEndTime || "17:00"}
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="font-semibold text-gray-900 w-16 shrink-0">Crops:</span>
            <span className="font-medium text-green-700 line-clamp-1">
              {centre.supportedCrops && centre.supportedCrops.length > 0
                ? centre.supportedCrops.join(", ")
                : "All major crops"}
            </span>
          </div>
        </div>

        {/* Slot Availability Banner */}
        <div className="bg-gray-50 rounded-xl p-2.5 mb-4 border border-gray-100 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-medium">Today&apos;s Slots:</span>
            {centre.nextAvailableSlot ? (
              <span className="text-emerald-700 font-bold">
                Next: {centre.nextAvailableSlot}
              </span>
            ) : centre.availableSlotsToday !== undefined && centre.availableSlotsToday > 0 ? (
              <span className="text-emerald-700 font-bold">
                {centre.availableSlotsToday} slots free
              </span>
            ) : (
              <span className="text-gray-500">Check dates</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-gray-100 mt-auto flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
          title="Open directions in Google Maps"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Navigate
        </a>

        <div className="flex items-center gap-2">
          {onSelect && (
            <button
              type="button"
              onClick={() => onSelect(centre.id)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors sm:hidden"
            >
              Map
            </button>
          )}

          <Link
            href={`/farmer/procurement/centres/${centre.id}`}
            className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1"
          >
            <span>Book Slot</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
