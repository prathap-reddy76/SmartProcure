"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cancelAdminOrder } from "@/actions/admin/admin-order-actions";
import {
  assignDelivery,
  reassignDelivery,
  retryOrderDeliveryAssignment,
} from "@/actions/delivery/delivery-actions";
import { AdminPartnerItem } from "@/types/delivery";
import { DeliveryTrackingMapWrapper } from "@/components/farmer/delivery-tracking-map-wrapper";
import { CheckCircleIcon, TruckIcon } from "@/components/ui/icons";

export function AdminOrderDetailClient({
  order,
  partners = [],
}: {
  order: any;
  partners?: AdminPartnerItem[];
}) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Delivery Assignment Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [isOverride, setIsOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);
  const [isRetryingAuto, setIsRetryingAuto] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      setErrorMsg("Please provide a reason for cancellation");
      return;
    }

    setIsCancelling(true);
    setErrorMsg(null);
    try {
      const res = await cancelAdminOrder(order.id, cancelReason);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg("Order cancelled successfully");
        setShowCancelModal(false);
        router.refresh();
      }
    } catch {
      setErrorMsg("An unexpected error occurred while cancelling order");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleAssignPartner = async () => {
    if (!selectedPartnerId) {
      setErrorMsg("Please select a delivery partner to assign.");
      return;
    }

    setIsSubmittingDelivery(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const targetId = order.deliveryAssignment?.id || order.id;
      const res = await assignDelivery(targetId, selectedPartnerId, {
        isOverride,
        overrideReason: isOverride ? overrideReason : undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to assign delivery partner.");
      } else {
        setSuccessMsg(res.message || "Delivery partner assigned successfully.");
        setShowAssignModal(false);
        setSelectedPartnerId("");
        setIsOverride(false);
        setOverrideReason("");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Error assigning delivery partner");
    } finally {
      setIsSubmittingDelivery(false);
    }
  };

  const handleReassignPartner = async () => {
    if (!selectedPartnerId) {
      setErrorMsg("Please select a new delivery partner.");
      return;
    }

    setIsSubmittingDelivery(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const targetId = order.deliveryAssignment?.id || order.id;
      const res = await reassignDelivery(targetId, selectedPartnerId, reassignReason, {
        isOverride,
        overrideReason: isOverride ? overrideReason : undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to reassign delivery partner.");
      } else {
        setSuccessMsg(res.message || "Delivery partner reassigned successfully.");
        setShowReassignModal(false);
        setSelectedPartnerId("");
        setIsOverride(false);
        setOverrideReason("");
        setReassignReason("");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Error reassigning delivery partner");
    } finally {
      setIsSubmittingDelivery(false);
    }
  };

  const handleRetryAuto = async () => {
    setIsRetryingAuto(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await retryOrderDeliveryAssignment(order.id);
      if (res.assigned) {
        setSuccessMsg(res.message);
        router.refresh();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to retry automatic assignment");
    } finally {
      setIsRetryingAuto(false);
    }
  };

  const isCancellable = order.status !== "DELIVERED" && order.status !== "CANCELLED";
  const assignment = order.deliveryAssignment;
  const partner = assignment?.deliveryPartner;

  const isAwaitingAssignment =
    order.status === "READY_FOR_DELIVERY" &&
    (!assignment || !assignment.deliveryPartnerId || assignment.status === "PENDING_ASSIGNMENT");

  const canReassign =
    Boolean(partner) &&
    order.status !== "DELIVERED" &&
    order.status !== "CANCELLED" &&
    assignment?.status !== "DELIVERED" &&
    assignment?.status !== "CANCELLED";

  const eligiblePartnersCount = partners.filter(
    (p) =>
      p.isActive &&
      p.userIsActive !== false &&
      p.isAvailable &&
      p.activeDeliveriesCount < p.maxActiveDeliveries
  ).length;

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>✓ {successMsg}</span>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-500 hover:text-emerald-700 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Overview & Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 flex flex-col md:flex-row gap-6 justify-between items-start">
        <div className="space-y-4">
          <div className="flex gap-2">
            <span className="text-xs uppercase font-bold text-gray-500 tracking-wider">
              Status Timeline
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge status={order.status} />
            <span className="text-gray-300">→</span>
            {assignment ? (
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                  assignment.status === "PENDING_ASSIGNMENT"
                    ? "bg-amber-50 text-amber-800 border-amber-300"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                Delivery: {assignment.status.replace(/_/g, " ")}
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider bg-amber-50 text-amber-800 border-amber-300">
                Awaiting Assignment
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAwaitingAssignment && (
            <button
              type="button"
              onClick={() => {
                setShowAssignModal(true);
                setSelectedPartnerId("");
                setIsOverride(false);
                setOverrideReason("");
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>+ Assign Partner</span>
            </button>
          )}

          {isCancellable && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-bold shadow-sm hover:bg-red-50 transition-colors cursor-pointer"
            >
              Cancel Order (Admin override)
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Farmer Info */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Farmer Details</h3>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-gray-500 w-24 inline-block">Name:</span>{" "}
              <span className="font-semibold">{order.user.name}</span>
            </p>
            <p>
              <span className="text-gray-500 w-24 inline-block">Phone:</span>{" "}
              <span className="font-semibold">{order.user.phone}</span>
            </p>
            <p>
              <span className="text-gray-500 w-24 inline-block">Email:</span>{" "}
              <span className="font-semibold">{order.user.email || "N/A"}</span>
            </p>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Payment Details</h3>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-gray-500 w-32 inline-block">Method:</span>{" "}
              <span className="font-semibold">{order.paymentMethod}</span>
            </p>
            <p>
              <span className="text-gray-500 w-32 inline-block">Status:</span>
              <span
                className={`font-bold ${
                  order.paymentStatus === "PAID"
                    ? "text-emerald-600"
                    : order.paymentStatus === "CANCELLED"
                    ? "text-red-600"
                    : "text-amber-600"
                }`}
              >
                {order.paymentStatus}
              </span>
            </p>
            <p>
              <span className="text-gray-500 w-32 inline-block">Order Total:</span>{" "}
              <span className="font-black text-gray-900">{formatPrice(order.totalAmount)}</span>
            </p>
            {order.paymentTransactions?.length > 0 && (
              <div className="mt-3 pt-3 border-t text-xs">
                <span className="text-gray-500 block mb-1">Transaction History:</span>
                {order.paymentTransactions.map((tx: any) => (
                  <div key={tx.id} className="flex justify-between text-gray-600">
                    <span>
                      {tx.provider} - {tx.status}
                    </span>
                    <span>{formatDate(tx.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delivery Info & Tracking */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <TruckIcon className="w-5 h-5 text-gray-500" />
            <h3 className="text-sm font-bold text-gray-900">Delivery & Tracking</h3>
          </div>
          <Link
            href={`/admin/logistics?search=${order.orderNumber}`}
            className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
          >
            Open in Logistics Dispatch &rarr;
          </Link>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 text-sm">
            <div>
              <span className="text-gray-500 block mb-1 text-xs uppercase font-bold">
                Shipping Address
              </span>
              <p className="font-semibold">
                {order.shippingName} ({order.shippingPhone})
              </p>
              <p className="text-gray-700 mt-0.5">{order.shippingAddress}</p>
              <p className="text-gray-700">
                {[
                  order.shippingVillage,
                  order.shippingDistrict,
                  order.shippingState,
                  order.shippingPincode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>

            {partner ? (
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-blue-900 block text-xs uppercase font-bold">
                    Assigned Delivery Partner
                  </span>
                  {canReassign && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowReassignModal(true);
                        setSelectedPartnerId("");
                        setIsOverride(false);
                        setOverrideReason("");
                        setReassignReason("");
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-blue-300 text-blue-900 rounded-lg text-xs font-bold cursor-pointer shadow-2xs"
                    >
                      ⇄ Reassign Partner
                    </button>
                  )}
                </div>
                <p className="font-bold text-gray-900">{partner.user.name}</p>
                <p className="text-gray-600">{partner.user.phone || partner.phone || "No phone recorded"}</p>
                <p className="text-gray-600 text-xs">
                  Vehicle: {[partner.vehicleType, partner.vehicleNumber].filter(Boolean).join(" - ") || "Not specified"}
                </p>
                {assignment.deliveryCode && order.status !== "DELIVERED" && (
                  <div className="mt-2 pt-2 border-t border-blue-200 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-blue-800 font-bold block">
                        Handover OTP Code (Admin View):
                      </span>
                      <span className="font-mono text-sm font-bold text-gray-900">
                        {assignment.deliveryCode}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 text-amber-900 space-y-3">
                <div>
                  <span className="text-xs uppercase font-extrabold text-amber-800 block">
                    ⚠️ Awaiting Delivery Partner Assignment
                  </span>
                  <p className="text-xs text-amber-700 mt-0.5">
                    This order is ready for delivery. Automatic assignment is pending or awaiting administrative dispatch.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignModal(true);
                      setSelectedPartnerId("");
                      setIsOverride(false);
                      setOverrideReason("");
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                  >
                    + Assign Partner
                  </button>
                  <button
                    type="button"
                    disabled={isRetryingAuto}
                    onClick={handleRetryAuto}
                    className="px-3 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {isRetryingAuto ? "Retrying..." : "🔄 Retry Auto-Assignment"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="h-full min-h-[260px]">
            {assignment &&
            partner &&
            partner.lastKnownLat &&
            partner.lastKnownLon &&
            order.status !== "DELIVERED" ? (
              <div className="h-full border border-gray-200 rounded-xl overflow-hidden relative">
                <DeliveryTrackingMapWrapper
                  partnerLat={partner.lastKnownLat}
                  partnerLon={partner.lastKnownLon}
                  partnerName={partner.user.name}
                  updatedAt={
                    partner.lastLocationUpdatedAt ? partner.lastLocationUpdatedAt.toString() : null
                  }
                />
              </div>
            ) : (
              <div className="h-full rounded-xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center text-gray-400 p-6 text-center space-y-2">
                <TruckIcon className="w-8 h-8 opacity-50" />
                <span className="text-sm font-medium">Live GPS Tracking</span>
                <span className="text-xs opacity-70">
                  {order.status === "DELIVERED"
                    ? "Order has already been delivered."
                    : partner
                    ? "Partner GPS coordinates are currently inactive."
                    : "Tracking will activate once a driver is assigned."}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-bold text-gray-900">Order Items (Historical Snapshot)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead className="bg-white text-gray-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left">Product</th>
                <th className="px-5 py-3 text-left">Shop</th>
                <th className="px-5 py-3 text-center">Qty</th>
                <th className="px-5 py-3 text-right">Unit Price</th>
                <th className="px-5 py-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {order.items.map((item: any) => (
                <tr key={item.id}>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="font-bold text-gray-900">{item.productName}</div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-gray-600">
                    {item.shopName || "-"}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-center text-gray-900 font-medium">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-right text-gray-600">
                    {formatPrice(Number(item.productPrice))}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-right font-bold text-gray-900">
                    {formatPrice(Number(item.lineTotal))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 text-right">
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider"
                >
                  Subtotal
                </td>
                <td className="px-5 py-3 font-bold text-gray-900">
                  {formatPrice(Number(order.subtotal))}
                </td>
              </tr>
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider"
                >
                  Delivery Charge
                </td>
                <td className="px-5 py-3 font-bold text-emerald-700">
                  {Number(order.deliveryCharge) === 0
                    ? "FREE"
                    : formatPrice(Number(order.deliveryCharge))}
                </td>
              </tr>
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-3 font-black text-gray-900 uppercase tracking-wider"
                >
                  Total Amount
                </td>
                <td className="px-5 py-3 font-black text-gray-900 text-lg">
                  {formatPrice(Number(order.totalAmount))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Assign Partner Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Assign Delivery Partner — #{order.orderNumber}
                </h3>
                <p className="text-xs text-gray-500">
                  Select an eligible delivery partner to handle fulfillment
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xs bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1">
                <div>
                  <span className="text-gray-500">Destination:</span>{" "}
                  <span className="font-semibold text-gray-900">{order.shippingAddress}</span>
                </div>
                <div>
                  <span className="text-gray-500">Customer:</span>{" "}
                  <span className="font-semibold text-gray-900">{order.shippingName}</span>
                </div>
              </div>

              {/* Partners Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700">
                    Fleet Partners ({partners.length} registered):
                  </label>
                  <span className="text-[11px] text-gray-400">
                    {eligiblePartnersCount} fully eligible
                  </span>
                </div>

                {eligiblePartnersCount === 0 && !isOverride && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                    <p className="font-bold">No fully eligible partners currently online.</p>
                    <p className="text-[11px] mt-0.5">
                      Enable <strong>Admin Override</strong> below to dispatch an off-duty or capacity-reached driver.
                    </p>
                  </div>
                )}

                <div className="max-h-52 overflow-y-auto space-y-2 border border-gray-200 rounded-xl p-2">
                  {partners.map((p) => {
                    const isAtCapacity = p.activeDeliveriesCount >= p.maxActiveDeliveries;
                    const isOffline = !p.isAvailable;
                    const isInactive = !p.isActive || p.userIsActive === false;

                    const isStandardEligible = !isInactive && !isOffline && !isAtCapacity;
                    const isSelectable = isOverride ? !isInactive : isStandardEligible;
                    const isSelected = selectedPartnerId === p.id;

                    return (
                      <label
                        key={p.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-colors text-xs ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200 cursor-pointer"
                            : !isSelectable
                            ? "opacity-50 bg-gray-50 border-gray-200 cursor-not-allowed"
                            : "hover:bg-gray-50 border-gray-200 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="assign-partner-detail"
                            disabled={!isSelectable}
                            checked={isSelected}
                            onChange={() => setSelectedPartnerId(p.id)}
                            className="text-indigo-600"
                          />
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-1.5">
                              <span>{p.name}</span>
                              {isInactive && (
                                <span className="text-[9px] bg-red-100 text-red-700 font-extrabold px-1.5 py-0.2 rounded">
                                  SUSPENDED
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              {p.vehicleType || "Vehicle"} {p.vehicleNumber ? `(${p.vehicleNumber})` : ""}
                              {p.serviceArea ? ` • Area: ${p.serviceArea}` : " • No fixed area"}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isAtCapacity ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {p.activeDeliveriesCount} / {p.maxActiveDeliveries} Active
                          </span>
                          <span
                            className={`block text-[10px] font-semibold mt-0.5 ${
                              p.isAvailable ? "text-emerald-600" : "text-gray-400"
                            }`}
                          >
                            {p.isAvailable ? "● On Duty" : "○ Off Duty"}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Admin Override */}
              <div className="border border-amber-200 bg-amber-50/60 rounded-xl p-3 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-950">
                  <input
                    type="checkbox"
                    checked={isOverride}
                    onChange={(e) => setIsOverride(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                  />
                  <span>Enable Admin Override (Assign Off-Duty or Capacity-Reached Partner)</span>
                </label>
                {isOverride && (
                  <div className="space-y-2 pt-1 text-xs">
                    <p className="text-[11px] text-amber-800 font-medium">
                      ⚠️ <strong>Override Notice:</strong> Assigning an off-duty driver bypasses normal limits and will be logged in the permanent audit trail. Suspended accounts remain ineligible.
                    </p>
                    <input
                      type="text"
                      placeholder="Optional override justification"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingDelivery || !selectedPartnerId}
                onClick={handleAssignPartner}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl shadow-xs cursor-pointer"
              >
                {isSubmittingDelivery ? "Assigning..." : "Confirm Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Partner Modal */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Reassign Delivery Partner — #{order.orderNumber}
                </h3>
                <p className="text-xs text-gray-500">
                  Transfer fulfillment custody to another delivery partner
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReassignModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-1">
                <div className="font-bold text-amber-950">Currently Assigned:</div>
                <div className="text-sm font-black text-amber-900">{partner?.user?.name}</div>
                <p className="text-[11px] text-amber-800 pt-1 border-t border-amber-200 mt-1">
                  ⚠️ The current driver and the customer will be notified of this driver update immediately.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Reason for Reassignment:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vehicle breakdown, driver delayed, route reallocation"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs"
                />
              </div>

              {/* Replacement Partner List */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">
                  Select Replacement Partner:
                </label>
                <div className="max-h-52 overflow-y-auto space-y-2 border border-gray-200 rounded-xl p-2">
                  {partners
                    .filter((p) => p.id !== partner?.id)
                    .map((p) => {
                      const isAtCapacity = p.activeDeliveriesCount >= p.maxActiveDeliveries;
                      const isOffline = !p.isAvailable;
                      const isInactive = !p.isActive || p.userIsActive === false;

                      const isStandardEligible = !isInactive && !isOffline && !isAtCapacity;
                      const isSelectable = isOverride ? !isInactive : isStandardEligible;
                      const isSelected = selectedPartnerId === p.id;

                      return (
                        <label
                          key={p.id}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-colors text-xs ${
                            isSelected
                              ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200 cursor-pointer"
                              : !isSelectable
                              ? "opacity-50 bg-gray-50 border-gray-200 cursor-not-allowed"
                              : "hover:bg-gray-50 border-gray-200 cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="reassign-partner-detail"
                              disabled={!isSelectable}
                              checked={isSelected}
                              onChange={() => setSelectedPartnerId(p.id)}
                              className="text-indigo-600"
                            />
                            <div>
                              <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                <span>{p.name}</span>
                                {isInactive && (
                                  <span className="text-[9px] bg-red-100 text-red-700 font-extrabold px-1.5 py-0.2 rounded">
                                    SUSPENDED
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-gray-500">
                                {p.vehicleType || "Vehicle"} {p.vehicleNumber ? `(${p.vehicleNumber})` : ""}
                                {p.serviceArea ? ` • Area: ${p.serviceArea}` : " • No fixed area"}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isAtCapacity ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {p.activeDeliveriesCount} / {p.maxActiveDeliveries} Active
                            </span>
                            <span
                              className={`block text-[10px] font-semibold mt-0.5 ${
                                p.isAvailable ? "text-emerald-600" : "text-gray-400"
                              }`}
                            >
                              {p.isAvailable ? "● On Duty" : "○ Off Duty"}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Admin Override */}
              <div className="border border-amber-200 bg-amber-50/60 rounded-xl p-3 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-950">
                  <input
                    type="checkbox"
                    checked={isOverride}
                    onChange={(e) => setIsOverride(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                  />
                  <span>Enable Admin Override</span>
                </label>
                {isOverride && (
                  <div className="space-y-2 pt-1 text-xs">
                    <p className="text-[11px] text-amber-800 font-medium">
                      ⚠️ Overrides will be documented in the permanent audit trail. Suspended accounts remain ineligible.
                    </p>
                    <input
                      type="text"
                      placeholder="Override justification"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowReassignModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingDelivery || !selectedPartnerId}
                onClick={handleReassignPartner}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs cursor-pointer"
              >
                {isSubmittingDelivery ? "Reassigning..." : "Confirm Reassignment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Cancel Order #{order.orderNumber}</h3>
            <p className="text-xs text-gray-500">
              Are you sure you want to cancel this order? This action cannot be undone and will restore stock inventory.
            </p>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Cancellation</label>
              <input
                type="text"
                placeholder="e.g. Customer requested, Fraud check"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleCancelOrder}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
              >
                {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ status }: { status: string }) {
  let color = "bg-gray-100 text-gray-800 border-gray-200";
  if (status === "CONFIRMED") color = "bg-blue-100 text-blue-800 border-blue-200";
  if (status === "PROCESSING") color = "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (status === "READY_FOR_DELIVERY") color = "bg-purple-100 text-purple-800 border-purple-200";
  if (status === "DELIVERED") color = "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (status === "CANCELLED") color = "bg-red-100 text-red-800 border-red-200";

  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${color}`}>
      Order: {status.replace(/_/g, " ")}
    </span>
  );
}
