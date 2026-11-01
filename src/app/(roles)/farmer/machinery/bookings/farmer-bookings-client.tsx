"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { confirmRentalBooking, cancelRentalBooking } from "@/actions/machinery/booking-actions";

export interface BookingItem {
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
    brand: string | null;
    modelNumber?: string | null;
    categoryName: string;
    location: string;
    image?: string | null;
  };
  owner: {
    name: string;
    phone?: string | null;
  };
}

export function FarmerBookingsClient({ initialBookings }: { initialBookings: BookingItem[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cancelModalBooking, setCancelModalBooking] = useState<BookingItem | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filteredBookings = initialBookings.filter((b) => {
    if (filter === "ALL") return true;
    if (filter === "ACTIVE_FLOW") {
      return ["PENDING", "OWNER_APPROVED", "CONFIRMED", "READY", "ACTIVE"].includes(b.status);
    }
    return b.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">Pending Owner Review</span>;
      case "OWNER_APPROVED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">Approved by Owner</span>;
      case "CONFIRMED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">Confirmed</span>;
      case "READY":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">Ready for Dispatch</span>;
      case "ACTIVE":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse">Active Rental</span>;
      case "COMPLETED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200">Completed</span>;
      case "OWNER_REJECTED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">Owner Rejected</span>;
      case "CANCELLED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 border border-gray-200">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const handleConfirm = async (bookingId: string) => {
    setError(null);
    setActionLoading(bookingId);
    try {
      const res = await confirmRentalBooking(bookingId);
      if (!res.success) {
        setError(res.error || "Failed to confirm booking");
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Error confirming booking");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancelModalBooking) return;
    setError(null);
    setActionLoading(cancelModalBooking.id);
    try {
      const res = await cancelRentalBooking(cancelModalBooking.id, cancelReason);
      if (!res.success) {
        setError(res.error || "Failed to cancel booking");
      } else {
        setCancelModalBooking(null);
        setCancelReason("");
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Error cancelling booking");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {[
          { key: "ALL", label: `All (${initialBookings.length})` },
          { key: "ACTIVE_FLOW", label: "In Progress" },
          { key: "PENDING", label: "Pending" },
          { key: "OWNER_APPROVED", label: "Awaiting Confirmation" },
          { key: "ACTIVE", label: "Active" },
          { key: "COMPLETED", label: "Completed" },
          { key: "CANCELLED", label: "Cancelled" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
              filter === tab.key
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl p-8">
          <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto text-xl mb-3">
            🚜
          </div>
          <h3 className="text-base font-bold text-gray-900">No Rental Bookings Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            You don't have any machinery reservations matching this status filter.
          </p>
          <div className="mt-4">
            <Link
              href="/farmer/machinery"
              className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Browse Available Machinery
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs hover:border-emerald-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              {/* Left Column: Machine info & Dates */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {b.machinery.image ? (
                    <img
                      src={b.machinery.image}
                      alt={b.machinery.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">🚜</span>
                  )}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-gray-500">
                      #{b.bookingNumber}
                    </span>
                    {getStatusBadge(b.status)}
                    <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium">
                      {b.rentalMode === "HOURLY"
                        ? "Hourly"
                        : b.rentalMode === "DAILY"
                        ? "Daily"
                        : "Per Acre"}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 truncate">
                    {b.machinery.name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span>
                      📅 {new Date(b.startDateTime).toLocaleDateString()} to{" "}
                      {new Date(b.endDateTime).toLocaleDateString()}
                    </span>
                    <span>📍 {b.machinery.location}</span>
                    <span>
                      👤 Owner: <span className="font-medium text-gray-700">{b.owner.name}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Pricing & Actions */}
              <div className="flex flex-col md:items-end justify-between border-t md:border-t-0 pt-4 md:pt-0 border-gray-100 gap-3 shrink-0">
                <div className="md:text-right">
                  <div className="text-lg font-bold text-emerald-700">
                    ₹{b.totalAmount.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Base: ₹{b.baseAmount.toFixed(2)} | Deposit: ₹{b.securityDeposit.toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/farmer/machinery/bookings/${b.id}`}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                  >
                    Details
                  </Link>

                  {/* If OWNER_APPROVED, farmer can confirm */}
                  {b.status === "OWNER_APPROVED" && (
                    <button
                      onClick={() => handleConfirm(b.id)}
                      disabled={actionLoading === b.id}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {actionLoading === b.id ? "Confirming..." : "Confirm Booking"}
                    </button>
                  )}

                  {/* Can cancel if PENDING or OWNER_APPROVED */}
                  {["PENDING", "OWNER_APPROVED"].includes(b.status) && (
                    <button
                      onClick={() => setCancelModalBooking(b)}
                      disabled={actionLoading === b.id}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">
              Cancel Reservation #{cancelModalBooking.bookingNumber}
            </h3>
            <p className="text-xs text-gray-600">
              Are you sure you want to cancel this booking for {cancelModalBooking.machinery.name}?
              The reservation slot will be released back to the owner.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Schedule changed, weather delay"
                className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleCancelSubmit}
                disabled={actionLoading === cancelModalBooking.id}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs disabled:opacity-50"
              >
                {actionLoading === cancelModalBooking.id ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
