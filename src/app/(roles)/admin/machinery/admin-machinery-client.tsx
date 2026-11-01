"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { adminApproveMachinery } from "@/actions/machinery/machinery-actions";

export interface AdminMachineryItem {
  id: string;
  name: string;
  brand: string | null;
  modelNumber?: string | null;
  categoryName: string;
  ownerName: string;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  location: string;
  pricePerDay?: number | null;
  pricePerHour?: number | null;
  pricePerAcre?: number | null;
  isAvailable: boolean;
  isApproved: boolean;
  isActive: boolean;
  bookingsCount: number;
  createdAt: string;
}

export function AdminMachineryClient({ initialListings }: { initialListings: AdminMachineryItem[] }) {
  const router = useRouter();
  const [listings, setListings] = useState(initialListings);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED">("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleToggleApproval = async (id: string, currentApproved: boolean) => {
    setError(null);
    setLoadingId(id);
    const newStatus = !currentApproved;

    try {
      const res = await adminApproveMachinery(id, newStatus);
      if (!res.success) {
        setError(res.error || "Failed to update approval");
      } else {
        setListings((prev) =>
          prev.map((m) => (m.id === id ? { ...m, isApproved: newStatus } : m))
        );
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Error updating approval");
    } finally {
      setLoadingId(null);
    }
  };

  const filtered = listings.filter((m) => {
    if (filter === "PENDING" && m.isApproved) return false;
    if (filter === "APPROVED" && !m.isApproved) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = m.name.toLowerCase().includes(q);
      const matchBrand = (m.brand || "").toLowerCase().includes(q);
      const matchOwner = m.ownerName.toLowerCase().includes(q);
      const matchCategory = m.categoryName.toLowerCase().includes(q);
      const matchLoc = m.location.toLowerCase().includes(q);
      return matchName || matchBrand || matchOwner || matchCategory || matchLoc;
    }

    return true;
  });

  const totalListings = listings.length;
  const approvedListings = listings.filter((m) => m.isApproved).length;
  const pendingApproval = listings.filter((m) => !m.isApproved).length;
  const totalBookings = listings.reduce((sum, m) => sum + m.bookingsCount, 0);

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
            Total Machinery
          </span>
          <div className="text-2xl font-black text-gray-900 mt-2">{totalListings}</div>
          <span className="text-xs text-gray-500 mt-1 block">Registered listings</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 block">
            Approved & Verified
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-2">{approvedListings}</div>
          <span className="text-xs text-emerald-600 mt-1 block">Available for farmers</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 block">
            Awaiting Approval
          </span>
          <div className="text-2xl font-black text-amber-700 mt-2">{pendingApproval}</div>
          <span className="text-xs text-amber-600 mt-1 block">Action required</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 block">
            Platform Rentals
          </span>
          <div className="text-2xl font-black text-blue-700 mt-2">{totalBookings}</div>
          <span className="text-xs text-blue-600 mt-1 block">Total bookings created</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl cursor-pointer ${
              filter === "ALL"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All ({totalListings})
          </button>
          <button
            onClick={() => setFilter("PENDING")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl cursor-pointer ${
              filter === "PENDING"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Awaiting Approval ({pendingApproval})
          </button>
          <button
            onClick={() => setFilter("APPROVED")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl cursor-pointer ${
              filter === "APPROVED"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Approved ({approvedListings})
          </button>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by equipment, owner, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>
      </div>

      {/* Machinery Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Machinery</th>
                <th className="py-3.5 px-4">Owner</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Pricing</th>
                <th className="py-3.5 px-4 text-center">Bookings</th>
                <th className="py-3.5 px-4">Verification</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    No machinery listings match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Machinery info */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900 text-sm">{m.name}</div>
                      <div className="text-gray-500 text-[11px]">
                        {m.brand} {m.modelNumber ? `• ${m.modelNumber}` : ""} • {m.categoryName}
                      </div>
                    </td>

                    {/* Owner info */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-800">{m.ownerName}</div>
                      <div className="text-gray-500 text-[11px]">{m.ownerEmail || m.ownerPhone || "—"}</div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 text-gray-600">
                      📍 {m.location}
                    </td>

                    {/* Pricing */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5">
                        {m.pricePerDay && (
                          <span className="font-medium text-emerald-700">₹{m.pricePerDay}/day</span>
                        )}
                        {m.pricePerHour && (
                          <span className="text-[11px] text-gray-600">₹{m.pricePerHour}/hr</span>
                        )}
                        {m.pricePerAcre && (
                          <span className="text-[11px] text-gray-600">₹{m.pricePerAcre}/acre</span>
                        )}
                      </div>
                    </td>

                    {/* Bookings */}
                    <td className="py-3.5 px-4 text-center font-bold text-gray-700">
                      {m.bookingsCount}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {m.isApproved ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          Pending Approval
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleApproval(m.id, m.isApproved)}
                        disabled={loadingId === m.id}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer ${
                          m.isApproved
                            ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        {loadingId === m.id
                          ? "Saving..."
                          : m.isApproved
                          ? "Revoke Approval"
                          : "Approve Listing"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
