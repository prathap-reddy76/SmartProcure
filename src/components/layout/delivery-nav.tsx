"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  DashboardIcon,
  TruckIcon,
  PackageIcon,
  ProfileIcon,
  LogoutIcon,
  MenuIcon,
  CloseIcon,
  BellIcon,
} from "@/components/ui/icons";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface DeliveryNavProps {
  partnerName: string;
  partnerEmail: string;
  vehicleType: string | null;
  vehicleNumber: string | null;
  isAvailable: boolean;
}

function NavContent({
  partnerName,
  partnerEmail,
  vehicleType,
  vehicleNumber,
  isAvailable,
  pathname,
  onClose,
  onSignOut,
}: {
  partnerName: string;
  partnerEmail: string;
  vehicleType: string | null;
  vehicleNumber: string | null;
  isAvailable: boolean;
  pathname: string;
  onClose?: () => void;
  onSignOut: () => void;
}) {
  const mainNavItems = [
    { label: "Dashboard", href: "/delivery/dashboard", icon: DashboardIcon },
    { label: "Notifications", href: "/notifications", icon: BellIcon },
    { label: "Analytics", href: "/delivery/analytics", icon: DashboardIcon },
    { label: "Available Deliveries", href: "/delivery/available", icon: PackageIcon },
    { label: "My Deliveries", href: "/delivery/orders", icon: TruckIcon },
    { label: "Partner Profile", href: "/delivery/profile", icon: ProfileIcon },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Brand Header */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <Link
          href="/delivery/dashboard"
          className="flex items-center gap-3 group"
          onClick={onClose}
        >
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
            <TruckIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-lg text-gray-900 tracking-tight leading-none group-hover:text-blue-700 transition-colors">
              SmartProcure
            </div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Logistics Portal
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

      {/* Driver Status Card */}
      <div className="mx-4 mt-4 p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
            {partnerName.charAt(0) || "D"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-xs text-gray-900 truncate" title={partnerName}>
              {partnerName}
            </div>
            <div className="text-[11px] text-gray-500 truncate">
              {vehicleNumber || vehicleType || "Delivery Partner"}
            </div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-blue-200/50 flex items-center justify-between text-[11px]">
          <span className="text-gray-500">Duty Status:</span>
          <span
            className={`font-bold inline-flex items-center gap-1.5 ${
              isAvailable ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isAvailable ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            {isAvailable ? "Available on Duty" : "Unavailable (Off Duty)"}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
        <div>
          <div className="text-[11px] font-bold uppercase text-gray-400 tracking-wider px-3 mb-2">
            Delivery Operations
          </div>
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/delivery/dashboard"
                  ? pathname === "/delivery/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-blue-50 text-blue-800 font-semibold shadow-2xs border border-blue-200/60"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive ? "text-blue-700" : "text-gray-400"
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
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
            {partnerName ? partnerName.charAt(0).toUpperCase() : "D"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-800 truncate">
              {partnerName}
            </div>
            <div className="text-[11px] text-gray-400 truncate" title={partnerEmail}>
              {partnerEmail}
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

export function DeliveryNav({
  partnerName,
  partnerEmail,
  vehicleType,
  vehicleNumber,
  isAvailable,
}: DeliveryNavProps) {
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
          <Link href="/delivery/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <TruckIcon className="w-4 h-4" />
            </div>
            <span className="font-bold text-base text-gray-900 tracking-tight">
              SmartProcure Delivery
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell accentColor="blue" />
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md border">
            <span
              className={`w-2 h-2 rounded-full ${
                isAvailable ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            <span className={isAvailable ? "text-emerald-700" : "text-amber-700"}>
              {isAvailable ? "Available" : "Off Duty"}
            </span>
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
          partnerName={partnerName}
          partnerEmail={partnerEmail}
          vehicleType={vehicleType}
          vehicleNumber={vehicleNumber}
          isAvailable={isAvailable}
          pathname={pathname}
          onClose={() => setMobileMenuOpen(false)}
          onSignOut={handleSignOut}
        />
      </div>

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 shadow-xs">
        <NavContent
          partnerName={partnerName}
          partnerEmail={partnerEmail}
          vehicleType={vehicleType}
          vehicleNumber={vehicleNumber}
          isAvailable={isAvailable}
          pathname={pathname}
          onSignOut={handleSignOut}
        />
      </aside>
    </>
  );
}
