"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AdminLogisticsMetrics,
  AdminDeliveryItem,
  AdminPartnerItem,
} from "@/types/delivery";
import {
  assignDelivery,
  reassignDelivery,
  retryOrderDeliveryAssignment,
  retryPendingDeliveryAssignments,
  cancelDeliveryAssignment,
  rescheduleDelivery,
} from "@/actions/delivery/delivery-actions";
import { TruckIcon, PackageIcon, CheckCircleIcon } from "@/components/ui/icons";

interface AdminLogisticsClientProps {
  initialMetrics: AdminLogisticsMetrics;
  initialDeliveries: AdminDeliveryItem[];
  partners: AdminPartnerItem[];
  activeFilters: {
    type: string;
    status: string;
    partnerId: string;
    search: string;
  };
}

export function AdminLogisticsClient({
  initialMetrics,
  initialDeliveries,
  partners,
  activeFilters,
}: AdminLogisticsClientProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [retryingAll, setRetryingAll] = useState(false);
  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter states
  const [selectedType, setSelectedType] = useState(activeFilters.type);
  const [selectedStatus, setSelectedStatus] = useState(activeFilters.status);
  const [searchQuery, setSearchQuery] = useState(activeFilters.search);

  // Modals
  const [assignModalItem, setAssignModalItem] = useState<AdminDeliveryItem | null>(null);
  const [reassignModalItem, setReassignModalItem] = useState<AdminDeliveryItem | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("");
  const [isOverride, setIsOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [reassignReason, setReassignReason] = useState("");

  // Reschedule Modal
  const [rescheduleItem, setRescheduleItem] = useState<AdminDeliveryItem | null>(null);
  const [rescheduleWindow, setRescheduleWindow] = useState("09:00 - 12:00");
  const [rescheduleReasonText, setRescheduleReasonText] = useState("");

  const handleApplyFilters = (type = selectedType, status = selectedStatus) => {
    const params = new URLSearchParams();
    if (type !== "ALL") params.set("type", type);
    if (status !== "ALL") params.set("status", status);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    router.push(`/admin/logistics?${params.toString()}`);
  };

  const handleAssignSubmit = async () => {
    if (!assignModalItem || !selectedPartnerId) {
      setError("Please select a delivery partner to assign.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await assignDelivery(assignModalItem.id, selectedPartnerId, {
        isOverride,
        overrideReason: isOverride ? overrideReason : undefined,
      });

      if (!res.success) {
        setError(res.error || "Failed to assign partner");
      } else {
        setSuccessMessage(res.message || "Partner assigned successfully.");
        setAssignModalItem(null);
        setSelectedPartnerId("");
        setIsOverride(false);
        setOverrideReason("");
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Error assigning delivery partner");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReassignSubmit = async () => {
    if (!reassignModalItem || !selectedPartnerId) {
      setError("Please select a new delivery partner.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await reassignDelivery(
        reassignModalItem.id,
        selectedPartnerId,
        reassignReason,
        {
          isOverride,
          overrideReason: isOverride ? overrideReason : undefined,
        }
      );

      if (!res.success) {
        setError(res.error || "Failed to reassign partner");
      } else {
        setSuccessMessage(res.message || "Partner reassigned successfully.");
        setReassignModalItem(null);
        setSelectedPartnerId("");
        setIsOverride(false);
        setOverrideReason("");
        setReassignReason("");
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Error reassigning delivery partner");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetrySingleOrder = async (orderId: string) => {
    setRetryingOrderId(orderId);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await retryOrderDeliveryAssignment(orderId);
      if (res.assigned) {
        setSuccessMessage(res.message);
        router.refresh();
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to retry auto-assignment");
    } finally {
      setRetryingOrderId(null);
    }
  };

  const handleRetryAllPending = async () => {
    setRetryingAll(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await retryPendingDeliveryAssignments();
      if (res.success) {
        setSuccessMessage(res.message);
        router.refresh();
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to retry pending assignments");
    } finally {
      setRetryingAll(false);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleItem || !rescheduleWindow) {
      setError("Please provide a new delivery window.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await rescheduleDelivery(
        rescheduleItem.id,
        rescheduleWindow,
        undefined,
        rescheduleReasonText
      );
      if (!res.success) {
        setError(res.error || "Failed to reschedule delivery");
      } else {
        setRescheduleItem(null);
        setRescheduleReasonText("");
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Error rescheduling delivery");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAssignment = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to cancel this delivery assignment?")) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await cancelDeliveryAssignment(assignmentId, "Cancelled by Admin");
      if (!res.success) {
        setError(res.error || "Failed to cancel assignment");
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Error cancelling assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_ASSIGNMENT":
        return "bg-amber-100 text-amber-900 border-amber-300 font-extrabold";
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "PICKED_UP":
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "OUT_FOR_DELIVERY":
      case "IN_TRANSIT":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "DELIVERED":
      case "RETURNED":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "RETURN_REQUESTED":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "EXCEPTION":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const filteredDeliveries = initialDeliveries.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.identifier.toLowerCase().includes(q) ||
      d.recipientName.toLowerCase().includes(q) ||
      d.dropAddress.toLowerCase().includes(q) ||
      (d.pickupAddress && d.pickupAddress.toLowerCase().includes(q)) ||
      (d.partnerName && d.partnerName.toLowerCase().includes(q))
    );
  });

  // Calculate eligible partners for modals
  const eligiblePartnersCount = partners.filter(
    (p) =>
      p.isActive &&
      p.userIsActive !== false &&
      p.isAvailable &&
      p.activeDeliveriesCount < p.maxActiveDeliveries
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-1">
            <TruckIcon className="w-4 h-4" />
            <span>Central Logistics Dispatch & Fleet Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Logistics Operations Command
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Automatic and manual delivery partner assignment, driver workload management, and fleet dispatch.
          </p>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>✓ {successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Pending Assignment Attention Banner */}
      {initialMetrics.pendingAssignment > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h2 className="text-sm font-bold text-amber-900">
                {initialMetrics.pendingAssignment} Order
                {initialMetrics.pendingAssignment > 1 ? "s" : ""} Awaiting Delivery Partner Assignment
              </h2>
              <p className="text-xs text-amber-800 mt-0.5">
                Automatic assignment could not match available drivers or capacity limits were reached. You can assign a partner manually or retry automatic matching.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedStatus("PENDING_ASSIGNMENT");
                handleApplyFilters(selectedType, "PENDING_ASSIGNMENT");
              }}
              className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold rounded-xl cursor-pointer transition-colors"
            >
              Filter Pending Orders
            </button>
            <button
              type="button"
              disabled={retryingAll}
              onClick={handleRetryAllPending}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              {retryingAll ? "Retrying..." : "🔄 Retry Automatic Assignment"}
            </button>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 block mb-1">Total Deliveries</span>
          <div className="text-2xl font-black text-gray-900">{initialMetrics.totalDeliveries}</div>
          <span className="text-[11px] text-gray-400 font-medium">All platform runs</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 block mb-1">Pending Assign</span>
          <div className="text-2xl font-black text-amber-600">{initialMetrics.pendingAssignment}</div>
          <span className="text-[11px] text-amber-600 font-medium">Awaiting driver</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 block mb-1">In Transit / Road</span>
          <div className="text-2xl font-black text-blue-600">{initialMetrics.activeInTransit}</div>
          <span className="text-[11px] text-blue-600 font-medium">Active moving</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 block mb-1">Delivered</span>
          <div className="text-2xl font-black text-emerald-600">{initialMetrics.deliveredCount}</div>
          <span className="text-[11px] text-emerald-600 font-medium">Completed & verified</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 block mb-1">Exceptions</span>
          <div className="text-2xl font-black text-orange-600">{initialMetrics.exceptionsCount}</div>
          <span className="text-[11px] text-orange-600 font-medium">Needs attention</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 block mb-1">Active Partners</span>
          <div className="text-2xl font-black text-indigo-700">{initialMetrics.activePartnersCount}</div>
          <span className="text-[11px] text-indigo-600 font-medium">Available on duty</span>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Type Filters */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold bg-gray-100 p-1 rounded-xl">
            {[
              { key: "ALL", label: "All Types" },
              { key: "ORDER", label: "📦 Orders" },
              { key: "MACHINERY_RENTAL", label: "🚜 Machinery" },
              { key: "MACHINERY_RETURN", label: "🔄 Returns" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setSelectedType(tab.key);
                  handleApplyFilters(tab.key, selectedStatus);
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  selectedType === tab.key
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search reference, recipient, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApplyFilters();
              }}
              className="px-3.5 py-1.5 border border-gray-300 rounded-xl text-xs text-gray-900 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => handleApplyFilters()}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Filter
            </button>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 text-xs">
          <span className="text-gray-400 font-semibold">Status:</span>
          {[
            { key: "ALL", label: "All Statuses" },
            { key: "PENDING_ASSIGNMENT", label: "Pending Assignment" },
            { key: "ASSIGNED", label: "Assigned" },
            { key: "PICKED_UP", label: "Picked Up" },
            { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
            { key: "DELIVERED", label: "Delivered" },
            { key: "RETURN_REQUESTED", label: "Return Requested" },
            { key: "EXCEPTION", label: "Exception" },
          ].map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => {
                setSelectedStatus(pill.key);
                handleApplyFilters(selectedType, pill.key);
              }}
              className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold cursor-pointer transition-colors ${
                selectedStatus === pill.key
                  ? "bg-indigo-700 text-white border-indigo-700 shadow-2xs"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Run / Order #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4">Assignment Status</th>
                <th className="py-3 px-4">Pickup (Shop)</th>
                <th className="py-3 px-4">Drop-off (Farmer)</th>
                <th className="py-3 px-4">Window</th>
                <th className="py-3 px-4">Assigned Partner</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400">
                    No delivery records match the current filters.
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((delivery) => {
                  const isPending = delivery.status === "PENDING_ASSIGNMENT" || !delivery.partnerId;
                  const canReassign =
                    Boolean(delivery.partnerId) &&
                    delivery.status !== "DELIVERED" &&
                    delivery.status !== "RETURNED" &&
                    delivery.status !== "CANCELLED";

                  return (
                    <tr
                      key={delivery.id}
                      className={`hover:bg-gray-50/70 transition-colors ${
                        isPending ? "bg-amber-50/20" : ""
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-gray-900 whitespace-nowrap">
                        #{delivery.identifier}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-gray-500">
                        {formatDate(delivery.orderDate || delivery.createdAt)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          {delivery.deliveryType === "MACHINERY_RENTAL"
                            ? "🚜 Machinery"
                            : delivery.deliveryType === "MACHINERY_RETURN"
                            ? "🔄 Return"
                            : "📦 Order"}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800 border border-gray-200 uppercase tracking-wider">
                          {delivery.orderStatus ? delivery.orderStatus.replace(/_/g, " ") : "READY"}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(
                            delivery.status
                          )}`}
                        >
                          {delivery.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate" title={delivery.pickupAddress}>
                        <div className="font-semibold text-gray-900 truncate">
                          {delivery.shopName || "Seller Store"}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate">
                          {delivery.pickupAddress}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate" title={delivery.dropAddress}>
                        <div className="font-semibold text-gray-900">{delivery.recipientName}</div>
                        <div className="text-[11px] text-gray-400 truncate">
                          {delivery.dropAddress}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {delivery.deliveryWindow ? (
                          <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                            🕒 {delivery.deliveryWindow}
                          </span>
                        ) : (
                          <span className="text-gray-400">Flexible</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {delivery.partnerName ? (
                          <div>
                            <div className="font-bold text-gray-900">{delivery.partnerName}</div>
                            {delivery.partnerPhone && (
                              <div className="text-[11px] text-gray-400">
                                📞 {delivery.partnerPhone}
                              </div>
                            )}
                            {canReassign && (
                              <button
                                type="button"
                                onClick={() => {
                                  setReassignModalItem(delivery);
                                  setSelectedPartnerId("");
                                  setIsOverride(false);
                                  setOverrideReason("");
                                  setReassignReason("");
                                }}
                                className="mt-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 font-bold rounded-lg text-[10px] cursor-pointer shadow-2xs block"
                              >
                                ⇄ Reassign Partner
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1 items-start">
                            <button
                              type="button"
                              onClick={() => {
                                setAssignModalItem(delivery);
                                setSelectedPartnerId("");
                                setIsOverride(false);
                                setOverrideReason("");
                              }}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs flex items-center gap-1"
                            >
                              <span>+ Assign Partner</span>
                            </button>
                            {delivery.orderId && (
                              <button
                                type="button"
                                disabled={retryingOrderId === delivery.orderId}
                                onClick={() => handleRetrySingleOrder(delivery.orderId!)}
                                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer disabled:opacity-50"
                              >
                                {retryingOrderId === delivery.orderId ? "Retrying..." : "Retry Auto"}
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRescheduleItem(delivery);
                            setRescheduleWindow(delivery.deliveryWindow || "09:00 - 12:00");
                          }}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold text-[11px] cursor-pointer"
                        >
                          Reschedule
                        </button>
                        {delivery.status !== "DELIVERED" &&
                          delivery.status !== "RETURNED" &&
                          delivery.status !== "CANCELLED" && (
                            <button
                              type="button"
                              onClick={() => handleCancelAssignment(delivery.id)}
                              className="text-red-600 hover:text-red-800 font-semibold text-[11px] cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Driver Assignment Modal */}
      {assignModalItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Assign Delivery Partner — #{assignModalItem.identifier}
                </h3>
                <p className="text-xs text-gray-500">
                  Select an eligible delivery partner or configure administrative override
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalItem(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Order Information Snapshot */}
              <div className="text-xs space-y-1.5 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order Reference:</span>
                  <span className="font-mono font-bold text-gray-900">#{assignModalItem.identifier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Order Date:</span>
                  <span className="font-semibold text-gray-900">
                    {formatDate(assignModalItem.orderDate || assignModalItem.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Order Status:</span>
                  <span className="font-bold text-gray-900 uppercase">
                    {assignModalItem.orderStatus || "READY_FOR_DELIVERY"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Assignment Status:</span>
                  <span className="font-bold text-amber-700 uppercase">
                    {assignModalItem.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="pt-1 border-t border-gray-200">
                  <span className="text-gray-500 block">Pickup Location:</span>
                  <span className="font-medium text-gray-900">{assignModalItem.pickupAddress}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Delivery Address:</span>
                  <span className="font-medium text-gray-900">{assignModalItem.dropAddress}</span>
                </div>
              </div>

              {/* Partner List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700">
                    Available Delivery Partners ({partners.length} registered):
                  </label>
                  <span className="text-[11px] text-gray-400">
                    {eligiblePartnersCount} fully eligible
                  </span>
                </div>

                {eligiblePartnersCount === 0 && !isOverride && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                    <p className="font-bold">No fully eligible delivery partners currently available.</p>
                    <p className="text-[11px] mt-0.5">
                      All registered drivers are currently off-duty, unapproved, or at capacity. You can enable <strong>Admin Override</strong> below to dispatch an off-duty or capacity-reached driver.
                    </p>
                  </div>
                )}

                <div className="max-h-56 overflow-y-auto space-y-2 border border-gray-200 rounded-xl p-2">
                  {partners.length === 0 ? (
                    <p className="text-xs text-gray-400 p-2">No registered partners found in database.</p>
                  ) : (
                    partners.map((p) => {
                      const isAtCapacity = p.activeDeliveriesCount >= p.maxActiveDeliveries;
                      const isOffline = !p.isAvailable;
                      const isInactive = !p.isActive || p.userIsActive === false;

                      // Standard eligibility
                      const isStandardEligible = !isInactive && !isOffline && !isAtCapacity;
                      // Override allows offline or at-capacity, but NEVER inactive/suspended
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
                              name="partner"
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
                              {p.phone && (
                                <div className="text-[10px] text-gray-400">📞 {p.phone}</div>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isAtCapacity
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
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
                    })
                  )}
                </div>
              </div>

              {/* Admin Override Toggle */}
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
                      ⚠️ <strong>Override Notice:</strong> Assigning an off-duty or capacity-reached driver bypasses standard routing policies. Suspended accounts remain strictly ineligible. This action will be recorded in the system audit log.
                    </p>
                    <input
                      type="text"
                      placeholder="Optional override reason (e.g., Driver confirmed manual availability)"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              {assignModalItem.orderId ? (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    handleRetrySingleOrder(assignModalItem.orderId!);
                    setAssignModalItem(null);
                  }}
                  className="px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl cursor-pointer"
                >
                  🔄 Retry Auto-Assignment
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModalItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting || !selectedPartnerId}
                  onClick={handleAssignSubmit}
                  className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs cursor-pointer disabled:opacity-50 ${
                    isOverride ? "bg-amber-600 hover:bg-amber-700" : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {submitting
                    ? "Assigning..."
                    : isOverride
                    ? "Confirm with Override"
                    : "Confirm Assignment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Partner Modal */}
      {reassignModalItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Reassign Delivery Partner — #{reassignModalItem.identifier}
                </h3>
                <p className="text-xs text-gray-500">
                  Change the assigned driver. Previous and new partners will be notified.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReassignModalItem(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Current Assignment Snapshot */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-1">
                <div className="font-bold text-amber-950">Currently Assigned Partner:</div>
                <div className="text-sm font-black text-amber-900">
                  {reassignModalItem.partnerName || "Unknown Partner"}
                </div>
                {reassignModalItem.partnerPhone && (
                  <div className="text-[11px] text-amber-800">📞 {reassignModalItem.partnerPhone}</div>
                )}
                <p className="text-[11px] text-amber-800 pt-1 border-t border-amber-200 mt-1">
                  ⚠️ <strong>Notice:</strong> Confirming reassignment will reallocate this delivery run. The previous driver will receive a reassignment notice and the delivery will be transferred to the new driver immediately.
                </p>
              </div>

              {/* Reassignment Reason */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Reason for Reassignment:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vehicle breakdown, driver delayed, route reallocation"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Partner List (excluding current partner) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">
                  Select New Delivery Partner:
                </label>
                <div className="max-h-52 overflow-y-auto space-y-2 border border-gray-200 rounded-xl p-2">
                  {partners
                    .filter((p) => p.id !== reassignModalItem.partnerId)
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
                              name="reassign-partner"
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
                                isAtCapacity
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
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

              {/* Admin Override Toggle */}
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
                      ⚠️ <strong>Override Notice:</strong> An audit record will document that this reassignment bypassed duty/capacity policies. Suspended accounts remain ineligible.
                    </p>
                    <input
                      type="text"
                      placeholder="Optional override justification"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setReassignModalItem(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || !selectedPartnerId}
                onClick={handleReassignSubmit}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs cursor-pointer"
              >
                {submitting ? "Reassigning..." : "Confirm Reassignment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Window Modal */}
      {rescheduleItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">
              Reschedule Run #{rescheduleItem.identifier}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Select Delivery Window</label>
                <select
                  value={rescheduleWindow}
                  onChange={(e) => setRescheduleWindow(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl"
                >
                  <option value="09:00 - 12:00">Morning (09:00 - 12:00)</option>
                  <option value="12:00 - 15:00">Afternoon (12:00 - 15:00)</option>
                  <option value="15:00 - 18:00">Evening (15:00 - 18:00)</option>
                  <option value="Tomorrow 09:00 - 14:00">Tomorrow Morning (09:00 - 14:00)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Reason (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Inclement weather, route update"
                  value={rescheduleReasonText}
                  onChange={(e) => setRescheduleReasonText(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setRescheduleItem(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleRescheduleSubmit}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
              >
                {submitting ? "Saving..." : "Save Reschedule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
