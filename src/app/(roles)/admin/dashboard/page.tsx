import React from "react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import Link from "next/link";
import { 
  Users, Store, ShoppingCart, Tractor, 
  TrendingUp, AlertCircle, PlusCircle, Settings, Box 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default async function AdminDashboard() {
  await requireRole("ADMIN");

  // Fetch real statistics
  const [
    totalFarmers,
    totalShopOwners,
    totalShops,
    totalProducts,
    activeOrders,
    pendingOrders,
    machineryListings,
    pendingShops,
    lowStockProducts,
    recentShops,
    recentOrders
  ] = await prisma.$transaction([
    prisma.user.count({ where: { role: "FARMER" } }),
    prisma.user.count({ where: { role: "SHOP_OWNER" } }),
    prisma.shop.count(),
    prisma.product.count(),
    prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PROCESSING", "READY_FOR_DELIVERY", "OUT_FOR_DELIVERY"] } } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.machinery.count(),
    prisma.shop.count({ where: { isActive: false } }),
    prisma.product.count({ where: { stock: { lt: 10 } } }),
    prisma.shop.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { user: true } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { user: true } })
  ]);

  const stats = [
    { name: "Total Farmers", value: totalFarmers, icon: Users, color: "bg-green-50 text-green-700" },
    { name: "Shop Owners", value: totalShopOwners, icon: Store, color: "bg-blue-50 text-blue-700" },
    { name: "Total Shops", value: totalShops, icon: Store, color: "bg-indigo-50 text-indigo-700" },
    { name: "Total Products", value: totalProducts, icon: Box, color: "bg-purple-50 text-purple-700" },
    { name: "Active Orders", value: activeOrders, icon: ShoppingCart, color: "bg-amber-50 text-amber-700" },
    { name: "Pending Orders", value: pendingOrders, icon: AlertCircle, color: "bg-red-50 text-red-700" },
    { name: "Machinery Listings", value: machineryListings, icon: Tractor, color: "bg-emerald-50 text-emerald-700" },
    { name: "Low Stock Products", value: lowStockProducts, icon: AlertCircle, color: "bg-rose-50 text-rose-700" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Platform overview and real-time statistics.</p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex items-center gap-4">
            <div className={`p-3 rounded-xl ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">{s.name}</p>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* QUICK ACTIONS */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 tracking-tight">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/shops/new" className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl font-semibold text-sm transition-colors shadow-sm">
            <PlusCircle className="w-4 h-4" /> Add Shop
          </Link>
          {/* Note: /admin/products is requested conceptually but strictly we are linking to existing /admin/shops as the entry point for products */}
          <Link href="/admin/shops" className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 p-3 rounded-xl font-semibold text-sm transition-colors shadow-sm">
            <Store className="w-4 h-4" /> Manage Shops
          </Link>
          <Link href="/admin/shops" className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 p-3 rounded-xl font-semibold text-sm transition-colors shadow-sm">
            <Box className="w-4 h-4" /> View Products
          </Link>
          <Link href="/admin/market-prices" className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 p-3 rounded-xl font-semibold text-sm transition-colors shadow-sm">
            <TrendingUp className="w-4 h-4" /> Market Intel
          </Link>
        </div>
      </div>

      {/* TWO COLUMNS: RECENT SHOPS & RECENT ORDERS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* RECENT SHOPS */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="font-bold text-gray-900">Recently Added Shops</h2>
            {pendingShops > 0 && (
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-md">
                {pendingShops} Pending
              </span>
            )}
          </div>
          <div className="divide-y divide-gray-100 flex-1">
            {recentShops.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No shops found.</div>
            ) : (
              recentShops.map(shop => (
                <div key={shop.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{shop.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{shop.shopType.replace('_', ' ')} • {shop.district || 'Unknown location'}</p>
                  </div>
                  <Link href={`/admin/shops/${shop.id}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold">
                    View
                  </Link>
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t border-gray-100 bg-gray-50/50">
            <Link href="/admin/shops" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex justify-center">
              View All Shops
            </Link>
          </div>
        </div>

        {/* RECENT ORDERS */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="font-bold text-gray-900">Recent Orders</h2>
          </div>
          <div className="divide-y divide-gray-100 flex-1">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No recent orders.</div>
            ) : (
              recentOrders.map(order => (
                <div key={order.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {order.user?.name || "Unknown User"} • ₹{order.totalAmount.toString()}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide
                    ${order.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 
                      order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
                      'bg-gray-100 text-gray-800'}`}>
                    {order.status}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t border-gray-100 bg-gray-50/50">
            {/* Orders page doesn't exist yet for admin but we can link to a placeholder or omit */}
            <span className="text-sm font-semibold text-gray-400 flex justify-center">
              Global Order View Coming Soon
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
