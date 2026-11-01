import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-utils";
import { getOrderDetail } from "@/actions/order/order-actions";
import { CheckCircleIcon, OrdersIcon, TruckIcon } from "@/components/ui/icons";
import { CancelOrderButton } from "./cancel-order-button";
import { DeliveryTrackingMapWrapper } from "@/components/farmer/delivery-tracking-map-wrapper";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole("FARMER");
  const { orderId } = await params;
  const qParams = await searchParams;
  const isJustPlaced = qParams.placed === "true";

  const res = await getOrderDetail(orderId);
  const order = res.order;

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

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "PENDING":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "READY_FOR_DELIVERY":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "OUT_FOR_DELIVERY":
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "DELIVERED":
        return "bg-green-100 text-green-800 border-green-300";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-gray-500 flex items-center gap-1.5" aria-label="Breadcrumb">
        <Link href="/farmer/dashboard" className="hover:text-green-700">
          Dashboard
        </Link>
        <span>&rsaquo;</span>
        <Link href="/farmer/orders" className="hover:text-green-700">
          My Orders
        </Link>
        <span>&rsaquo;</span>
        <span className="text-gray-800 font-mono font-medium">{order.orderNumber}</span>
      </nav>

      {/* Just Placed Success Banner */}
      {isJustPlaced && (
        <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white rounded-2xl p-6 sm:p-8 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <CheckCircleIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Order Placed Successfully!
            </h1>
            <p className="mt-1 text-emerald-100 text-sm leading-relaxed">
              Your agricultural supplies order has been verified and confirmed. The vendor has received your order request.
            </p>
          </div>
        </div>
      )}

      {/* Main Order Header Details Card */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-100">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Order Reference
            </span>
            <h2 className="text-xl font-black text-gray-900 font-mono tracking-tight">
              {order.orderNumber}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Placed on {formattedDate}</p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusBadge(
                order.status
              )}`}
            >
              {order.status}
            </span>

            {order.isCancellable && <CancelOrderButton orderId={order.id} />}
          </div>
        </div>

        {/* 2-Column Specs: Delivery Address & Payment Method */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Delivery Address Snapshot */}
          <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100 space-y-1.5 text-xs">
            <span className="font-bold text-gray-700 uppercase tracking-wider block mb-1">
              Delivery Address Snapshot
            </span>
            <p className="font-bold text-gray-900 text-sm">{order.shippingName}</p>
            <p className="text-gray-600 font-medium">{order.shippingPhone}</p>
            <p className="text-gray-700 leading-relaxed">{order.shippingAddress}</p>
            <p className="text-gray-600">
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

          {/* Payment Method Details */}
          <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100 space-y-1.5 text-xs">
            <span className="font-bold text-gray-700 uppercase tracking-wider block mb-1">
              Payment Information
            </span>
            <div className="flex justify-between py-1">
              <span className="text-gray-500 font-medium">Payment Method:</span>
              <span className="font-bold text-gray-900">
                {order.paymentMethod === "COD" ? "Cash on Delivery (COD)" : "UPI Payment"}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500 font-medium">Payment Status:</span>
              <span
                className={`font-bold ${
                  order.paymentStatus === "PAID"
                    ? "text-emerald-700"
                    : order.paymentStatus === "CANCELLED"
                    ? "text-red-700"
                    : "text-amber-800"
                }`}
              >
                {order.paymentStatus}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 pt-1 leading-relaxed border-t border-gray-200">
              {order.paymentMethod === "COD"
                ? "Please keep exact cash ready upon delivery to your farm location."
                : "Payment confirmation recorded."}
            </p>
          </div>
        </div>
      </div>

      {/* Live Delivery Tracking Section */}
      {order.deliveryInfo ? (
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-green-50 text-green-700 flex items-center justify-center border border-green-100">
                <TruckIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Live Delivery Tracking</h3>
                <p className="text-xs text-gray-500">Track delivery partner progression to your farm</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {order.deliveryInfo.deliveryWindow && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  🕒 Window: {order.deliveryInfo.deliveryWindow}
                </span>
              )}
              {order.deliveryInfo.estimatedDistanceKm && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700">
                  📍 {order.deliveryInfo.estimatedDistanceKm.toFixed(1)} km
                </span>
              )}
              <span className="px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider bg-indigo-50 text-indigo-800 border-indigo-200">
                {order.deliveryInfo.status.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          {order.deliveryInfo.status === "EXCEPTION" && (
            <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-900 space-y-1">
              <span className="font-bold block">⚠️ Delivery Exception Note:</span>
              <p>{order.deliveryInfo.deliveryExceptionReason || "The delivery partner encountered a minor delay and is coordinating delivery."}</p>
            </div>
          )}

          {/* Stepper */}
          <div className="relative">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(() => {
                const isStep2Done = ["PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"].includes(
                  order.deliveryInfo.status
                );
                const isStep3Done = ["OUT_FOR_DELIVERY", "DELIVERED"].includes(
                  order.deliveryInfo.status
                );
                const isStep4Done = order.deliveryInfo.status === "DELIVERED";

                return (
                  <>
                    <div className="space-y-1.5 border-l-2 md:border-l-0 md:border-t-2 pl-3 md:pl-0 md:pt-3 border-emerald-500">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        <span>1. Assigned</span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        {order.deliveryInfo.assignedAt
                          ? new Date(order.deliveryInfo.assignedAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Pending partner"}
                      </p>
                    </div>

                    <div
                      className={`space-y-1.5 border-l-2 md:border-l-0 md:border-t-2 pl-3 md:pl-0 md:pt-3 ${
                        isStep2Done ? "border-emerald-500" : "border-gray-200"
                      }`}
                    >
                      <div
                        className={`flex items-center gap-1.5 text-xs font-bold ${
                          isStep2Done ? "text-emerald-700" : "text-gray-400"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isStep2Done ? "bg-emerald-600" : "bg-gray-300"
                          }`}
                        ></span>
                        <span>2. Picked Up</span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        {order.deliveryInfo.pickedUpAt
                          ? new Date(order.deliveryInfo.pickedUpAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Pending pickup"}
                      </p>
                    </div>

                    <div
                      className={`space-y-1.5 border-l-2 md:border-l-0 md:border-t-2 pl-3 md:pl-0 md:pt-3 ${
                        isStep3Done ? "border-emerald-500" : "border-gray-200"
                      }`}
                    >
                      <div
                        className={`flex items-center gap-1.5 text-xs font-bold ${
                          isStep3Done ? "text-emerald-700" : "text-gray-400"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isStep3Done ? "bg-emerald-600" : "bg-gray-300"
                          }`}
                        ></span>
                        <span>3. Out for Delivery</span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        {order.deliveryInfo.outForDeliveryAt
                          ? new Date(order.deliveryInfo.outForDeliveryAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "In transit to hub"}
                      </p>
                    </div>

                    <div
                      className={`space-y-1.5 border-l-2 md:border-l-0 md:border-t-2 pl-3 md:pl-0 md:pt-3 ${
                        isStep4Done ? "border-emerald-500" : "border-gray-200"
                      }`}
                    >
                      <div
                        className={`flex items-center gap-1.5 text-xs font-bold ${
                          isStep4Done ? "text-emerald-700" : "text-gray-400"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isStep4Done ? "bg-emerald-600" : "bg-gray-300"
                          }`}
                        ></span>
                        <span>4. Delivered</span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        {order.deliveryInfo.deliveredAt
                          ? new Date(order.deliveryInfo.deliveredAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Pending delivery"}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Delivery Partner Details & Handover OTP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100 space-y-1.5 text-xs">
              <span className="font-bold text-gray-700 uppercase tracking-wider block mb-1">
                Assigned Delivery Partner
              </span>
              <p className="font-bold text-gray-900 text-sm">
                {order.deliveryInfo.deliveryPartnerName}
              </p>
              {order.deliveryInfo.deliveryPartnerPhone && (
                <p className="text-gray-600 font-medium">
                  Contact: {order.deliveryInfo.deliveryPartnerPhone}
                </p>
              )}
              {(order.deliveryInfo.vehicleType || order.deliveryInfo.vehicleNumber) && (
                <p className="text-gray-600">
                  Vehicle:{" "}
                  {[order.deliveryInfo.vehicleType, order.deliveryInfo.vehicleNumber]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
              )}
            </div>

            {/* OTP Handover Box */}
            {order.deliveryInfo.status !== "DELIVERED" && order.deliveryInfo.deliveryCode ? (
              <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200 space-y-2">
                <span className="font-bold text-amber-900 text-xs uppercase tracking-wider block">
                  Delivery Handover PIN (OTP)
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black font-mono tracking-widest text-amber-950 bg-white px-3 py-1 rounded-lg border border-amber-300 shadow-2xs">
                    {order.deliveryInfo.deliveryCode}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Share this 6-digit verification code with the delivery partner upon arrival to confirm receipt of your agricultural items.
                </p>
              </div>
            ) : order.deliveryInfo.status === "DELIVERED" ? (
              <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 space-y-1.5 text-xs">
                <span className="font-bold text-emerald-900 uppercase tracking-wider block">
                  Delivery Confirmation
                </span>
                <p className="text-emerald-800 font-semibold">
                  Delivered on{" "}
                  {order.deliveryInfo.deliveredAt
                    ? new Date(order.deliveryInfo.deliveredAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Completed"}
                </p>
                <p className="text-[11px] text-emerald-700">
                  Verification PIN was successfully validated by the delivery agent.
                </p>
              </div>
            ) : null}
          </div>
          
          {/* Delivery Tracking Map */}
          {order.deliveryInfo.status !== "DELIVERED" &&
            order.deliveryInfo.lastKnownLat &&
            order.deliveryInfo.lastKnownLon && (
              <div className="pt-4 mt-4 border-t border-gray-100">
                <h4 className="font-bold text-gray-900 text-sm mb-3">Live Tracking</h4>
                <DeliveryTrackingMapWrapper
                  partnerLat={order.deliveryInfo.lastKnownLat}
                  partnerLon={order.deliveryInfo.lastKnownLon}
                  partnerName={order.deliveryInfo.deliveryPartnerName}
                  updatedAt={order.deliveryInfo.lastLocationUpdatedAt || null}
                />
              </div>
            )}
        </div>
      ) : order.status === "READY_FOR_DELIVERY" ? (
        <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
            <TruckIcon className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-purple-950 text-sm">Awaiting Delivery Partner Assignment</h4>
            <p className="text-purple-800 leading-relaxed">
              The agro-shop has packed your items and marked this order as ready for pickup. A nearby delivery partner will accept this delivery shortly.
            </p>
          </div>
        </div>
      ) : null}

      {/* Ordered Items Table / List */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 space-y-4">
        <h3 className="text-base font-bold text-gray-900 border-b pb-3 flex items-center gap-2">
          <OrdersIcon className="w-5 h-5 text-green-700" />
          <span>Items Ordered ({order.items.length})</span>
        </h3>

        <div className="divide-y divide-gray-100">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
            >
              <div>
                <span className="font-bold text-gray-900 block">{item.productName}</span>
                <span className="text-xs text-gray-500">
                  Seller: {item.shopName || "Verified Agro-Shop"}
                </span>
                <div className="text-xs text-gray-600 mt-0.5">
                  {formatPrice(item.productPrice)}
                  {item.unit && ` / ${item.unit}`} &bull; Quantity:{" "}
                  <span className="font-bold text-gray-900">{item.quantity}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">
                  Line Total
                </span>
                <span className="font-extrabold text-gray-900 text-base">
                  {formatPrice(item.lineTotal)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Financial Summary */}
        <div className="pt-4 border-t border-gray-200 space-y-2 text-xs text-gray-600 max-w-xs ml-auto">
          <div className="flex justify-between">
            <span>Items Subtotal</span>
            <span className="font-bold text-gray-900">{formatPrice(order.subtotal)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span>Delivery Fee</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              FREE
            </span>
          </div>

          <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline text-sm">
            <span className="font-bold text-gray-900">Total Order Amount</span>
            <span className="text-xl font-black text-green-950">
              {formatPrice(order.totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center pt-2">
        <Link
          href="/farmer/orders"
          className="text-xs font-bold text-green-700 hover:text-green-900 flex items-center gap-1"
        >
          &larr; Return to All Orders
        </Link>
        <Link
          href="/farmer/marketplace"
          className="text-xs font-bold text-gray-600 hover:text-gray-900"
        >
          Continue Shopping &rarr;
        </Link>
      </div>
    </div>
  );
}
