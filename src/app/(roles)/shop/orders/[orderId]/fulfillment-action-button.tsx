"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { updateShopOrderStatus } from "@/actions/shop/order-fulfillment-actions";
import { CheckCircleIcon } from "@/components/ui/icons";
import { SellerOrderDetail } from "@/types/shop";

export function FulfillmentActionButton({
  orderId,
  canMarkProcessing,
  canMarkReady,
  currentStatus,
  deliveryAssignment,
}: {
  orderId: string;
  canMarkProcessing: boolean;
  canMarkReady: boolean;
  currentStatus: string;
  deliveryAssignment?: SellerOrderDetail["deliveryAssignment"];
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<"PROCESSING" | "READY_FOR_DELIVERY" | null>(null);

  const handleUpdate = async (target: "PROCESSING" | "READY_FOR_DELIVERY") => {
    setIsLoading(true);
    setError(null);

    const res = await updateShopOrderStatus(orderId, target);
    setIsLoading(false);
    setShowConfirm(null);

    if (res.error) {
      setError(res.error);
    } else {
      router.refresh();
    }
  };

  if (currentStatus === "CANCELLED") {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
        <span className="font-bold">Order Cancelled:</span>
        <span>This order was cancelled. No fulfillment actions can be performed.</span>
      </div>
    );
  }

  if (currentStatus === "DELIVERED") {
    return (
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-center gap-2">
        <CheckCircleIcon className="w-5 h-5 text-purple-600 shrink-0" />
        <span>Order successfully delivered to customer. Transaction complete.</span>
      </div>
    );
  }

  if (currentStatus === "READY_FOR_DELIVERY" || currentStatus === "OUT_FOR_DELIVERY") {
    if (deliveryAssignment && deliveryAssignment.partnerName) {
      return (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
              <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Delivery Partner Assigned ✓</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-200/90 text-emerald-900">
              {deliveryAssignment.status.replace(/_/g, " ")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-emerald-900 border-t border-emerald-200/60">
            <div>
              <span className="text-emerald-700 font-medium">Assigned Driver: </span>
              <strong className="text-emerald-950 font-bold">{deliveryAssignment.partnerName}</strong>
            </div>
            {deliveryAssignment.partnerPhone && (
              <div>
                <span className="text-emerald-700 font-medium">Driver Phone: </span>
                <a
                  href={`tel:${deliveryAssignment.partnerPhone}`}
                  className="font-bold underline text-emerald-900"
                >
                  {deliveryAssignment.partnerPhone}
                </a>
              </div>
            )}
            {deliveryAssignment.vehicleType && (
              <div>
                <span className="text-emerald-700 font-medium">Vehicle: </span>
                <strong className="text-emerald-950 font-bold">
                  {deliveryAssignment.vehicleType}
                  {deliveryAssignment.vehicleNumber ? ` (${deliveryAssignment.vehicleNumber})` : ""}
                </strong>
              </div>
            )}
            {deliveryAssignment.assignedAt && (
              <div>
                <span className="text-emerald-700 font-medium">Assigned at: </span>
                <span className="font-semibold text-emerald-950">
                  {new Date(deliveryAssignment.assignedAt).toLocaleString("en-IN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-amber-800">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
          <span>Order Packed ✓ — Delivery Partner Assignment Pending</span>
        </div>
        <p className="text-amber-800 leading-relaxed">
          Store items have been packed. The system is actively finding and dispatching an eligible delivery partner.
        </p>
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

      {/* Primary Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {canMarkProcessing && (
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setShowConfirm("PROCESSING")}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
          >
            <span>Start Packaging (Mark as Processing)</span>
            <span>→</span>
          </button>
        )}

        {canMarkReady && (
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setShowConfirm("READY_FOR_DELIVERY")}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
          >
            <span>Mark Ready for Pickup / Delivery</span>
            <span>✓</span>
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">
              {showConfirm === "PROCESSING"
                ? "Start Order Packaging?"
                : "Confirm Ready for Delivery?"}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {showConfirm === "PROCESSING"
                ? "This will notify the customer that their items are currently being packaged and prepared at your store."
                : "This marks your store items as packed. The system will automatically assign an eligible delivery partner to handle pickup and dispatch."}
            </p>

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
                onClick={() => handleUpdate(showConfirm)}
                className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition-colors cursor-pointer ${
                  showConfirm === "PROCESSING"
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isLoading
                  ? showConfirm === "READY_FOR_DELIVERY"
                    ? "Assigning Delivery Partner..."
                    : "Updating..."
                  : showConfirm === "READY_FOR_DELIVERY"
                  ? "Pack & Auto-Assign Partner"
                  : "Yes, Confirm Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
