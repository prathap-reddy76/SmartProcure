import React from "react";
import { requireRole } from "@/lib/auth-utils";
import { FarmerNav } from "@/components/layout/farmer-nav";
import { FarmerHeader } from "@/components/layout/farmer-header";
import { SessionUser } from "@/types/auth";
import { getCartCount } from "@/actions/cart/cart-actions";

import { NotificationBell } from "@/components/notifications/notification-bell";

export default async function FarmerRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("FARMER");
  const user = session.user as SessionUser;

  // Retrieve real-time cart item count for badge
  const cartCount = await getCartCount();

  return (
    <div className="min-h-screen bg-gray-50/60 flex flex-col md:flex-row">
      <FarmerNav
        farmerName={user?.name || "Farmer"}
        farmerEmail={user?.email || ""}
        cartCount={cartCount}
      />
      <main className="flex-1 md:pl-64 flex flex-col min-w-0">
        <header className="hidden md:flex items-center justify-between px-8 py-3 bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="text-xs font-semibold text-green-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>SmartProcure Farmer Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <FarmerHeader
              farmerName={user?.name || "Farmer"}
              farmerEmail={user?.email || ""}
            />
          </div>
        </header>
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
