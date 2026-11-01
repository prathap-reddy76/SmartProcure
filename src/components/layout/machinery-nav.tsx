"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  DashboardIcon,
  OrdersIcon,
  InventoryIcon,
  LogoutIcon,
  MenuIcon,
  CloseIcon,
  BellIcon,
} from "@/components/ui/icons";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface MachineryNavProps {
  ownerName: string;
  ownerEmail: string;
}

function NavContent({
  ownerName,
  ownerEmail,
  pathname,
  onClose,
  onSignOut,
}: {
  ownerName: string;
  ownerEmail: string;
  pathname: string;
  onClose?: () => void;
  onSignOut: () => void;
}) {
  const mainNavItems = [
    { label: "Dashboard", href: "/machinery/dashboard", icon: DashboardIcon },
    { label: "Analytics", href: "/machinery/analytics", icon: DashboardIcon },
    { label: "Rental Requests", href: "/machinery/bookings", icon: OrdersIcon },
    { label: "My Machinery", href: "/machinery/my-machinery", icon: InventoryIcon },
    { label: "Notifications", href: "/notifications", icon: BellIcon },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Brand Header */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <Link
          href="/machinery/dashboard"
          className="flex items-center gap-3 group"
          onClick={onClose}
        >
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-600 to-orange-700 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
            <span className="text-xl">🚜</span>
          </div>
          <div>
            <span className="text-lg font-bold bg-linear-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
              SmartProcure
            </span>
            <span className="block text-[10px] font-semibold tracking-wider text-amber-700 uppercase">
              Machinery Partner
            </span>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 md:hidden"
            aria-label="Close menu"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
          Management
        </div>
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                }`}
              />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3 p-2 rounded-xl mb-2">
          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm shrink-0">
            {ownerName?.charAt(0)?.toUpperCase() || "M"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{ownerName}</p>
            <p className="text-[11px] text-gray-500 truncate">{ownerEmail}</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
        >
          <LogoutIcon className="w-4 h-4 text-gray-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

export function MachineryNav({
  ownerName,
  ownerEmail,
}: MachineryNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(true)}
            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Open navigation menu"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-gray-900">Machinery Portal</span>
        </div>
        <NotificationBell accentColor="emerald" />
      </div>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-72 max-w-[85vw] h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <NavContent
              ownerName={ownerName}
              ownerEmail={ownerEmail}
              pathname={pathname}
              onClose={() => setIsOpen(false)}
              onSignOut={() => signOut({ callbackUrl: "/login" })}
            />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed inset-y-0 left-0 z-30">
        <NavContent
          ownerName={ownerName}
          ownerEmail={ownerEmail}
          pathname={pathname}
          onSignOut={() => signOut({ callbackUrl: "/login" })}
        />
      </aside>
    </>
  );
}
