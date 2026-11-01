import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import { getFarmerOrders } from "@/actions/order/order-actions";
import { OrdersIcon, MarketIcon } from "@/components/ui/icons";

export default async function MyOrdersPage() {
  await requireRole("FARMER");
  const res = await getFarmerOrders();
  const orders = res.orders || [];

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <OrdersIcon className="w-6 h-6 text-green-700" />
            <span>My Farm Supply Orders</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track historical and active agricultural supply orders, delivery statuses, and invoices.
          </p>
        </div>

        <Link
          href="/farmer/marketplace"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-800 text-xs font-bold rounded-lg border border-green-200 transition-colors self-start sm:self-auto"
        >
          <MarketIcon className="w-4 h-4" />
          <span>Browse Marketplace</span>
        </Link>
      </div>

      {/* Orders List or Empty State */}
      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs hover:border-green-300 hover:shadow-xs transition-all p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-gray-900 text-base">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>

                                    <p className="text-xs text-gray-500">
                    Ordered on {formattedDate} &bull; {order.itemCount}{" "}
                    {order.itemCount === 1 ? "unit" : "units"} ({order.firstItemName}
                    {order.itemCount > 1 ? " & more" : ""})
                  </p>
                  
                  {order.shopName && (
                    <p className="text-[11px] text-gray-400">
                      Shop: <span className="text-gray-600 font-medium">{order.shopName}</span>
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs pt-1 mt-1">
                    {order.deliveryStatus && (
                      <React.Fragment>
                        <span className="text-gray-400 font-medium">Delivery:</span>
                        <span className="font-semibold text-gray-700 capitalize">
                          {order.deliveryStatus.replace(/_/g, " ").toLowerCase()}
                        </span>
                        <span className="text-gray-300 hidden sm:inline">&bull;</span>
                      </React.Fragment>
                    )}
                    <span className="text-gray-400 font-medium">Payment:</span>
                    <span className="font-semibold text-gray-700">
                      {order.paymentMethod === "COD" ? "Cash on Delivery" : "UPI"}
                    </span>
                    <span className="text-gray-300">&bull;</span>
                    <span
                      className={`font-semibold ${
                        order.paymentStatus === "PAID"
                          ? "text-emerald-700"
                          : order.paymentStatus === "CANCELLED"
                          ? "text-red-700"
                          : "text-amber-700"
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 gap-2">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">
                      Order Total
                    </span>
                    <span className="text-lg font-black text-green-950">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>

                  <Link
                    href={`/farmer/orders/${order.id}`}
                    className="inline-flex items-center justify-center px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
                  >
                    View Order Details &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-8 sm:p-14 text-center max-w-lg mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <OrdersIcon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No orders placed yet</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto leading-relaxed">
            When you purchase seeds, fertilizers, or farm tools from the agricultural marketplace, your order status and digital receipts will appear here.
          </p>
          <Link
            href="/farmer/marketplace"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl text-sm shadow-xs transition-colors"
          >
            <span>Browse Marketplace</span>
            <span>&rarr;</span>
          </Link>
        </div>
      )}
    </div>
  );
}
