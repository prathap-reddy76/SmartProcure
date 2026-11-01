"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toggleMachineryAvailability } from "@/actions/machinery/machinery-actions";

export interface OwnerMachineryItem {
  id: string;
  name: string;
  brand: string | null;
  modelNumber?: string | null;
  categoryName: string;
  location: string;
  supportsHourly: boolean;
  pricePerHour?: number | null;
  supportsDaily: boolean;
  pricePerDay?: number | null;
  supportsPerAcre: boolean;
  pricePerAcre?: number | null;
  securityDeposit: number;
  deliveryCharge: number;
  isAvailable: boolean;
  isApproved: boolean;
  bookingsCount: number;
  images: string[];
  createdAt: string;
  specifications?: Record<string, unknown> | null;
}

export function MyMachineryClient({ initialListings }: { initialListings: OwnerMachineryItem[] }) {
  const router = useRouter();
  const [listings, setListings] = useState(initialListings);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleToggleAvailability = async (id: string) => {
    setError(null);
    setLoadingId(id);
    try {
      const res = await toggleMachineryAvailability(id);
      if (!res.success) {
        setError(res.error || "Failed to update availability");
      } else {
        setListings((prev) =>
          prev.map((m) => (m.id === id ? { ...m, isAvailable: !!res.isAvailable } : m))
        );
        router.refresh();
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Error toggling availability");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {listings.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl p-8 space-y-4">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl">
            🚜
          </div>
          <h3 className="text-lg font-bold text-gray-900">Your Machinery Fleet is Empty</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            List your tractors, rotavators, harvesters, ploughs, or hydraulic trucks with detailed
            specifications to start earning rental income from local farmers.
          </p>
          <div className="pt-2">
            <Link
              href="/machinery/my-machinery/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <span>+ List New Machinery</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((m) => (
            <div
              key={m.id}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs hover:border-amber-400 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Image & Badges */}
                <div className="relative h-44 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {m.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.images[0]}
                      alt={m.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl">🚜</span>
                  )}

                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 text-gray-800 shadow-xs backdrop-blur-xs">
                      {m.categoryName}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex flex-col gap-1">
                    {m.isApproved ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                        ✓ Approved
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 shadow-xs">
                        Under Review
                      </span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 leading-snug">{m.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {m.brand} {m.modelNumber ? `• Model ${m.modelNumber}` : ""}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">📍 {m.location}</p>
                  </div>

                  {/* Pricing Matrix */}
                  <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-1.5 text-xs">
                    {m.supportsHourly && m.pricePerHour && (
                      <span className="bg-gray-50 px-2 py-0.5 rounded text-gray-700 font-medium">
                        ₹{m.pricePerHour}/hr
                      </span>
                    )}
                    {m.supportsDaily && m.pricePerDay && (
                      <span className="bg-gray-50 px-2 py-0.5 rounded text-gray-700 font-medium">
                        ₹{m.pricePerDay}/day
                      </span>
                    )}
                    {m.supportsPerAcre && m.pricePerAcre && (
                      <span className="bg-gray-50 px-2 py-0.5 rounded text-gray-700 font-medium">
                        ₹{m.pricePerAcre}/acre
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Controls */}
              <div className="p-5 pt-0 border-t border-gray-100 mt-2 space-y-3">
                <div className="pt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>
                    <strong className="text-gray-900">{m.bookingsCount}</strong> rentals booked
                  </span>

                  {/* Availability Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleAvailability(m.id)}
                    disabled={loadingId === m.id}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      m.isAvailable
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {loadingId === m.id
                      ? "Updating..."
                      : m.isAvailable
                      ? "● Available"
                      : "○ Unavailable"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/machinery/my-machinery/${m.id}/edit`}
                    className="w-full text-center py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-colors"
                  >
                    ✏️ Edit Specs
                  </Link>

                  <Link
                    href={`/farmer/machinery/${m.id}`}
                    target="_blank"
                    className="w-full text-center py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs rounded-xl transition-colors"
                  >
                    👁️ View Listing
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
