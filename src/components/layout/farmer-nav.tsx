"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  DashboardIcon,
  MarketIcon,
  CartIcon,
  OrdersIcon,
  ProfileIcon,
  FarmIcon,
  CropIcon,
  ProcurementIcon,
  WeatherIcon,
  ReceiptsIcon,
  BellIcon,
  SupportIcon,
  LogoutIcon,
  MenuIcon,
  CloseIcon,
  StoreIcon,
} from "@/components/ui/icons";

import { NotificationBell } from "@/components/notifications/notification-bell";

interface FarmerNavProps {
  farmerName?: string;
  farmerEmail?: string;
  cartCount?: number;
}

const comingSoonItems = [
  { label: "Receipts", icon: ReceiptsIcon },
  { label: "Help & Support", icon: SupportIcon },
];

function NavContent({
  farmerName,
  farmerEmail,
  cartCount = 0,
  pathname,
  onClose,
  onSignOut,
}: {
  farmerName: string;
  farmerEmail: string;
  cartCount?: number;
  pathname: string;
  onClose?: () => void;
  onSignOut: () => void;
}) {
  const mainNavItems = [
    { label: "Dashboard", href: "/farmer/dashboard", icon: DashboardIcon },
    { label: "AI Assistant", href: "/farmer/assistant", icon: SupportIcon },
    { label: "Notifications", href: "/notifications", icon: BellIcon },
    { label: "Marketplace", href: "/farmer/marketplace", icon: MarketIcon },
    { label: "Agro Shops", href: "/farmer/marketplace/shops", icon: StoreIcon },
    { label: "Machinery Rental", href: "/farmer/machinery", icon: FarmIcon },
    { label: "Market Prices", href: "/farmer/market-prices", icon: MarketIcon },
    { label: "My Analytics", href: "/farmer/analytics", icon: DashboardIcon },
    {
      label: "My Cart",
      href: "/farmer/cart",
      icon: CartIcon,
      badge: cartCount > 0 ? cartCount : undefined,
    },
    { label: "My Orders", href: "/farmer/orders", icon: OrdersIcon },
    { label: "Procurement", href: "/farmer/procurement", icon: ProcurementIcon },
    { label: "Weather", href: "/farmer/weather", icon: WeatherIcon },
    { label: "My Profile", href: "/farmer/profile", icon: ProfileIcon },
    { label: "My Farm", href: "/farmer/farm", icon: FarmIcon },
    { label: "My Crops", href: "/farmer/crops", icon: CropIcon },
  ];

  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Brand */}
        <div className="p-6 border-b border-green-100 flex items-center justify-between">
          <Link
            href="/farmer/dashboard"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <div className="w-9 h-9 bg-green-700 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-xs">
              SP
            </div>
            <div>
              <span className="text-xl font-bold text-green-900 tracking-tight block leading-tight">
                SmartProcure
              </span>
              <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">
                Farmer Portal
              </span>
            </div>
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 rounded-lg"
              aria-label="Close menu"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* User Card */}
        <div className="px-6 py-4 bg-green-50/70 border-b border-green-100/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-200 text-green-800 flex items-center justify-center font-bold text-base">
            {farmerName.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-gray-900 truncate">{farmerName}</p>
            <p className="text-xs text-gray-500 truncate">{farmerEmail || "Verified Farmer"}</p>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="p-4 space-y-1" aria-label="Main Navigation">
          <div className="px-3 pb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Menu
          </div>
          {mainNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/farmer/marketplace"
                ? pathname === "/farmer/marketplace" || (pathname.startsWith("/farmer/marketplace/") && !pathname.startsWith("/farmer/marketplace/shops"))
                : item.href !== "/farmer/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-green-700 text-white shadow-xs font-semibold"
                    : "text-gray-700 hover:bg-green-50 hover:text-green-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-green-700"}`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? "bg-white text-green-800"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Coming Soon Features */}
          <div className="pt-4 px-3 pb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Upcoming Features
          </div>
          {comingSoonItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm text-gray-400 cursor-not-allowed select-none"
                title={`${item.label} is coming in the next phase`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-gray-300 flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">
                  Soon
                </span>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 w-full px-3.5 py-3 text-sm font-medium text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogoutIcon className="w-5 h-5 text-red-600" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

export function FarmerNav({
  farmerName = "Farmer",
  farmerEmail = "",
  cartCount = 0,
}: FarmerNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-2xs">
        <Link href="/farmer/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-700 rounded-md flex items-center justify-center text-white font-bold text-base">
            SP
          </div>
          <span className="font-bold text-green-900 text-lg">SmartProcure</span>
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell />
          {/* Quick Mobile Cart Link */}
          <Link
            href="/farmer/cart"
            className="relative p-2 text-gray-700 hover:text-green-800 hover:bg-green-50 rounded-lg"
            aria-label="View shopping cart"
          >
            <CartIcon className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 bg-emerald-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -mr-2 text-gray-700 hover:text-green-800 hover:bg-green-50 rounded-lg"
            aria-label="Toggle navigation menu"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-over Drawer */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <NavContent
          farmerName={farmerName}
          farmerEmail={farmerEmail}
          cartCount={cartCount}
          pathname={pathname}
          onClose={() => setMobileMenuOpen(false)}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* Desktop Static Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200 z-30 shadow-2xs">
        <NavContent
          farmerName={farmerName}
          farmerEmail={farmerEmail}
          cartCount={cartCount}
          pathname={pathname}
          onSignOut={handleSignOut}
        />
      </aside>
    </>
  );
}
