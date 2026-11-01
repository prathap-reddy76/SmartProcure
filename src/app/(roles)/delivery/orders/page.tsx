import React from "react";
import Link from "next/link";
import { getPartnerDeliveries } from "@/actions/delivery/delivery-actions";
import { DeliveriesFilter } from "./deliveries-filter";
import { TruckIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function PartnerDeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const qParams = await searchParams;
  const statusParam = typeof qParams.status === "string" ? qParams.status : undefined;
  const searchParam = typeof qParams.search === "string" ? qParams.search : undefined;

  const deliveries = await getPartnerDeliveries({
    status: statusParam,
    search: searchParam,
  });

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
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "PICKED_UP":
        return "bg-indigo-50 text-indigo-800 border-indigo-200";
      case "OUT_FOR_DELIVERY":
      case "IN_TRANSIT":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "DELIVERED":
      case "RETURNED":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "EXCEPTION":
        return "bg-orange-50 text-orange-800 border-orange-200";
      case "CANCELLED":
        return "bg-red-50 text-red-800 border-red-200";
      default:
        return "bg-gray-50 text-gray-800 border-gray-200";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
          <TruckIcon className="w-4 h-4" />
          <span>Active Assignment Manifest</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          My Delivery Runs ({deliveries.length})
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Deliveries claimed and managed by your account. Complete runs step-by-step.
        </p>
      </div>

      {/* Filter Tabs */}
      <DeliveriesFilter currentStatus={statusParam} />

      {/* Deliveries List */}
      {deliveries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/90 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <TruckIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Deliveries in this Status</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {statusParam
              ? `You do not have any deliveries currently marked as ${formatStatus(statusParam)}.`
              : "You have not claimed any deliveries yet. Browse available orders to accept deliveries."}
          </p>
          <div className="pt-2">
            <Link
              href="/delivery/available"
              className="inline-flex px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
            >
              Browse Available Deliveries
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map((delivery) => (
            <div
              key={delivery.assignmentId}
              className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-gray-50/70 px-5 py-3.5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                      Tracking Run #
                    </span>
                    <span className="font-mono font-bold text-gray-900 text-sm">
                      {delivery.orderNumber}
                    </span>
                  </div>
                  <div className="hidden sm:block border-l border-gray-200 pl-3">
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                      Claimed On
                    </span>
                    <span className="text-gray-700 font-medium">
                      {new Date(delivery.assignedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                    {delivery.deliveryType === "MACHINERY_RENTAL"
                      ? "🚜 Machinery"
                      : delivery.deliveryType === "MACHINERY_RETURN"
                      ? "🔄 Return"
                      : "📦 Order"}
                  </span>
                  {delivery.deliveryWindow && (
                    <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      🕒 {delivery.deliveryWindow}
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusBadge(
                      delivery.status
                    )}`}
                  >
                    {formatStatus(delivery.status)}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2 text-xs">
                  <div className="text-sm font-bold text-gray-900">
                    Customer / Recipient: {delivery.customerName}
                  </div>
                  <div className="text-gray-600 flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-blue-700">📞 {delivery.customerPhone}</span>
                    <span className="text-gray-300">•</span>
                    <span>{delivery.deliveryArea}</span>
                  </div>
                  <div className="text-gray-500 max-w-xl leading-relaxed">
                    {delivery.deliveryAddress}
                  </div>
                  {delivery.deliveryExceptionReason && (
                    <div className="text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-md text-[11px] font-medium">
                      ⚠️ Exception: {delivery.deliveryExceptionReason}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-gray-400 block font-medium">Payment</span>
                    <span className="font-black text-sm text-gray-900">
                      {formatPrice(delivery.totalAmount)}
                    </span>
                    <span className="text-[10px] text-gray-500 block uppercase font-semibold">
                      {delivery.paymentMethod || "ONLINE"} ({delivery.paymentStatus || "PAID"})
                    </span>
                  </div>

                  <Link
                    href={`/delivery/orders/${delivery.orderId || delivery.assignmentId}`}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
                  >
                    Manage Run →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
