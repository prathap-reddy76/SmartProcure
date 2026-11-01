"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface DeliveryTrackingMapProps {
  partnerLat: number;
  partnerLon: number;
  partnerName: string;
  updatedAt: string | null;
}

// Map bound adjustment controller
function MapController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 13, { animate: true, duration: 1 });
  }, [map, lat, lng]);
  return null;
}

export default function DeliveryTrackingMap({
  partnerLat,
  partnerLon,
  partnerName,
  updatedAt,
}: DeliveryTrackingMapProps) {
  // Custom marker icon to fix default Leaflet icon issues in Next.js
  const customIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const formattedTime = updatedAt
    ? new Date(updatedAt).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recently";

  return (
    <div className="w-full h-[300px] sm:h-[400px] rounded-2xl overflow-hidden border border-gray-200/90 shadow-2xs relative z-0">
      <MapContainer
        center={[partnerLat, partnerLon]}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Marker position={[partnerLat, partnerLon]} icon={customIcon}>
          <Popup className="font-sans">
            <div className="p-1">
              <span className="block font-bold text-gray-900 text-sm mb-0.5">
                {partnerName}
              </span>
              <span className="block text-xs text-gray-500">
                Last updated: {formattedTime}
              </span>
            </div>
          </Popup>
        </Marker>

        <MapController lat={partnerLat} lng={partnerLon} />
      </MapContainer>

      {/* Floating live indicator */}
      <div className="absolute top-3 left-3 z-[400] bg-white/90 backdrop-blur-sm border border-gray-200 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-[10px] uppercase font-bold text-gray-700 tracking-wide">
          Live Tracking
        </span>
      </div>
    </div>
  );
}
