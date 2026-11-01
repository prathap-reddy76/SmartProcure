"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { confirmRentalBooking, cancelRentalBooking } from "@/actions/machinery/booking-actions";
import { requestMachineryReturn } from "@/actions/delivery/delivery-actions";

export function BookingDetailClient({ booking }: { booking: any }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnWindow, setReturnWindow] = useState("09:00 - 14:00");
  const [returnNotes, setReturnNotes] = useState("");

  const handleRequestReturn = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await requestMachineryReturn(booking.id, returnWindow, returnNotes);
      if (!res.success) {
        setError(res.error || "Failed to request return logistics");
      } else {
        setShowReturnModal(false);
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Error requesting return");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await confirmRentalBooking(booking.id);
      if (!res.success) {
        setError(res.error || "Failed to confirm booking");
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Error confirming booking");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await cancelRentalBooking(booking.id, cancelReason);
      if (!res.success) {
        setError(res.error || "Failed to cancel booking");
      } else {
        setShowCancelModal(false);
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Error cancelling booking");
    } finally {
      setSubmitting(false);
    }
  };

  // Steps for progress tracking
  const steps = [
    { key: "PENDING", label: "Requested" },
    { key: "OWNER_APPROVED", label: "Approved" },
    { key: "CONFIRMED", label: "Confirmed" },
    { key: "READY", label: "Ready" },
    { key: "ACTIVE", label: "Active" },
    { key: "COMPLETED", label: "Completed" },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case "PENDING":
        return 0;
      case "OWNER_APPROVED":
        return 1;
      case "CONFIRMED":
        return 2;
      case "READY":
        return 3;
      case "ACTIVE":
        return 4;
      case "COMPLETED":
        return 5;
      default:
        return -1;
    }
  };

  const currentStep = getStepIndex(booking.status);
  const isTerminalFailure = ["OWNER_REJECTED", "CANCELLED"].includes(booking.status);

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Progress Timeline Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">
          Rental Status Tracker
        </h2>

        {isTerminalFailure ? (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between">
            <div>
              <span className="font-bold text-base block">
                {booking.status === "OWNER_REJECTED" ? "Request Rejected by Owner" : "Booking Cancelled"}
              </span>
              <p className="text-xs text-red-600 mt-0.5">
                {booking.cancellationReason || "No specific reason provided."}
              </p>
            </div>
            <span className="text-2xl">❌</span>
          </div>
        ) : (
          <div className="relative">
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-gray-100">
              <div
                style={{ width: `${Math.max(10, ((currentStep + 1) / steps.length) * 100)}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 transition-all duration-500"
              />
            </div>

            <div className="grid grid-cols-6 text-center text-xs">
              {steps.map((st, i) => (
                <div key={st.key} className="space-y-1">
                  <div
                    className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center font-bold text-[11px] ${
                      i <= currentStep
                        ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span
                    className={`block font-medium ${
                      i <= currentStep ? "text-emerald-800 font-bold" : "text-gray-400"
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Details & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Machinery Info */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start gap-4">
            <div className="w-24 h-24 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
              {booking.machinery.images?.[0]?.url ? (
                <img
                  src={booking.machinery.images[0].url}
                  alt={booking.machinery.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl">🚜</span>
              )}
            </div>

            <div className="space-y-1 flex-1 min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                {booking.machinery.category?.name || "Machinery"}
              </div>
              <h3 className="text-xl font-bold text-gray-900">{booking.machinery.name}</h3>
              <p className="text-xs text-gray-500">
                Brand: <span className="font-semibold text-gray-700">{booking.machinery.brand}</span>
                {booking.machinery.modelNumber && ` • Model: ${booking.machinery.modelNumber}`}
              </p>
              <p className="text-xs text-gray-500">📍 Base Location: {booking.machinery.location}</p>

              <div className="pt-2">
                <Link
                  href={`/farmer/machinery/${booking.machinery.id}`}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline"
                >
                  View Machinery Specification Page →
                </Link>
              </div>
            </div>
          </div>

          {/* Time & Delivery Details */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Rental Schedule & Location
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                <span className="text-gray-400 block font-medium">START DATE & TIME</span>
                <span className="font-bold text-gray-900 text-sm">
                  {new Date(booking.startDateTime).toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                <span className="text-gray-400 block font-medium">RETURN DATE & TIME</span>
                <span className="font-bold text-gray-900 text-sm">
                  {new Date(booking.endDateTime).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1">
              <span className="text-gray-400 block font-medium">DELIVERY / FIELD ADDRESS</span>
              <p className="font-medium text-gray-900">
                {booking.deliveryAddress || "Self-pickup by farmer at owner site"}
              </p>
            </div>

            {booking.notes && (
              <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1">
                <span className="text-gray-400 block font-medium">FARMER NOTES</span>
                <p className="font-medium text-gray-700 italic">"{booking.notes}"</p>
              </div>
            )}

            {booking.ownerNotes && (
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs space-y-1">
                <span className="text-blue-600 block font-semibold">OWNER MESSAGE / NOTES</span>
                <p className="font-medium text-blue-900">{booking.ownerNotes}</p>
              </div>
            )}
          </div>

          {/* Machinery Logistics Section */}
          {booking.deliveryAssignments && booking.deliveryAssignments.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <span>🚚 Delivery & Return Logistics</span>
              </h3>

              <div className="space-y-3">
                {booking.deliveryAssignments.map((a: any) => (
                  <div
                    key={a.id}
                    className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">
                          {a.deliveryType === "MACHINERY_RETURN" ? "Equipment Return" : "Outbound Delivery"}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                          {a.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      {a.deliveryWindow && (
                        <p className="text-gray-500">Scheduled Window: 🕒 {a.deliveryWindow}</p>
                      )}
                      {a.partnerName && (
                        <p className="text-gray-700">
                          Partner: <strong className="text-gray-900">{a.partnerName}</strong>{" "}
                          {a.partnerPhone && `(📞 ${a.partnerPhone})`}
                        </p>
                      )}
                      {a.deliveryExceptionReason && (
                        <p className="text-orange-700 bg-orange-50 p-1.5 rounded text-[11px]">
                          ⚠️ Note: {a.deliveryExceptionReason}
                        </p>
                      )}
                    </div>

                    {a.deliveryCode && a.status !== "DELIVERED" && a.status !== "RETURNED" && (
                      <div className="bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl text-center">
                        <span className="text-[10px] text-amber-800 font-bold block uppercase">
                          Handover OTP
                        </span>
                        <span className="font-mono text-base font-black text-amber-950">
                          {a.deliveryCode}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Owner Contact Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                Machinery Owner
              </span>
              <h4 className="text-base font-bold text-gray-900 mt-0.5">{booking.owner.name}</h4>
              <p className="text-xs text-gray-500">{booking.owner.phone || "Phone on file"}</p>
            </div>

            {booking.owner.phone && (
              <a
                href={`tel:${booking.owner.phone}`}
                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span>📞 Call Owner</span>
              </a>
            )}
          </div>
        </div>

        {/* Financial Summary & Actions Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Payment Breakdown
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>
                  Base Rate ({booking.quantity}{" "}
                  {booking.rentalMode === "HOURLY"
                    ? "Hours"
                    : booking.rentalMode === "DAILY"
                    ? "Days"
                    : "Acres"}{" "}
                  @ ₹{booking.unitPrice})
                </span>
                <span className="font-semibold text-gray-900">₹{booking.baseAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Delivery Charge</span>
                <span className="font-semibold text-gray-900">₹{booking.deliveryCharge.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Security Deposit (Refundable)</span>
                <span className="font-semibold text-emerald-700">₹{booking.securityDeposit.toFixed(2)}</span>
              </div>

              <div className="border-t border-gray-200 pt-3 flex justify-between items-baseline">
                <span className="text-sm font-bold text-gray-900">Total Amount</span>
                <span className="text-xl font-extrabold text-emerald-700">
                  ₹{booking.totalAmount.toFixed(2)}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-gray-500">Payment Status:</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded-md ${
                    booking.paymentStatus === "PAID"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {booking.paymentStatus}
                </span>
              </div>
            </div>

            {/* Actions for Farmer */}
            <div className="border-t border-gray-100 pt-4 space-y-2">
              {booking.status === "OWNER_APPROVED" && (
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Confirming..." : "Confirm & Accept Booking"}
                </button>
              )}

              {["PENDING", "OWNER_APPROVED"].includes(booking.status) && (
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  disabled={submitting}
                  className="w-full py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel Reservation
                </button>
              )}

              {booking.status === "ACTIVE" && (
                <button
                  type="button"
                  onClick={() => setShowReturnModal(true)}
                  disabled={submitting}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>🔄 Request Equipment Return</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">
              Request Machinery Return Logistics
            </h3>
            <p className="text-xs text-gray-600">
              A delivery partner will be dispatched to your field to inspect, load, and return {booking.machinery.name} to the owner.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Preferred Pickup Window
                </label>
                <select
                  value={returnWindow}
                  onChange={(e) => setReturnWindow(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-300 bg-white"
                >
                  <option value="09:00 - 13:00">Morning (09:00 - 13:00)</option>
                  <option value="13:00 - 17:00">Afternoon (13:00 - 17:00)</option>
                  <option value="Tomorrow 09:00 - 13:00">Tomorrow Morning (09:00 - 13:00)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Pickup Location Notes
                </label>
                <textarea
                  rows={2}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="e.g. Near the main gate or tractor shed"
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-300"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestReturn}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs disabled:opacity-50"
              >
                {submitting ? "Requesting..." : "Confirm Return Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">
              Cancel Booking #{booking.bookingNumber}
            </h3>
            <p className="text-xs text-gray-600">
              Are you sure you want to cancel this machinery reservation?
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Reason for Cancellation
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Schedule changed, inclement weather"
                className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleCancelSubmit}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs disabled:opacity-50"
              >
                {submitting ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
