"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  confirmPickup,
  markOutForDelivery,
  markDelivered,
  recordDeliveryException,
  rescheduleDelivery,
} from "@/actions/delivery/delivery-actions";
import { CheckCircleIcon, TruckIcon } from "@/components/ui/icons";

export function DeliveryActionPanel({
  assignmentId,
  orderId,
  canConfirmPickup,
  canMarkOutForDelivery,
  canMarkDelivered,
  canReportException = true,
  canReschedule = true,
  currentStatus,
  paymentMethod = "ONLINE",
  paymentStatus = "PAID",
  totalAmount,
  deliveryWindow,
  deliveryType = "ORDER",
}: {
  assignmentId: string;
  orderId?: string | null;
  canConfirmPickup: boolean;
  canMarkOutForDelivery: boolean;
  canMarkDelivered: boolean;
  canReportException?: boolean;
  canReschedule?: boolean;
  currentStatus: string;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  totalAmount: number;
  deliveryWindow?: string | null;
  deliveryType?: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [exceptionReason, setExceptionReason] = useState("");
  const [newWindow, setNewWindow] = useState(deliveryWindow || "09:00 - 12:00");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [showConfirm, setShowConfirm] = useState<"PICKUP" | "OUT" | "DELIVER" | "EXCEPTION" | "RESCHEDULE" | null>(null);

  const identifier = assignmentId || orderId || "";

  const handlePickup = async () => {
    setIsLoading(true);
    setError(null);
    const res = await confirmPickup(identifier);
    setIsLoading(false);
    setShowConfirm(null);
    if (res.error) setError(res.error);
    else router.refresh();
  };

  const handleOutForDelivery = async () => {
    setIsLoading(true);
    setError(null);
    const res = await markOutForDelivery(identifier);
    setIsLoading(false);
    setShowConfirm(null);
    if (res.error) setError(res.error);
    else router.refresh();
  };

  const handleDelivered = async () => {
    if (!otpCode || otpCode.trim().length !== 6) {
      setError("Please enter the 6-digit delivery confirmation code provided by the customer.");
      return;
    }

    setIsLoading(true);
    setError(null);
    const res = await markDelivered(identifier, otpCode, {
      recipientName: recipientName.trim() || undefined,
    });
    setIsLoading(false);
    setShowConfirm(null);
    if (res.error) setError(res.error);
    else router.refresh();
  };

  const handleException = async () => {
    if (!exceptionReason || exceptionReason.trim().length < 3) {
      setError("Please enter a valid reason for this delivery exception.");
      return;
    }

    setIsLoading(true);
    setError(null);
    const res = await recordDeliveryException(assignmentId, exceptionReason);
    setIsLoading(false);
    setShowConfirm(null);
    if (res.error) setError(res.error);
    else router.refresh();
  };

  const handleReschedule = async () => {
    if (!newWindow || !newWindow.trim()) {
      setError("Please select or enter a delivery window.");
      return;
    }

    setIsLoading(true);
    setError(null);
    const res = await rescheduleDelivery(assignmentId, newWindow, undefined, rescheduleReason);
    setIsLoading(false);
    setShowConfirm(null);
    if (res.error) setError(res.error);
    else router.refresh();
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (currentStatus === "DELIVERED" || currentStatus === "RETURNED") {
    return (
      <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-900">
        <CheckCircleIcon className="w-6 h-6 text-emerald-600 shrink-0" />
        <div>
          <div className="font-bold text-sm text-emerald-950">
            {currentStatus === "RETURNED" ? "Machinery Return Completed" : "Delivery Completed"}
          </div>
          <p className="text-emerald-800">
            Item handover has been successfully verified.
            {paymentMethod === "COD" && ` Payment of ${formatPrice(totalAmount)} collected in cash.`}
          </p>
        </div>
      </div>
    );
  }

  if (currentStatus === "CANCELLED") {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800">
        <strong>Delivery Cancelled:</strong> This delivery was cancelled. Please return any picked-up items to dispatch.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Step 1: Confirm Pickup */}
      {canConfirmPickup && (
        <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-3">
          <div className="text-xs text-amber-900">
            <strong className="block font-bold">Step 1: Pick up from Origin</strong>
            <span>
              {deliveryType === "MACHINERY_RETURN"
                ? "Arrive at the farmer's field/location and inspect machinery before loading."
                : "Arrive at the merchant store/yard and collect all packaged items."}
            </span>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setShowConfirm("PICKUP")}
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Confirm Pickup</span>
            <span>📦</span>
          </button>
        </div>
      )}

      {/* Step 2: Depart Out for Delivery */}
      {canMarkOutForDelivery && (
        <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl space-y-3">
          <div className="text-xs text-indigo-900">
            <strong className="block font-bold">Step 2: Depart for Destination</strong>
            <span>
              {deliveryType === "MACHINERY_RETURN"
                ? "Machinery is loaded. Depart on return route to owner's yard."
                : "Items are in your vehicle. Depart on your delivery route to the customer."}
            </span>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setShowConfirm("OUT")}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <TruckIcon className="w-4 h-4" />
            <span>Start Route (Mark In Transit)</span>
          </button>
        </div>
      )}

      {/* Step 3: Confirm Delivery Handover with OTP */}
      {canMarkDelivered && (
        <div className="p-5 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-4">
          <div className="text-xs text-blue-950 space-y-1">
            <strong className="block text-sm font-bold">Step 3: Handover Verification</strong>
            <p className="text-blue-800">
              Verify customer identity at destination before release.
              {paymentMethod === "COD" && paymentStatus !== "PAID" ? (
                <span className="block mt-1 font-bold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-md inline-block">
                  💵 Collect Cash on Delivery: {formatPrice(totalAmount)}
                </span>
              ) : (
                <span className="block mt-1 font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-md inline-block">
                  ✅ Payment Status: {paymentStatus || "PAID"} ({paymentMethod || "ONLINE"})
                </span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
            <div>
              <label htmlFor="otp-input" className="block text-xs font-bold text-gray-700 mb-1">
                6-Digit Confirmation Code (OTP):
              </label>
              <input
                id="otp-input"
                type="text"
                maxLength={6}
                placeholder="e.g. 549120"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl font-mono text-center text-base tracking-widest font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="recipient-input" className="block text-xs font-bold text-gray-700 mb-1">
                Recipient Name (Optional):
              </label>
              <input
                id="recipient-input"
                type="text"
                placeholder="Person receiving delivery"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={isLoading || otpCode.length !== 6}
            onClick={() => setShowConfirm("DELIVER")}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Complete Delivery Handover</span>
            <span>✓</span>
          </button>
        </div>
      )}

      {/* Exception & Reschedule Actions Bar */}
      <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
        {canReportException && (
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setShowConfirm("EXCEPTION")}
            className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg border border-red-200 transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            <span>⚠️ Report Issue / Exception</span>
          </button>
        )}

        {canReschedule && (
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setShowConfirm("RESCHEDULE")}
            className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg border border-gray-200 transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            <span>📅 Reschedule Window</span>
          </button>
        )}
      </div>

      {/* Confirmation Modals */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">
              {showConfirm === "PICKUP"
                ? "Confirm Pickup?"
                : showConfirm === "OUT"
                ? "Depart for Delivery?"
                : showConfirm === "DELIVER"
                ? "Confirm Delivery Handover?"
                : showConfirm === "EXCEPTION"
                ? "Report Delivery Exception"
                : "Reschedule Delivery Window"}
            </h3>

            {showConfirm === "PICKUP" && (
              <p className="text-xs text-gray-600 leading-relaxed">
                Confirm that you have physically inspected and collected the package or equipment.
              </p>
            )}

            {showConfirm === "OUT" && (
              <p className="text-xs text-gray-600 leading-relaxed">
                This updates the recipient to show that you are actively en route to their location.
              </p>
            )}

            {showConfirm === "DELIVER" && (
              <p className="text-xs text-gray-600 leading-relaxed">
                Confirm that handover is complete
                {paymentMethod === "COD" ? ` and cash of ${formatPrice(totalAmount)} was collected` : ""}.
              </p>
            )}

            {showConfirm === "EXCEPTION" && (
              <div className="space-y-3">
                <p className="text-xs text-gray-600">
                  Select or enter the reason preventing successful delivery:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Customer not reachable",
                    "Address inaccessible / road flooded",
                    "Inclement weather",
                    "Customer requested later delivery",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setExceptionReason(preset)}
                      className="text-[11px] px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  placeholder="Explain the issue..."
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            )}

            {showConfirm === "RESCHEDULE" && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-700">
                  New Delivery Window:
                </label>
                <select
                  value={newWindow}
                  onChange={(e) => setNewWindow(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900"
                >
                  <option value="09:00 - 12:00">Morning (09:00 - 12:00)</option>
                  <option value="12:00 - 15:00">Afternoon (12:00 - 15:00)</option>
                  <option value="15:00 - 18:00">Evening (15:00 - 18:00)</option>
                  <option value="Tomorrow 09:00 - 14:00">Tomorrow Morning (09:00 - 14:00)</option>
                </select>
                <input
                  type="text"
                  placeholder="Reason for reschedule (optional)"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-xl text-xs text-gray-900"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setShowConfirm(null)}
                className="px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  if (showConfirm === "PICKUP") handlePickup();
                  else if (showConfirm === "OUT") handleOutForDelivery();
                  else if (showConfirm === "DELIVER") handleDelivered();
                  else if (showConfirm === "EXCEPTION") handleException();
                  else if (showConfirm === "RESCHEDULE") handleReschedule();
                }}
                className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition-colors cursor-pointer ${
                  showConfirm === "EXCEPTION"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isLoading ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
