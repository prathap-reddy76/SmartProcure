import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getShopOrderDetail } from "@/actions/shop/order-fulfillment-actions";
import { FulfillmentActionButton } from "./fulfillment-action-button";

export const dynamic = "force-dynamic";

export default async function ShopOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getShopOrderDetail(orderId);

  if (!order) {
    notFound();
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "READY_FOR_DELIVERY":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "PROCESSING":
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "CONFIRMED":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "DELIVERED":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-amber-100 text-amber-800 border-amber-300";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ");
  };

  // Progression steps mapping for visual stepper
  const steps = [
    { key: "CONFIRMED", label: "Confirmed" },
    { key: "PROCESSING", label: "Processing" },
    { key: "READY_FOR_DELIVERY", label: "Ready for Delivery" },
    { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
    { key: "DELIVERED", label: "Delivered" },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return 0;
      case "PROCESSING":
        return 1;
      case "READY_FOR_DELIVERY":
        return 2;
      case "OUT_FOR_DELIVERY":
        return 3;
      case "DELIVERED":
        return 4;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.shopFulfillmentStatus);
  const isCancelled = order.shopFulfillmentStatus === "CANCELLED" || order.overallStatus === "CANCELLED";

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Navigation & Breadcrumb */}
      <div>
        <Link
          href="/shop/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors mb-3"
        >
          <span>← Back to Orders</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Order {order.orderNumber}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusBadge(
                  order.shopFulfillmentStatus
                )}`}
              >
                {formatStatus(order.shopFulfillmentStatus)}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Placed on{" "}
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Fulfillment Status Stepper Card */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Fulfillment Progression
          </div>
          <div className="text-xs text-gray-500">
            Overall Order Status:{" "}
            <strong className="text-gray-900 font-semibold">{formatStatus(order.overallStatus)}</strong>
          </div>
        </div>

        {isCancelled ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
            <strong>Order Status: CANCELLED</strong> — Customer cancelled this order. Any deducted stock has been restored to your inventory.
          </div>
        ) : (
          <div className="py-2">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 relative">
              {steps.map((step, idx) => {
                const isComplete = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={step.key} className="flex flex-col items-center text-center space-y-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                        isComplete
                          ? "bg-emerald-600 text-white shadow-xs shadow-emerald-500/30"
                          : "bg-gray-100 text-gray-400"
                      } ${isCurrent ? "ring-4 ring-emerald-100" : ""}`}
                    >
                      {isComplete ? "✓" : idx + 1}
                    </div>
                    <span
                      className={`text-[11px] leading-tight font-medium ${
                        isCurrent
                          ? "text-emerald-800 font-bold"
                          : isComplete
                          ? "text-gray-700"
                          : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Interactive Action Control Section */}
        <div className="pt-4 border-t border-gray-100">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
            Fulfillment Controls
          </div>
          <FulfillmentActionButton
            orderId={order.id}
            canMarkProcessing={order.canMarkProcessing}
            canMarkReady={order.canMarkReady}
            currentStatus={order.shopFulfillmentStatus}
            deliveryAssignment={order.deliveryAssignment}
          />
        </div>
      </div>

      {/* Main Content Grid: Items (Left) vs Customer & Payment Info (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Store Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Store Order Items ({order.items.length})
              </h2>
              <span className="text-xs text-emerald-700 font-semibold">
                Only products from your store
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-gray-900">{item.productName}</div>
                    <div className="text-xs text-gray-500">
                      Unit: <span className="font-medium text-gray-700">{item.unit || "Standard Unit"}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {formatPrice(item.productPrice)} × {item.quantity}
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="font-black text-sm text-gray-900">
                      {formatPrice(item.lineTotal)}
                    </div>
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getStatusBadge(
                        item.status
                      )}`}
                    >
                      {formatStatus(item.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Shop Total Bar */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Store Payout Subtotal
                </span>
                <p className="text-[11px] text-gray-400">Total amount payable to your store for these items</p>
              </div>
              <div className="text-xl font-black text-emerald-700">
                {formatPrice(order.shopTotal)}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer Contact & Delivery Address & Payment */}
        <div className="space-y-6">
          {/* Customer & Delivery Card */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-2">
              Customer & Delivery Details
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-gray-400 block font-medium">Customer Name</span>
                <span className="font-bold text-gray-900 text-sm">{order.shippingName}</span>
              </div>

              <div>
                <span className="text-gray-400 block font-medium">Contact Phone</span>
                <a
                  href={`tel:${order.shippingPhone}`}
                  className="font-bold text-emerald-700 hover:text-emerald-800 underline inline-flex items-center gap-1"
                >
                  <span>{order.shippingPhone}</span>
                  <span className="text-[10px]">📞</span>
                </a>
              </div>

              <div>
                <span className="text-gray-400 block font-medium">Delivery Address</span>
                <span className="font-medium text-gray-800 block leading-relaxed">
                  {order.shippingAddress}
                </span>
                <span className="text-gray-500 block">
                  {[order.shippingVillage, order.shippingDistrict, order.shippingState]
                    .filter(Boolean)
                    .join(", ")}
                </span>
                {order.shippingPincode && (
                  <span className="text-gray-500 block font-mono font-semibold">
                    PIN: {order.shippingPincode}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Logistics & Delivery Dispatch Card */}
          {order.deliveryAssignment && (
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Logistics & Dispatch
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    order.deliveryAssignment.status === "DELIVERED"
                      ? "bg-purple-100 text-purple-800"
                      : order.deliveryAssignment.status === "ASSIGNED" ||
                        order.deliveryAssignment.status === "PICKED_UP" ||
                        order.deliveryAssignment.status === "OUT_FOR_DELIVERY"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {order.deliveryAssignment.status.replace(/_/g, " ")}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {order.deliveryAssignment.partnerName ? (
                  <>
                    <div>
                      <span className="text-gray-400 block font-medium">Assigned Partner</span>
                      <span className="font-bold text-gray-900 text-sm">{order.deliveryAssignment.partnerName}</span>
                    </div>

                    {order.deliveryAssignment.partnerPhone && (
                      <div>
                        <span className="text-gray-400 block font-medium">Contact Number</span>
                        <a
                          href={`tel:${order.deliveryAssignment.partnerPhone}`}
                          className="font-bold text-emerald-700 hover:text-emerald-800 underline inline-flex items-center gap-1"
                        >
                          <span>{order.deliveryAssignment.partnerPhone}</span>
                          <span className="text-[10px]">📞</span>
                        </a>
                      </div>
                    )}

                    {order.deliveryAssignment.vehicleType && (
                      <div>
                        <span className="text-gray-400 block font-medium">Assigned Vehicle</span>
                        <span className="font-medium text-gray-800">
                          {order.deliveryAssignment.vehicleType}
                          {order.deliveryAssignment.vehicleNumber
                            ? ` (${order.deliveryAssignment.vehicleNumber})`
                            : ""}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200/70 rounded-xl text-amber-900">
                    <span className="font-bold block">Assignment In Progress</span>
                    <span className="text-[11px] text-amber-800">
                      Looking for an available delivery driver nearby. Driver details will appear here as soon as assigned.
                    </span>
                  </div>
                )}

                {order.deliveryAssignment.deliveryCode && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <span className="text-gray-500 block text-[11px] font-medium">
                      Handover Verification Code
                    </span>
                    <span className="font-mono font-black text-gray-900 text-base tracking-widest">
                      {order.deliveryAssignment.deliveryCode}
                    </span>
                    <span className="text-gray-400 block text-[10px] mt-0.5">
                      Verify with the driver during package pickup
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Card */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-2">
              Payment Information
            </h3>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Method:</span>
              <span className="font-bold text-gray-900 uppercase">
                {order.paymentMethod === "COD" ? "Cash on Delivery (COD)" : "UPI Online"}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Payment Status:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                  order.paymentStatus === "PAID"
                    ? "bg-emerald-50 text-emerald-700"
                    : order.paymentStatus === "CANCELLED"
                    ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
