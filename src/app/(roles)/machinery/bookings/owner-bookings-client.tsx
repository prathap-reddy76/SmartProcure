"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveRentalBooking,
  rejectRentalBooking,
  markRentalReady,
  startRental,
  completeRental,
} from "@/actions/machinery/booking-actions";

export interface OwnerBookingItem {
  id: string;
  bookingNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  startDateTime: string;
  endDateTime: string;
  rentalMode: string;
  quantity: number;
  unitPrice: number;
  baseAmount: number;
  deliveryCharge: number;
  securityDeposit: number;
  totalAmount: number;
  deliveryAddress?: string | null;
  notes?: string | null;
  ownerNotes?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  machinery: {
    id: string;
    name: string;
    categoryName: string;
    image?: string | null;
  };
  farmer: {
    name: string;
    phone?: string | null;
  };
}

export function OwnerBookingsClient({ initialBookings }: { initialBookings: OwnerBookingItem[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [approveModalBooking, setApproveModalBooking] = useState<OwnerBookingItem | null>(null);
  const [ownerNotes, setOwnerNotes] = useState("");

  const [rejectModalBooking, setRejectModalBooking] = useState<OwnerBookingItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const filtered = initialBookings.filter((b) => {
    if (filter === "ALL") return true;
    if (filter === "ACTION_NEEDED") return b.status === "PENDING";
    if (filter === "ONGOING") return ["CONFIRMED", "READY", "ACTIVE"].includes(b.status);
    return b.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">Pending Review</span>;
      case "OWNER_APPROVED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">Awaiting Farmer Confirm</span>;
      case "CONFIRMED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">Confirmed</span>;
      case "READY":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">Ready for Dispatch</span>;
      case "ACTIVE":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse">Active on Field</span>;
      case "COMPLETED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200">Completed</span>;
      case "OWNER_REJECTED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">Rejected</span>;
      case "CANCELLED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 border border-gray-200">Cancelled by Farmer</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const handleApproveSubmit = async () => {
    if (!approveModalBooking) return;
    setError(null);
    setLoadingId(approveModalBooking.id);
    try {
      const res = await approveRentalBooking(approveModalBooking.id, ownerNotes.trim() || undefined);
      if (!res.success) {
        setError(res.error || "Failed to approve booking");
      } else {
        setApproveModalBooking(null);
        setOwnerNotes("");
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Error approving booking");
    } finally {
      setLoadingId(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModalBooking) return;
    setError(null);
    setLoadingId(rejectModalBooking.id);
    try {
      const res = await rejectRentalBooking(rejectModalBooking.id, rejectReason.trim() || undefined);
      if (!res.success) {
        setError(res.error || "Failed to reject booking");
      } else {
        setRejectModalBooking(null);
        setRejectReason("");
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Error rejecting booking");
    } finally {
      setLoadingId(null);
    }
  };

  const handleMarkReady = async (id: string) => {
    setError(null);
    setLoadingId(id);
    try {
      const res = await markRentalReady(id);
      if (!res.success) {
        setError(res.error || "Failed to mark ready");
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Error updating booking");
    } finally {
      setLoadingId(null);
    }
  };

  const handleStartRental = async (id: string) => {
    setError(null);
    setLoadingId(id);
    try {
      const res = await startRental(id);
      if (!res.success) {
        setError(res.error || "Failed to start rental");
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Error starting rental");
    } finally {
      setLoadingId(null);
    }
  };

  const handleCompleteRental = async (id: string) => {
    setError(null);
    setLoadingId(id);
    try {
      const res = await completeRental(id);
      if (!res.success) {
        setError(res.error || "Failed to complete rental");
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Error completing rental");
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

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {[
          { key: "ALL", label: `All (${initialBookings.length})` },
          { key: "ACTION_NEEDED", label: "Requires Approval" },
          { key: "ONGOING", label: "Active & In Progress" },
          { key: "COMPLETED", label: "Completed" },
          { key: "CANCELLED", label: "Cancelled" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
              filter === tab.key
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl p-8">
          <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto text-xl mb-3">
            📋
          </div>
          <h3 className="text-base font-bold text-gray-900">No Rental Requests</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            No booking requests match your current status filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => (
            <div
              key={b.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs hover:border-amber-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              {/* Left Column: Machine, Farmer, Dates */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-gray-500">
                    #{b.bookingNumber}
                  </span>
                  {getStatusBadge(b.status)}
                  <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium">
                    {b.rentalMode === "HOURLY"
                      ? "Hourly"
                      : b.rentalMode === "DAILY"
                      ? "Daily"
                      : "Per Acre"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {b.machinery.image ? (
                      <img
                        src={b.machinery.image}
                        alt={b.machinery.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl">🚜</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 truncate">
                      {b.machinery.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Category: {b.machinery.categoryName}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 pt-1">
                  <div>
                    👤 <span className="font-semibold text-gray-800">Farmer:</span> {b.farmer.name}
                    {b.farmer.phone && (
                      <a
                        href={`tel:${b.farmer.phone}`}
                        className="ml-2 text-amber-700 font-medium hover:underline"
                      >
                        ({b.farmer.phone})
                      </a>
                    )}
                  </div>
                  <div>
                    📅 <span className="font-semibold text-gray-800">Dates:</span>{" "}
                    {new Date(b.startDateTime).toLocaleDateString()} -{" "}
                    {new Date(b.endDateTime).toLocaleDateString()}
                  </div>
                  {b.deliveryAddress && (
                    <div className="sm:col-span-2">
                      📍 <span className="font-semibold text-gray-800">Delivery:</span>{" "}
                      {b.deliveryAddress}
                    </div>
                  )}
                  {b.notes && (
                    <div className="sm:col-span-2 italic text-gray-500">
                      Farmer Note: "{b.notes}"
                    </div>
                  )}
                  {b.ownerNotes && (
                    <div className="sm:col-span-2 font-medium text-blue-700">
                      Your Note: "{b.ownerNotes}"
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Financials & Action Buttons */}
              <div className="flex flex-col lg:items-end justify-between border-t lg:border-t-0 pt-4 lg:pt-0 border-gray-100 gap-3 shrink-0">
                <div className="lg:text-right">
                  <div className="text-xl font-black text-amber-700">
                    ₹{b.totalAmount.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Base: ₹{b.baseAmount.toFixed(2)} | Deposit: ₹{b.securityDeposit.toFixed(2)}
                  </div>
                </div>

                {/* State Machine Action Transitions */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* PENDING -> Approve or Reject */}
                  {b.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => setApproveModalBooking(b)}
                        disabled={loadingId === b.id}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        ✓ Approve Request
                      </button>
                      <button
                        onClick={() => setRejectModalBooking(b)}
                        disabled={loadingId === b.id}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-colors cursor-pointer"
                      >
                        ✕ Reject
                      </button>
                    </>
                  )}

                  {/* OWNER_APPROVED -> Waiting for farmer confirmation */}
                  {b.status === "OWNER_APPROVED" && (
                    <span className="text-xs text-blue-700 font-medium bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                      Awaiting Farmer Confirmation
                    </span>
                  )}

                  {/* CONFIRMED -> Mark Ready */}
                  {b.status === "CONFIRMED" && (
                    <button
                      onClick={() => handleMarkReady(b.id)}
                      disabled={loadingId === b.id}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      {loadingId === b.id ? "Updating..." : "Ready for Handover / Dispatch"}
                    </button>
                  )}

                  {/* READY -> Start Rental */}
                  {b.status === "READY" && (
                    <button
                      onClick={() => handleStartRental(b.id)}
                      disabled={loadingId === b.id}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      {loadingId === b.id ? "Starting..." : "Start Field Rental"}
                    </button>
                  )}

                  {/* ACTIVE -> Complete Rental */}
                  {b.status === "ACTIVE" && (
                    <button
                      onClick={() => handleCompleteRental(b.id)}
                      disabled={loadingId === b.id}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      {loadingId === b.id ? "Completing..." : "Complete & Return"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve Modal */}
      {approveModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">
              Approve Rental Request #{approveModalBooking.bookingNumber}
            </h3>
            <p className="text-xs text-gray-600">
              Accept reservation for <strong>{approveModalBooking.machinery.name}</strong> requested
              by <strong>{approveModalBooking.farmer.name}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Instructions or Message for Farmer (Optional)
              </label>
              <textarea
                rows={3}
                value={ownerNotes}
                onChange={(e) => setOwnerNotes(e.target.value)}
                placeholder="e.g. Equipment is fueled up and ready. Driver Ramesh (+91-9876543210) will drop it off at 8:30 AM."
                className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApproveModalBooking(null)}
                className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveSubmit}
                disabled={loadingId === approveModalBooking.id}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs disabled:opacity-50"
              >
                {loadingId === approveModalBooking.id ? "Approving..." : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">
              Reject Rental Request #{rejectModalBooking.bookingNumber}
            </h3>
            <p className="text-xs text-gray-600">
              Are you sure you want to decline this request from {rejectModalBooking.farmer.name}?
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Reason for Rejection (Optional)
              </label>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Equipment undergoing scheduled maintenance on this date"
                className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalBooking(null)}
                className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                Keep Request
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={loadingId === rejectModalBooking.id}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs disabled:opacity-50"
              >
                {loadingId === rejectModalBooking.id ? "Rejecting..." : "Decline Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
