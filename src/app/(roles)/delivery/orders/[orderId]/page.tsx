import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPartnerDeliveryDetail } from "@/actions/delivery/delivery-actions";
import { DeliveryActionPanel } from "./delivery-action-panel";

export const dynamic = "force-dynamic";

export default async function PartnerDeliveryDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const delivery = await getPartnerDeliveryDetail(orderId);

  if (!delivery) {
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
      case "ASSIGNED":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "PICKED_UP":
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "OUT_FOR_DELIVERY":
      case "IN_TRANSIT":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "DELIVERED":
      case "RETURNED":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "EXCEPTION":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ");
  };

  const steps = [
    { key: "ASSIGNED", label: "Assigned" },
    { key: "PICKED_UP", label: "Picked Up" },
    { key: "OUT_FOR_DELIVERY", label: delivery.deliveryType === "MACHINERY_RETURN" ? "In Transit" : "Out for Delivery" },
    { key: "DELIVERED", label: delivery.deliveryType === "MACHINERY_RETURN" ? "Returned" : "Delivered" },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return 0;
      case "PICKED_UP":
        return 1;
      case "OUT_FOR_DELIVERY":
      case "IN_TRANSIT":
        return 2;
      case "DELIVERED":
      case "RETURNED":
        return 3;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(delivery.deliveryStatus);
  const isCancelled = delivery.deliveryStatus === "CANCELLED";
  const isException = delivery.deliveryStatus === "EXCEPTION";

  const pickupNavUrl = delivery.pickupLatitude && delivery.pickupLongitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${delivery.pickupLatitude},${delivery.pickupLongitude}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(delivery.pickupAddress || "")}`;

  const dropNavUrl = delivery.dropLatitude && delivery.dropLongitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${delivery.dropLatitude},${delivery.dropLongitude}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(delivery.shippingAddress)}`;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/delivery/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 transition-colors mb-3"
        >
          <span>← Back to My Deliveries</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Run #{delivery.orderNumber}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusBadge(
                  delivery.deliveryStatus
                )}`}
              >
                {formatStatus(delivery.deliveryStatus)}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                {delivery.deliveryType === "MACHINERY_RENTAL"
                  ? "🚜 Machinery Outbound"
                  : delivery.deliveryType === "MACHINERY_RETURN"
                  ? "🔄 Machinery Return"
                  : "📦 Marketplace Order"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Claimed on{" "}
              {new Date(delivery.assignedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {delivery.deliveryWindow && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl px-4 py-2 text-xs">
              <span className="text-blue-600 font-bold block uppercase text-[10px] tracking-wider">Scheduled Window</span>
              <span className="font-extrabold text-blue-950 text-sm">🕒 {delivery.deliveryWindow}</span>
            </div>
          )}
        </div>
      </div>

      {/* Exception Alert Banner */}
      {isException && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl text-xs text-orange-900 space-y-1">
          <div className="font-bold text-sm flex items-center gap-1.5">
            <span>⚠️ Delivery Exception Reported</span>
          </div>
          <p>
            Reason: <strong>{delivery.deliveryExceptionReason || "Pending resolution"}</strong>
          </p>
          <p className="text-orange-700">
            You can reschedule the delivery window below once the issue is cleared.
          </p>
        </div>
      )}

      {/* Stepper Card */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-6 sm:p-8 space-y-6">
        {!isCancelled && (
          <div>
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 z-0" />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 transition-all duration-500 z-0"
                style={{
                  width: `${(currentStepIdx / (steps.length - 1)) * 100}%`,
                }}
              />

              {steps.map((step, idx) => {
                const isComplete = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        isComplete
                          ? "bg-blue-600 text-white shadow-xs"
                          : isCurrent
                          ? "bg-white border-2 border-blue-600 text-blue-600 shadow-md ring-4 ring-blue-50"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isComplete ? "✓" : idx + 1}
                    </div>
                    <span
                      className={`text-[11px] leading-tight font-medium ${
                        isCurrent
                          ? "text-blue-800 font-bold"
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

        {/* Action Panel */}
        <div className="pt-4 border-t border-gray-100">
          <DeliveryActionPanel
            assignmentId={delivery.assignmentId}
            orderId={delivery.orderId}
            canConfirmPickup={delivery.canConfirmPickup}
            canMarkOutForDelivery={delivery.canMarkOutForDelivery}
            canMarkDelivered={delivery.canMarkDelivered}
            canReportException={delivery.canReportException}
            canReschedule={delivery.canReschedule}
            currentStatus={delivery.deliveryStatus}
            paymentMethod={delivery.paymentMethod || "ONLINE"}
            paymentStatus={delivery.paymentStatus || "PAID"}
            totalAmount={delivery.totalAmount}
            deliveryWindow={delivery.deliveryWindow}
            deliveryType={delivery.deliveryType}
          />
        </div>
      </div>

      {/* Origin, Destination & Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Pickup & Drop Destinations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pickup Point Card */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                <span>📍 Origin (Pickup Point)</span>
              </h2>
              {delivery.pickupAddress && (
                <a
                  href={pickupNavUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 hover:underline"
                >
                  <span>🗺️ Google Maps Directions</span>
                  <span>↗</span>
                </a>
              )}
            </div>

            <div className="text-xs space-y-1">
              <p className="font-semibold text-gray-900 text-sm leading-relaxed">
                {delivery.pickupAddress || "Origin address on file"}
              </p>
              {delivery.pickupLatitude && delivery.pickupLongitude && (
                <p className="text-gray-400 font-mono text-[11px]">
                  Coords: {delivery.pickupLatitude.toFixed(4)}, {delivery.pickupLongitude.toFixed(4)}
                </p>
              )}
            </div>
          </div>

          {/* Drop-off Destination Card */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                <span>🎯 Destination (Drop-off Point)</span>
              </h2>
              <a
                href={dropNavUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 hover:underline"
              >
                <span>🗺️ Google Maps Directions</span>
                <span>↗</span>
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 block font-medium">Recipient Name</span>
                <span className="font-bold text-gray-900 text-sm">{delivery.customerName}</span>
              </div>

              <div>
                <span className="text-gray-400 block font-medium">Contact Phone</span>
                <a
                  href={`tel:${delivery.customerPhone}`}
                  className="font-bold text-blue-700 hover:text-blue-800 underline text-sm inline-flex items-center gap-1.5"
                >
                  <span>{delivery.customerPhone}</span>
                  <span className="text-xs">📞 Call</span>
                </a>
              </div>
            </div>

            <div className="pt-2 text-xs space-y-1">
              <span className="text-gray-400 block font-medium">Delivery Address</span>
              <p className="font-semibold text-gray-900 text-sm leading-relaxed">
                {delivery.shippingAddress}
              </p>
              <p className="text-gray-600">
                {[delivery.shippingVillage, delivery.shippingDistrict, delivery.shippingState]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {delivery.shippingPincode && (
                <p className="font-mono font-semibold text-blue-800">
                  PIN Code: {delivery.shippingPincode}
                </p>
              )}
            </div>
          </div>

          {/* Package Contents */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-2">
              Package & Equipment Contents ({delivery.items.length} Items)
            </h2>

            <div className="divide-y divide-gray-100">
              {delivery.items.map((item) => (
                <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-gray-900 block">{item.productName}</span>
                    <span className="text-gray-500 text-[11px]">
                      Qty: {item.quantity} {item.unit ? `(${item.unit})` : ""} • Provider: {item.shopName || "Partner"}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-700">
                    {formatPrice(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Financial / Payment Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-2">
              Payment & Settlement
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Total Value:</span>
                <span className="font-black text-base text-gray-900">
                  {formatPrice(delivery.totalAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">Payment Method:</span>
                <span className="font-bold text-gray-900 uppercase">
                  {delivery.paymentMethod === "COD" ? "Cash on Delivery" : "Online / Prepaid"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">Payment Status:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                    delivery.paymentStatus === "PAID"
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {delivery.paymentStatus || "PAID"}
                </span>
              </div>

              {delivery.paymentMethod === "COD" && delivery.deliveryStatus !== "DELIVERED" && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-bold text-center">
                  Collect Cash: {formatPrice(delivery.totalAmount)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
