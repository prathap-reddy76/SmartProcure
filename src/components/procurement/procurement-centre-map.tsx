"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { ProcurementCentreSummary } from "@/types/procurement";
import { getDirectionsUrl } from "@/lib/distance";

interface CentreMapProps {
  centres: ProcurementCentreSummary[];
  userLocation: { lat: number; lng: number } | null;
  selectedCentreId: string | null;
  onSelectCentre: (id: string) => void;
  distances?: Record<string, string>;
}

// Controller to pan map when a centre or user location is selected
function MapRecenter({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

const centreIcon = L.divIcon({
  className: "custom-centre-marker",
  html: `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;background-color:#15803d;color:white;border-radius:50%;border:3px solid white;box-shadow:0 4px 6px -1px rgba(0,0,0,0.3);font-size:12px;font-weight:bold;">
    <svg style="width:18px;height:18px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
});

const selectedCentreIcon = L.divIcon({
  className: "custom-centre-marker-selected",
  html: `<div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;background-color:#047857;color:white;border-radius:50%;border:3px solid #facc15;box-shadow:0 10px 15px -3px rgba(0,0,0,0.4);font-size:14px;font-weight:bold;">
    <svg style="width:22px;height:22px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const userLocationIcon = L.divIcon({
  className: "custom-user-marker",
  html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:24px;height:24px;">
    <div style="width:14px;height:14px;background-color:#2563eb;border:2px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3);z-index:2;"></div>
    <div style="position:absolute;width:26px;height:26px;background-color:rgba(59,130,246,0.3);border-radius:50%;z-index:1;"></div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

export default function ProcurementCentreMap({
  centres,
  userLocation,
  selectedCentreId,
  onSelectCentre,
  distances = {},
}: CentreMapProps) {
  // Filter centres with valid coordinates
  const validCentres = centres.filter(
    (c) =>
      c.latitude !== null &&
      c.longitude !== null &&
      !isNaN(c.latitude) &&
      !isNaN(c.longitude)
  );

  const selectedCentre = validCentres.find((c) => c.id === selectedCentreId);

  // Default center: Andhra Pradesh centroid (~15.9129, 79.7400) or selected centre or user location
  let defaultCenter: [number, number] = [15.9129, 79.74];
  let defaultZoom = 7;

  if (selectedCentre && selectedCentre.latitude && selectedCentre.longitude) {
    defaultCenter = [selectedCentre.latitude, selectedCentre.longitude];
    defaultZoom = 13;
  } else if (userLocation) {
    defaultCenter = [userLocation.lat, userLocation.lng];
    defaultZoom = 11;
  } else if (validCentres.length > 0 && validCentres[0].latitude && validCentres[0].longitude) {
    defaultCenter = [validCentres[0].latitude, validCentres[0].longitude];
    defaultZoom = 10;
  }

  return (
    <div className="w-full h-full min-h-[360px] sm:min-h-[440px] rounded-2xl overflow-hidden border border-gray-200 shadow-xs relative z-0">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ minHeight: "360px" }}
      >
        <MapRecenter center={defaultCenter} zoom={defaultZoom} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Farmer Current Location Marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userLocationIcon}
          >
            <Popup>
              <div className="text-xs p-1 text-center font-sans">
                <span className="font-bold text-blue-700 block text-sm">Your Location</span>
                <span className="text-gray-500 text-[11px]">Approximate browser GPS</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Procurement Centre Markers */}
        {validCentres.map((centre) => {
          const lat = centre.latitude as number;
          const lng = centre.longitude as number;
          const isSelected = centre.id === selectedCentreId;
          const distanceStr = distances[centre.id];

          return (
            <Marker
              key={centre.id}
              position={[lat, lng]}
              icon={isSelected ? selectedCentreIcon : centreIcon}
              eventHandlers={{
                click: () => onSelectCentre(centre.id),
              }}
            >
              <Popup>
                <div className="text-xs p-1 font-sans space-y-2 max-w-[240px]">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-bold text-gray-900 text-sm leading-tight">
                        {centre.name}
                      </h4>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase ${
                          centre.availabilityStatus === "FULL"
                            ? "bg-red-100 text-red-800"
                            : centre.availabilityStatus === "LIMITED"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {centre.availabilityStatus || "ACTIVE"}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 font-mono">{centre.code}</p>
                  </div>

                  <p className="text-gray-600 text-[11px] leading-snug">
                    {[centre.village, centre.mandal, centre.district].filter(Boolean).join(", ")}
                  </p>

                  {distanceStr && (
                    <div className="bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded-sm text-[11px] inline-block">
                      📍 {distanceStr}
                    </div>
                  )}

                  {centre.nextAvailableSlot ? (
                    <p className="text-[11px] text-emerald-700 font-semibold">
                      Next Slot: {centre.nextAvailableSlot}
                    </p>
                  ) : centre.totalSlotsToday && centre.totalSlotsToday > 0 ? (
                    <p className="text-[11px] text-gray-500">
                      {centre.availableSlotsToday || 0} slots remaining today
                    </p>
                  ) : null}

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                    <a
                      href={getDirectionsUrl(lat, lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                    >
                      Navigate ↗
                    </a>
                    <Link
                      href={`/farmer/procurement/centres/${centre.id}`}
                      className="px-3 py-1 text-[11px] font-bold text-white bg-green-700 hover:bg-green-800 rounded-md transition-colors"
                    >
                      Book Slot &rarr;
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
