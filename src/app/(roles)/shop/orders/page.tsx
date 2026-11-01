import React from "react";
import Link from "next/link";
import { getShopOrders } from "@/actions/shop/order-fulfillment-actions";
import { OrdersFilter } from "./orders-filter";
import { OrdersIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function ShopOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const qParams = await searchParams;
  const statusParam = typeof qParams.status === "string" ? qParams.status : undefined;
  const searchParam = typeof qParams.search === "string" ? qParams.search : undefined;

  const page = parseInt(typeof qParams.page === "string" ? qParams.page : "1", 10) || 1;
  const { items: orders, totalPages, currentPage } = await getShopOrders({
    status: statusParam,
    search: searchParam,
    page,
    limit: 12
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
      case "READY_FOR_DELIVERY":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "PROCESSING":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "CONFIRMED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "DELIVERED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
          <OrdersIcon className="w-4 h-4" />
          <span>Fulfillment Central</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Store Orders
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Review incoming orders for your products, update packaging status, and prepare items for dispatch.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <OrdersFilter
        currentStatus={statusParam}
        currentSearch={searchParam}
      />

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/90 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <OrdersIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Orders Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {searchParam || statusParam
              ? "No orders matched your selected filter or search criteria."
              : "No orders containing products from your store have been placed yet."}
          </p>
          {(searchParam || statusParam) && (
            <div className="pt-2">
              <Link
                href="/shop/orders"
                className="inline-flex px-3.5 py-1.5 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-lg hover:bg-emerald-100 transition-colors"
              >
                Reset Filters
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden"
            >
              {/* Order Card Top Bar */}
              <div className="bg-gray-50/70 px-5 py-3.5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                      Order Number
                    </span>
                    <span className="font-mono font-bold text-gray-900 text-sm">
                      {order.orderNumber}
                    </span>
                  </div>
                  <div className="hidden sm:block border-l border-gray-200 pl-3">
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                      Date Placed
                    </span>
                    <span className="text-gray-700 font-medium">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
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
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusBadge(
                      order.shopFulfillmentStatus
                    )}`}
                  >
                    {formatStatus(order.shopFulfillmentStatus)}
                  </span>
                </div>
              </div>

              {/* Order Card Body */}
              <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                {/* Left 2 Cols: Order Items belonging to this shop */}
                <div className="lg:col-span-2 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Your Store Items ({order.items.length})
                  </div>
                  <div className="divide-y divide-gray-100">
                    {order.items.map((item) => (
                      <div key={item.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-4">
                          <span className="font-semibold text-gray-900 block truncate">
                            {item.productName}
                          </span>
                          <span className="text-gray-500 text-[11px]">
                            Qty: <strong className="text-gray-800">{item.quantity}</strong> {item.unit ? `(${item.unit})` : ""} • {formatPrice(item.productPrice)} each
                          </span>
                        </div>
                        <div className="font-bold text-gray-900 shrink-0">
                          {formatPrice(item.lineTotal)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Customer Information snippet */}
                  <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                    <span>
                      Customer: <strong className="text-gray-900 font-semibold">{order.customerName}</strong>
                    </span>
                    <span>•</span>
                    <span>Phone: {order.customerPhone}</span>
                    <span>•</span>
                    <span>Location: {order.customerLocation}</span>
                  </div>
                </div>

                {/* Right Col: Shop Payout & Action */}
                <div className="lg:border-l lg:border-gray-100 lg:pl-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400 font-medium">Store Payout</span>
                    <div className="text-2xl font-black text-gray-900">
                      {formatPrice(order.shopTotal)}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Payment: <span className="font-semibold uppercase text-gray-700">{order.paymentMethod}</span> ({order.paymentStatus})
                    </div>
                  </div>

                  <div>
                    <Link
                      href={`/shop/orders/${order.id}`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                    >
                      <span>Fulfill / View Details</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
