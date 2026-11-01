import React from "react";
import Link from "next/link";
import {
  getAvailableDeliveries,
  getDeliveryPartnerProfile,
} from "@/actions/delivery/delivery-actions";
import { AcceptDeliveryButton } from "./accept-delivery-button";
import { PackageIcon, TruckIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function AvailableDeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const qParams = await searchParams;
  const searchParam = typeof qParams.search === "string" ? qParams.search : undefined;
  const typeParam = typeof qParams.type === "string" ? qParams.type : "ALL";

  const [deliveries, profile] = await Promise.all([
    getAvailableDeliveries({ search: searchParam, type: typeParam }),
    getDeliveryPartnerProfile(),
  ]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const isAvailable = profile?.isAvailable ?? false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
          <PackageIcon className="w-4 h-4" />
          <span>Dispatch Bay</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Available Deliveries ({deliveries.length})
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Agricultural orders and equipment rentals ready for dispatch and transport.
            </p>
          </div>

          {/* Type Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            <Link
              href="/delivery/available"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                typeParam === "ALL" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Runs
            </Link>
            <Link
              href="/delivery/available?type=ORDER"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                typeParam === "ORDER" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              📦 Orders
            </Link>
            <Link
              href="/delivery/available?type=MACHINERY_RENTAL"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                typeParam === "MACHINERY_RENTAL" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              🚜 Machinery
            </Link>
            <Link
              href="/delivery/available?type=MACHINERY_RETURN"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                typeParam === "MACHINERY_RETURN" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              🔄 Returns
            </Link>
          </div>
        </div>
      </div>

      {/* Availability Notice if Off Duty */}
      {!isAvailable && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span>
              <strong>You are currently marked as Off Duty.</strong> Toggle your status to Available in your profile to claim deliveries.
            </span>
          </div>
          <Link
            href="/delivery/profile"
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-center transition-colors shrink-0"
          >
            Go On Duty →
          </Link>
        </div>
      )}

      {/* Deliveries Grid */}
      {deliveries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/90 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <PackageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Shipments Available</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            All current orders and equipment rentals have either been assigned or are still being prepared. Check back shortly.
          </p>
          <div className="pt-2">
            <Link
              href="/delivery/dashboard"
              className="inline-flex px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-gray-900">
                      #{delivery.orderNumber}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                      {delivery.deliveryType === "MACHINERY_RENTAL"
                        ? "🚜 Machinery"
                        : delivery.deliveryType === "MACHINERY_RETURN"
                        ? "🔄 Return"
                        : "📦 Order"}
                    </span>
                  </div>
                  {delivery.deliveryWindow && (
                    <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                      🕒 {delivery.deliveryWindow}
                    </span>
                  )}
                </div>

                <div className="text-xs space-y-1.5 text-gray-600">
                  <div>
                    <span className="text-gray-400 font-medium">📍 Origin (Pickup): </span>
                    <span className="text-gray-800 font-semibold">{delivery.pickupAddress || "Partner Store"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">🎯 Drop-off: </span>
                    <span className="text-gray-800 font-semibold">{delivery.deliveryAddress}</span>
                    {delivery.pincode && <span> (PIN: {delivery.pincode})</span>}
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Contents ({delivery.itemCount}): </span>
                    <span className="text-gray-700 font-medium truncate block">
                      {delivery.itemsSummary}
                    </span>
                  </div>
                  {delivery.requiredCapacity && (
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                        <TruckIcon className="w-3 h-3" />
                        <span>Required Vehicle: {delivery.requiredCapacity}</span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[11px] text-gray-400 block font-medium">Value</span>
                    <span className="font-black text-sm text-gray-900">
                      {formatPrice(delivery.totalAmount)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-gray-400 block font-medium">Payment Mode</span>
                    <span className="font-bold text-xs uppercase text-gray-700">
                      {delivery.paymentMethod || "PREPAID"} ({delivery.paymentStatus || "PAID"})
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <AcceptDeliveryButton
                  orderId={delivery.id}
                  isAvailable={isAvailable}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
