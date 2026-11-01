import React from "react";
import Link from "next/link";
import { getShopDashboardData } from "@/actions/shop/shop-actions";
import {
  OrdersIcon,
  MarketIcon,
  InventoryIcon,
  StoreIcon,
} from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function ShopDashboardPage() {
  const { shop, metrics, recentOrders } = await getShopDashboardData();

  if (!shop) {
    return null;
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
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "PROCESSING":
        return "bg-indigo-50 text-indigo-800 border-indigo-200";
      case "CONFIRMED":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "DELIVERED":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "CANCELLED":
        return "bg-red-50 text-red-800 border-red-200";
      default:
        return "bg-amber-50 text-amber-800 border-amber-200";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ");
  };

  return (
    <div className="space-y-8">
      {/* 1. Header & Shop Overview Card */}
      <div className="bg-linear-to-r from-emerald-800 via-teal-800 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold backdrop-blur-xs border border-emerald-400/20">
              <StoreIcon className="w-3.5 h-3.5" />
              <span>Verified Agricultural Dealer</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{shop.name}</h1>
            <p className="text-emerald-100/90 text-sm max-w-2xl leading-relaxed">
              {shop.description || "Authorized seller of agricultural inputs, certified seeds, and fertilizers on SmartProcure."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/shop/orders"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 text-sm font-bold rounded-xl shadow-sm transition-all"
            >
              <OrdersIcon className="w-4 h-4 text-emerald-700" />
              <span>Fulfill Orders</span>
            </Link>
            <Link
              href="/shop/inventory"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700/60 hover:bg-emerald-700/80 text-white text-sm font-semibold rounded-xl border border-emerald-500/40 backdrop-blur-xs transition-all"
            >
              <InventoryIcon className="w-4 h-4 text-emerald-200" />
              <span>Check Inventory</span>
            </Link>
          </div>
        </div>

        {/* Shop Metadata Details Strip */}
        <div className="mt-6 pt-6 border-t border-emerald-700/50 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-emerald-300 block font-medium">Dealer Contact</span>
            <span className="font-semibold text-white truncate block">{shop.ownerName || "Dealer"}</span>
            <span className="text-emerald-200/80 block">{shop.phone}</span>
          </div>
          <div>
            <span className="text-emerald-300 block font-medium">Email</span>
            <span className="font-semibold text-white truncate block">{shop.email}</span>
            <span className="text-emerald-200/80 block">{shop.village ? `${shop.village}` : "District Hub"}</span>
          </div>
          <div>
            <span className="text-emerald-300 block font-medium">Store Location</span>
            <span className="font-semibold text-white truncate block">{shop.district}, {shop.state}</span>
            <span className="text-emerald-200/80 block">PIN: {shop.pincode || "500001"}</span>
          </div>
          <div>
            <span className="text-emerald-300 block font-medium">Store Status</span>
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active & Receiving Orders
            </span>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Metric 1: New Orders */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs hover:border-emerald-300 transition-colors">
          <span className="text-xs font-semibold text-gray-500 block mb-1">New Orders</span>
          <div className="text-2xl font-black text-emerald-700">{metrics.newOrders}</div>
          <span className="text-[11px] text-emerald-600 font-medium">Awaiting processing</span>
        </div>

        {/* Metric 2: Processing Orders */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs hover:border-indigo-300 transition-colors">
          <span className="text-xs font-semibold text-gray-500 block mb-1">Processing</span>
          <div className="text-2xl font-black text-indigo-700">{metrics.processingOrders}</div>
          <span className="text-[11px] text-indigo-600 font-medium">Being packaged</span>
        </div>

        {/* Metric 3: Ready for Delivery */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs hover:border-blue-300 transition-colors">
          <span className="text-xs font-semibold text-gray-500 block mb-1">Ready for Pickup</span>
          <div className="text-2xl font-black text-blue-700">{metrics.readyOrders}</div>
          <span className="text-[11px] text-blue-600 font-medium">Packaged & ready</span>
        </div>

        {/* Metric 4: Total Catalog */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs hover:border-gray-300 transition-colors">
          <span className="text-xs font-semibold text-gray-500 block mb-1">Total Products</span>
          <div className="text-2xl font-black text-gray-900">{metrics.totalProducts}</div>
          <span className="text-[11px] text-gray-500 font-medium">{metrics.activeProducts} active listed</span>
        </div>

        {/* Metric 5: Low Stock */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs hover:border-amber-300 transition-colors">
          <span className="text-xs font-semibold text-gray-500 block mb-1">Low Stock</span>
          <div className={`text-2xl font-black ${metrics.lowStockProducts > 0 ? "text-amber-600" : "text-gray-900"}`}>
            {metrics.lowStockProducts}
          </div>
          <span className="text-[11px] text-amber-700 font-medium">≤ 10 units remaining</span>
        </div>

        {/* Metric 6: Out of Stock */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs hover:border-red-300 transition-colors">
          <span className="text-xs font-semibold text-gray-500 block mb-1">Out of Stock</span>
          <div className={`text-2xl font-black ${metrics.outOfStockProducts > 0 ? "text-red-600" : "text-gray-900"}`}>
            {metrics.outOfStockProducts}
          </div>
          <span className="text-[11px] text-red-600 font-medium">Restock needed</span>
        </div>
      </div>

      {/* 3. Recent Orders & Quick Actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Recent Customer Orders</h2>
            <p className="text-xs text-gray-500">Orders containing products from your store</p>
          </div>
          <Link
            href="/shop/orders"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            View All Orders →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200/80 p-10 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <OrdersIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-800">No Orders Yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              When farmers place orders containing products from {shop.name}, they will appear here for fulfillment.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-2xs">
            <div className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-gray-900">
                        {order.orderNumber}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadge(
                          order.shopFulfillmentStatus
                        )}`}
                      >
                        {formatStatus(order.shopFulfillmentStatus)}
                      </span>
                    </div>

                    <div className="text-xs text-gray-600 flex flex-wrap items-center gap-3">
                      <span className="font-medium text-gray-800">
                        Customer: {order.customerName}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span>{order.customerLocation}</span>
                      <span className="text-gray-300">•</span>
                      <span>
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500">
                      <span>Your Items: </span>
                      <span className="font-semibold text-gray-700">
                        {order.items.map((i) => `${i.productName} (x${i.quantity})`).join(", ")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-gray-400 block font-medium">Your Payout</span>
                      <span className="font-bold text-sm text-gray-900">
                        {formatPrice(order.shopTotal)}
                      </span>
                    </div>

                    <Link
                      href={`/shop/orders/${order.id}`}
                      className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200/80 transition-colors"
                    >
                      Fulfill Order →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Quick Catalog Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/shop/products"
          className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-sm hover:border-emerald-300 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <MarketIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-sm text-gray-900 group-hover:text-emerald-700 transition-colors">
                Product Catalog
              </div>
              <div className="text-xs text-gray-500">
                View all seeds, fertilizers, and supplies listed under your store
              </div>
            </div>
          </div>
          <span className="text-gray-400 group-hover:text-emerald-700 text-lg font-bold">→</span>
        </Link>

        <Link
          href="/shop/inventory"
          className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-sm hover:border-emerald-300 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <InventoryIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-sm text-gray-900 group-hover:text-blue-700 transition-colors">
                Inventory Stock
              </div>
              <div className="text-xs text-gray-500">
                Monitor available inventory levels and track low-stock items
              </div>
            </div>
          </div>
          <span className="text-gray-400 group-hover:text-blue-700 text-lg font-bold">→</span>
        </Link>
      </div>
    </div>
  );
}
