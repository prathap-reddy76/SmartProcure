"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  DashboardIcon,
  OrdersIcon,
  MarketIcon,
  InventoryIcon,
  StoreIcon,
  LogoutIcon,
  MenuIcon,
  CloseIcon,
  BellIcon,
} from "@/components/ui/icons";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface ShopNavProps {
  shopName: string;
  ownerName: string;
  ownerEmail: string;
}

function NavContent({
  shopName,
  ownerName,
  ownerEmail,
  pathname,
  onClose,
  onSignOut,
}: {
  shopName: string;
  ownerName: string;
  ownerEmail: string;
  pathname: string;
  onClose?: () => void;
  onSignOut: () => void;
}) {
  const mainNavItems = [
    { label: "Dashboard", href: "/shop/dashboard", icon: DashboardIcon },
    { label: "Notifications", href: "/notifications", icon: BellIcon },
    { label: "Analytics", href: "/shop/analytics", icon: DashboardIcon },
    { label: "Orders", href: "/shop/orders", icon: OrdersIcon },
    { label: "Products", href: "/shop/products", icon: MarketIcon },
    { label: "Add Product", href: "/shop/products/new", icon: MarketIcon },
    { label: "Inventory", href: "/shop/inventory", icon: InventoryIcon },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Brand Header */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <Link
          href="/shop/dashboard"
          className="flex items-center gap-3 group"
          onClick={onClose}
        >
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
            <StoreIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-lg text-gray-900 tracking-tight leading-none group-hover:text-emerald-700 transition-colors">
              SmartProcure
            </div>
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Seller Portal
            </span>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close navigation"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Shop Information Card */}
      <div className="mx-4 mt-4 p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
            {shopName.charAt(0) || "S"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-xs text-gray-900 truncate" title={shopName}>
              {shopName}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium truncate">
              {ownerName || "Authorized Dealer"}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
        <div>
          <div className="text-[11px] font-bold uppercase text-gray-600 tracking-wider px-3 mb-2">
            Store Management
          </div>
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/shop/dashboard"
                  ? pathname === "/shop/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-emerald-50 text-emerald-800 font-semibold shadow-2xs border border-emerald-200/60"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive ? "text-emerald-700" : "text-gray-600"
                    }`}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Footer & Sign Out */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/60">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
            {ownerName ? ownerName.charAt(0).toUpperCase() : "S"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-800 truncate">
              {ownerName}
            </div>
            <div className="text-[11px] text-gray-600 truncate" title={ownerEmail}>
              {ownerEmail}
            </div>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-600 bg-red-50/80 hover:bg-red-100/80 border border-red-200/50 rounded-lg transition-colors cursor-pointer"
        >
          <LogoutIcon className="w-4 h-4 text-red-500" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

export function ShopNav({ shopName, ownerName, ownerEmail }: ShopNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      {/* Mobile Top App Bar */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Open navigation menu"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
          <Link href="/shop/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <StoreIcon className="w-4 h-4" />
            </div>
            <span className="font-bold text-base text-gray-900 tracking-tight">
              SmartProcure Seller
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell accentColor="emerald" />
          <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md max-w-[140px] truncate">
            {shopName}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs transition-opacity duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Menu */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[80vw] transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <NavContent
          shopName={shopName}
          ownerName={ownerName}
          ownerEmail={ownerEmail}
          pathname={pathname}
          onClose={() => setMobileMenuOpen(false)}
          onSignOut={handleSignOut}
        />
      </div>

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 shadow-xs">
        <NavContent
          shopName={shopName}
          ownerName={ownerName}
          ownerEmail={ownerEmail}
          pathname={pathname}
          onSignOut={handleSignOut}
        />
      </aside>
    </>
  );
}
