"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  DashboardIcon,
  OrdersIcon,
  LogoutIcon,
  MenuIcon,
  CloseIcon,
  ProcurementIcon,
  BellIcon,
} from "@/components/ui/icons";
import { NotificationBell } from "@/components/notifications/notification-bell";

export function OfficerNav({
  officerName,
  officerEmail,
}: {
  officerName: string;
  officerEmail: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const handleSignOut = () => signOut({ callbackUrl: "/login" });

  return (
    <>
      <nav className="hidden lg:flex flex-col w-64 bg-green-900 border-r border-green-800 text-white shadow-xl h-screen sticky top-0">
        <NavContent 
          officerName={officerName} 
          officerEmail={officerEmail} 
          pathname={pathname}
          onSignOut={handleSignOut}
        />
      </nav>

      {/* Mobile Nav */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-green-900 text-white sticky top-0 z-40">
        <span className="font-bold tracking-tight">SmartProcure</span>
        <div className="flex items-center gap-2">
          <NotificationBell accentColor="emerald" />
          <button onClick={() => setIsOpen(true)} className="p-2 bg-green-800 rounded-lg">
            <MenuIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative flex flex-col w-4/5 max-w-sm bg-green-900 text-white h-full shadow-2xl">
            <NavContent 
              officerName={officerName} 
              officerEmail={officerEmail} 
              pathname={pathname}
              onClose={() => setIsOpen(false)}
              onSignOut={handleSignOut}
            />
          </div>
        </div>
      )}
    </>
  );
}

function NavContent({
  officerName,
  officerEmail,
  pathname,
  onClose,
  onSignOut,
}: {
  officerName: string;
  officerEmail: string;
  pathname: string;
  onClose?: () => void;
  onSignOut: () => void;
}) {
  const mainNavItems = [
    { label: "Dashboard", href: "/procurement-officer/dashboard", icon: DashboardIcon },
    { label: "Procurement Queue", href: "/procurement-officer/queue", icon: OrdersIcon },
    { label: "Scan Token", href: "/procurement-officer/scan", icon: ProcurementIcon },
    { label: "Inspections", href: "/procurement-officer/inspections", icon: OrdersIcon },
    { label: "Payments", href: "/procurement-officer/payments", icon: OrdersIcon },
    { label: "Notifications", href: "/notifications", icon: BellIcon },
  ];

  return (
    <>
      <div className="p-6 pb-2">
        <div className="flex items-center justify-between mb-6">
          <Link href="/procurement-officer/dashboard" className="text-xl font-bold tracking-tight flex items-center gap-2" onClick={onClose}>
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <ProcurementIcon className="w-5 h-5 text-green-300" />
            </div>
            SmartProcure
          </Link>
          {onClose && (
            <button onClick={onClose} className="p-1.5 text-green-300 hover:text-white hover:bg-green-800 rounded-lg">
              <CloseIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 p-3 bg-green-800/50 rounded-xl mb-6">
          <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center font-bold text-green-100 border border-green-600 shadow-inner">
            {officerName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate text-white">{officerName}</p>
            <p className="text-[10px] text-green-300 truncate">Officer Account</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-2 px-2">Main Menu</div>
        {mainNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive 
                  ? "bg-green-500/20 text-white font-bold shadow-sm" 
                  : "text-green-100 hover:bg-green-800/50 hover:text-white"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-green-300" : "text-green-400/70"}`} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-green-800/50 mt-auto">
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-bold text-red-200 hover:text-red-100 hover:bg-red-500/10 rounded-xl transition-colors"
        >
          <LogoutIcon className="w-5 h-5 opacity-70" />
          Sign Out
        </button>
      </div>
    </>
  );
}
