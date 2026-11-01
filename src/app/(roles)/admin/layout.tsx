import { AdminRefreshListener } from "@/components/admin-refresh-listener";
import React from "react";
import { requireRole } from "@/lib/auth-utils";
import Link from "next/link";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { AdminSignOutButton } from "@/components/layout/admin-signout-button";
import {
  LayoutDashboard,
  Store,
  ShoppingCart,
  Wallet,
  Calculator,
  TrendingUp,
  Truck,
  Tractor,
  Bell,
  Settings,
  Users,
  LineChart,
  MapPin,
  ClipboardList
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ADMIN");

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-screen sticky top-0 shadow-sm z-40 hidden md:flex">
        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-700 text-white font-black flex items-center justify-center text-lg shadow-sm">
            SP
          </div>
          <div>
            <span className="font-extrabold text-gray-900 text-lg block leading-none tracking-tight">SmartProcure</span>
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1 block">Admin Center</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
          
          {/* OVERVIEW */}
          <div>
            <h3 className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Overview</h3>
            <nav className="space-y-1">
              <Link href="/admin/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            </nav>
          </div>

          {/* MARKETPLACE */}
          <div>
            <h3 className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Marketplace</h3>
            <nav className="space-y-1">
              <Link href="/admin/shops" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                <Store className="w-4 h-4" />
                Shops
              </Link>
              <Link href="/admin/orders" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                <ShoppingCart className="w-4 h-4" />
                Orders
              </Link>
              <Link href="/admin/products" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                <ClipboardList className="w-4 h-4" />
                Products & Inventory
              </Link>
            </nav>
          </div>

          {/* PROCUREMENT */}
          <div>
            <h3 className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Procurement</h3>
            <nav className="space-y-1">
              <Link href="/admin/procurement-centres" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                <MapPin className="w-4 h-4" />
                Centres
              </Link>
              <Link href="/admin/procurement-prices" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                <Wallet className="w-4 h-4" />
                Prices
              </Link>
              <Link href="/admin/payments" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                <Calculator className="w-4 h-4" />
                Payments
              </Link>
            </nav>
          </div>

          {/* MACHINERY */}
          <div>
            <h3 className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Machinery</h3>
            <nav className="space-y-1">
              <Link href="/admin/machinery" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                <Tractor className="w-4 h-4" />
                Rentals & Sales
              </Link>
            </nav>
          </div>

          {/* MARKET INTELLIGENCE */}
          <div>
            <h3 className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Market Intelligence</h3>
            <nav className="space-y-1">
              <Link href="/admin/market-prices" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                <TrendingUp className="w-4 h-4" />
                Market Prices
              </Link>
              <Link href="/admin/analytics" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                <LineChart className="w-4 h-4" />
                Analytics
              </Link>
            </nav>
          </div>
          
          {/* LOGISTICS */}
          <div>
            <h3 className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Logistics</h3>
            <nav className="space-y-1">
              <Link href="/admin/logistics" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                <Truck className="w-4 h-4" />
                Logistics &amp; Dispatch
              </Link>
            </nav>
          </div>

          {/* SYSTEM */}
          <div>
            <h3 className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">System</h3>
            <nav className="space-y-1">
              <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                <Users className="w-4 h-4" />
                Users &amp; Roles
              </Link>
              <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                <Settings className="w-4 h-4" />
                Platform Settings
              </Link>
              <Link href="/notifications" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                <Bell className="w-4 h-4" />
                Notifications
              </Link>
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <NotificationBell accentColor="indigo" />
          <AdminSignOutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-10 w-full mx-auto max-w-7xl">
          <AdminRefreshListener />
          {children}
        </div>
      </main>
    </div>
  );
}
