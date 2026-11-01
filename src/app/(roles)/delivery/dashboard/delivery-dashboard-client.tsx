"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DeliveryPartnerProfile,
  DeliveryDashboardMetrics,
  PartnerDeliverySummary,
} from "@/types/delivery";
import {
  toggleAvailability,
  confirmPickup,
  markOutForDelivery,
  markDelivered,
} from "@/actions/delivery/delivery-actions";
import {
  TruckIcon,
  PackageIcon,
  CheckCircleIcon,
  MapPinIcon,
} from "@/components/ui/icons";

export function DeliveryDashboardClient({
  profile,
  metrics,
  recentDeliveries,
}: {
  profile: DeliveryPartnerProfile;
  metrics: DeliveryDashboardMetrics;
  recentDeliveries: PartnerDeliverySummary[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Availability state
  const [isAvailable, setIsAvailable] = useState(profile.isAvailable);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null);

  // Active filter
  const [filterTab, setFilterTab] = useState<"ALL" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // OTP Modal State
  const [activeOtpAssignment, setActiveOtpAssignment] = useState<PartnerDeliverySummary | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Toggle availability handler
  const handleToggleAvailability = async () => {
    setAvailabilityLoading(true);
    setAvailabilityMessage(null);
    try {
      const res = await toggleAvailability();
      if (res.error) {
        setAvailabilityMessage(res.error);
      } else if (res.success && res.isAvailable !== undefined) {
        setIsAvailable(res.isAvailable);
        setAvailabilityMessage(
          res.isAvailable
            ? "You are now ONLINE. Checking for pending orders..."
            : "You are now OFFLINE. New assignments will not be auto-dispatched."
        );
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      setAvailabilityMessage("Failed to update availability. Please try again.");
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // Pickup handler
  const handlePickup = async (assignmentId: string) => {
    setActionLoadingId(assignmentId);
    setActionError(null);
    try {
      const res = await confirmPickup(assignmentId);
      if (res.error) {
        setActionError(res.error);
      } else {
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      setActionError("Failed to confirm pickup. Please try again.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Start Delivery handler
  const handleStartDelivery = async (assignmentId: string) => {
    setActionLoadingId(assignmentId);
    setActionError(null);
    try {
      const res = await markOutForDelivery(assignmentId);
      if (res.error) {
        setActionError(res.error);
      } else {
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      setActionError("Failed to mark out for delivery. Please try again.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // OTP Complete handler
  const handleCompleteWithOtp = async () => {
    if (!activeOtpAssignment) return;
    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpError("Please enter the 6-digit confirmation code provided by the customer.");
      return;
    }

    setActionLoadingId(activeOtpAssignment.assignmentId);
    setOtpError(null);
    try {
      const res = await markDelivered(activeOtpAssignment.assignmentId, otpCode.trim(), {
        recipientName: recipientName.trim() || undefined,
      });

      if (res.error) {
        setOtpError(res.error);
      } else {
        setActiveOtpAssignment(null);
        setOtpCode("");
        setRecipientName("");
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      setOtpError("Delivery verification failed. Please verify the code and try again.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Currency formatter
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Filter deliveries
  const filteredDeliveries = recentDeliveries.filter((d) => {
    // Tab filter
    if (filterTab === "ASSIGNED" && d.status !== "ASSIGNED") return false;
    if (filterTab === "IN_PROGRESS" && d.status !== "PICKED_UP" && d.status !== "OUT_FOR_DELIVERY" && d.status !== "IN_TRANSIT") return false;
    if (filterTab === "COMPLETED" && d.status !== "DELIVERED" && d.status !== "RETURNED") return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = d.orderNumber.toLowerCase().includes(q);
      const matchCustomer = d.customerName.toLowerCase().includes(q);
      const matchArea = d.deliveryArea.toLowerCase().includes(q);
      const matchItems = d.itemsSummary?.toLowerCase().includes(q);
      if (!matchNumber && !matchCustomer && !matchArea && !matchItems) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Interactive Header Banner with Availability Toggle */}
      <div className="bg-linear-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-900/40">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold backdrop-blur-xs border border-blue-400/30">
              <TruckIcon className="w-3.5 h-3.5" />
              <span>SmartProcure Dedicated Logistics Dispatch</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {profile.name}
            </h1>

            <p className="text-blue-200/80 text-xs sm:text-sm max-w-xl leading-relaxed">
              Vehicle: <strong className="text-white">{profile.vehicleType || "Standard Delivery Vehicle"}</strong>
              {profile.vehicleCapacity && (
                <> • Capacity: <strong className="text-white">{profile.vehicleCapacity}</strong></>
              )}
              {profile.vehicleNumber && (
                <> • Plate: <strong className="text-white">{profile.vehicleNumber}</strong></>
              )}
            </p>
          </div>

          {/* Interactive Duty Availability Switcher */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 shadow-lg">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Dispatch Duty Status
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isAvailable ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                  }`}
                />
                <span className="font-bold text-sm text-white">
                  {isAvailable ? "Available on Duty" : "Off Duty (Unavailable)"}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={availabilityLoading}
              onClick={handleToggleAvailability}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 ${
                isAvailable
                  ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
              }`}
            >
              {availabilityLoading ? (
                <span>Updating...</span>
              ) : isAvailable ? (
                <>
                  <span>Go Off Duty</span>
                  <span>⏸</span>
                </>
              ) : (
                <>
                  <span>Go Available</span>
                  <span>▶</span>
                </>
              )}
            </button>
          </div>
        </div>

        {availabilityMessage && (
          <div className="mt-4 pt-4 border-t border-blue-900/60 text-xs text-blue-200 flex items-center gap-2">
            <span>ℹ️</span>
            <span>{availabilityMessage}</span>
          </div>
        )}
      </div>

      {/* 2. Key Metrics Grid (5 Required Metric Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: Total Assigned Deliveries */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs hover:border-blue-400 transition-colors">
          <span className="text-xs font-semibold text-gray-500 block mb-1">Total Assigned</span>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">
            {metrics.totalAssignedDeliveries ?? metrics.activeDeliveriesCount}
          </div>
          <span className="text-[11px] text-gray-400 font-medium">All claimed orders</span>
        </div>

        {/* Card 2: Pending Deliveries */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs hover:border-amber-400 transition-colors">
          <span className="text-xs font-semibold text-gray-500 block mb-1">Pending Deliveries</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-600">
            {metrics.pendingDeliveries ?? metrics.assignedDeliveries}
          </div>
          <span className="text-[11px] text-amber-600 font-medium">Awaiting action</span>
        </div>

        {/* Card 3: Pickups Awaiting Collection */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs hover:border-indigo-400 transition-colors">
          <span className="text-xs font-semibold text-gray-500 block mb-1">Pickups Awaiting</span>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600">
            {metrics.pickupsAwaitingCollection ?? metrics.assignedDeliveries}
          </div>
          <span className="text-[11px] text-indigo-600 font-medium">Collect from merchant</span>
        </div>

        {/* Card 4: Deliveries in Progress */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs hover:border-blue-400 transition-colors">
          <span className="text-xs font-semibold text-gray-500 block mb-1">In Progress</span>
          <div className="text-2xl sm:text-3xl font-black text-blue-600">
            {metrics.inProgressDeliveries ?? (metrics.pickedUpDeliveries + metrics.outForDeliveryCount)}
          </div>
          <span className="text-[11px] text-blue-600 font-medium">Picked up / in transit</span>
        </div>

        {/* Card 5: Completed Deliveries */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs hover:border-emerald-400 transition-colors col-span-2 sm:col-span-1">
          <span className="text-xs font-semibold text-gray-500 block mb-1">Completed</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            {metrics.completedDeliveries ?? metrics.deliveredCount}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Delivered & verified</span>
        </div>
      </div>

      {/* Global Action Error Banner */}
      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-600 font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. List of Assigned Orders Section */}
      <div className="space-y-4">
        {/* Section Header with Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
              Assigned Delivery Orders
            </h2>
            <p className="text-xs text-gray-500">
              Orders assigned to your vehicle run. Manage pickups, transit, and OTP delivery handovers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tabs */}
            <div className="inline-flex rounded-xl bg-gray-100 p-1 text-xs font-bold text-gray-600">
              <button
                type="button"
                onClick={() => setFilterTab("ALL")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterTab === "ALL" ? "bg-white text-gray-900 shadow-2xs" : "hover:text-gray-900"
                }`}
              >
                All ({recentDeliveries.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("ASSIGNED")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterTab === "ASSIGNED" ? "bg-white text-amber-700 shadow-2xs" : "hover:text-gray-900"
                }`}
              >
                Awaiting Pickup ({metrics.assignedDeliveries})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("IN_PROGRESS")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterTab === "IN_PROGRESS" ? "bg-white text-blue-700 shadow-2xs" : "hover:text-gray-900"
                }`}
              >
                In Progress ({metrics.pickedUpDeliveries + metrics.outForDeliveryCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("COMPLETED")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterTab === "COMPLETED" ? "bg-white text-emerald-700 shadow-2xs" : "hover:text-gray-900"
                }`}
              >
                Completed ({metrics.deliveredCount})
              </button>
            </div>

            {/* Search Box */}
            <input
              type="text"
              placeholder="Search orders, farmer, area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs px-3 py-2 border border-gray-300 rounded-xl bg-white shadow-2xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Assigned Orders Content */}
        {filteredDeliveries.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center space-y-4 shadow-2xs">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
              <TruckIcon className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900">
                {recentDeliveries.length === 0
                  ? "No Deliveries Assigned"
                  : "No Matching Orders Found"}
              </h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                {recentDeliveries.length === 0
                  ? "You currently have zero assigned deliveries. When orders are ready and dispatch assigns your vehicle, they will appear here automatically."
                  : "No assigned deliveries match your search filter."}
              </p>
            </div>
            {recentDeliveries.length === 0 && !isAvailable && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleToggleAvailability}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <span>Switch to Available on Duty</span>
                  <span>▶</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDeliveries.map((delivery) => {
              const isAssigned = delivery.status === "ASSIGNED";
              const isPickedUp = delivery.status === "PICKED_UP";
              const isInTransit = delivery.status === "OUT_FOR_DELIVERY" || delivery.status === "IN_TRANSIT";
              const isDelivered = delivery.status === "DELIVERED" || delivery.status === "RETURNED";
              const isCurrentActionLoading = actionLoadingId === delivery.assignmentId;

              const pickupNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                delivery.pickupAddress || "Merchant Store"
              )}`;
              const dropNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                delivery.deliveryAddress
              )}`;

              return (
                <div
                  key={delivery.assignmentId}
                  className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs hover:shadow-sm transition-shadow p-5 space-y-4"
                >
                  {/* Row 1: Header (Order #, Status Badge, Total Amount) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-sm font-black text-gray-900">
                        #{delivery.orderNumber}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                          isDelivered
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : isInTransit
                            ? "bg-blue-50 text-blue-800 border-blue-300"
                            : isPickedUp
                            ? "bg-indigo-50 text-indigo-800 border-indigo-300"
                            : "bg-amber-50 text-amber-800 border-amber-300"
                        }`}
                      >
                        {delivery.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {delivery.deliveryType === "MACHINERY_RENTAL"
                          ? "🚜 Machinery"
                          : delivery.deliveryType === "MACHINERY_RETURN"
                          ? "🔄 Return"
                          : "📦 Order"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block font-semibold uppercase">Total Amount</span>
                        <span className="font-bold text-sm text-gray-900">
                          {formatPrice(delivery.totalAmount)}
                        </span>
                        <span
                          className={`text-[10px] font-bold block ${
                            delivery.paymentStatus === "PAID" ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          {delivery.paymentMethod === "COD" ? "Cash on Delivery" : "Paid Online"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Order Items Summary */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-xs">
                    <div className="font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <PackageIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>Order Items ({delivery.itemCount} items)</span>
                    </div>
                    <p className="text-slate-800 font-medium leading-relaxed">
                      {delivery.itemsSummary || "Agricultural supplies and products"}
                    </p>
                  </div>

                  {/* Row 3: Pickup & Delivery Addresses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Shop Pickup Address */}
                    <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 flex items-center gap-1">
                          <MapPinIcon className="w-3.5 h-3.5 text-amber-600" />
                          <span>1. Shop Pickup Origin</span>
                        </span>
                        <a
                          href={pickupNavUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-amber-700 hover:underline"
                        >
                          Map Navigation ↗
                        </a>
                      </div>
                      <p className="text-gray-700 leading-snug">
                        {delivery.pickupAddress || "Merchant Store Location"}
                      </p>
                    </div>

                    {/* Farmer Delivery Address */}
                    <div className="p-3 bg-blue-50/50 border border-blue-200/60 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900 flex items-center gap-1">
                          <MapPinIcon className="w-3.5 h-3.5 text-blue-600" />
                          <span>2. Farmer Destination</span>
                        </span>
                        <a
                          href={dropNavUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-blue-700 hover:underline"
                        >
                          Map Navigation ↗
                        </a>
                      </div>
                      <p className="text-gray-700 leading-snug">
                        {delivery.deliveryAddress}
                      </p>
                    </div>
                  </div>

                  {/* Row 4: Customer Contact Info */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-gray-50/80 px-3.5 py-2.5 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-medium">Customer:</span>
                      <strong className="text-gray-900 font-bold">{delivery.customerName}</strong>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-600">{delivery.deliveryArea}</span>
                    </div>

                    {delivery.customerPhone && delivery.customerPhone !== "N/A" && (
                      <a
                        href={`tel:${delivery.customerPhone}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800"
                      >
                        <span>📞 Call Customer ({delivery.customerPhone})</span>
                      </a>
                    )}
                  </div>

                  {/* Row 5: Action Controls & Workflow Buttons */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Step 1: Confirm Pickup Button */}
                      {isAssigned && (
                        <button
                          type="button"
                          disabled={isCurrentActionLoading}
                          onClick={() => handlePickup(delivery.assignmentId)}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{isCurrentActionLoading ? "Processing..." : "Confirm Pickup 📦"}</span>
                        </button>
                      )}

                      {/* Step 2: Start Delivery (Out for Delivery) Button */}
                      {isPickedUp && (
                        <button
                          type="button"
                          disabled={isCurrentActionLoading}
                          onClick={() => handleStartDelivery(delivery.assignmentId)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{isCurrentActionLoading ? "Processing..." : "Start Delivery 🚚"}</span>
                        </button>
                      )}

                      {/* Step 3: Complete Delivery with OTP Button */}
                      {isInTransit && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveOtpAssignment(delivery);
                            setOtpError(null);
                            setOtpCode("");
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <span>Complete Delivery & Verify OTP 🔑</span>
                        </button>
                      )}

                      {/* Completed State */}
                      {isDelivered && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                          <span>Delivered & Verified</span>
                        </span>
                      )}
                    </div>

                    {/* Secondary Link to Detail Page */}
                    <Link
                      href={`/delivery/orders/${delivery.orderId || delivery.assignmentId}`}
                      className="text-xs font-bold text-gray-600 hover:text-blue-700 transition-colors"
                    >
                      Full Details & Tracking →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Interactive Delivery OTP Verification Modal */}
      {activeOtpAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-base font-bold">
                  🔑
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Delivery OTP Verification
                  </h3>
                  <span className="text-xs font-mono text-gray-500">
                    Order #{activeOtpAssignment.orderNumber}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveOtpAssignment(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-600 leading-relaxed">
              Ask the recipient (<strong className="text-gray-900">{activeOtpAssignment.customerName}</strong>) for their 6-digit delivery confirmation code to finalize item handover.
            </p>

            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  6-Digit Delivery OTP Code *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 549812"
                  className="w-full text-center font-mono text-2xl tracking-widest px-4 py-2.5 border-2 border-emerald-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Recipient Name (Optional if someone else collected)
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder={activeOtpAssignment.customerName}
                  className="w-full text-xs px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {otpError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800">
                  {otpError}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveOtpAssignment(null)}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoadingId === activeOtpAssignment.assignmentId}
                onClick={handleCompleteWithOtp}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {actionLoadingId === activeOtpAssignment.assignmentId ? "Verifying..." : "Confirm & Hand Over"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
