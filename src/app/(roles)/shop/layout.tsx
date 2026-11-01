import React from "react";
import { requireRole } from "@/lib/auth-utils";
import { ShopNav } from "@/components/layout/shop-nav";
import { SessionUser } from "@/types/auth";
import { getShopProfile } from "@/actions/shop/shop-actions";
import { NotificationBell } from "@/components/notifications/notification-bell";

export default async function ShopRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("SHOP_OWNER");
  const user = session.user as SessionUser;

  const shop = await getShopProfile();

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-gray-900">No Store Profile Linked</h2>
          <p className="text-sm text-gray-600">
            Your account ({user.email}) is registered as a Shop Owner, but no store has been assigned to your profile yet.
          </p>
          <div className="pt-2">
            <a
              href="/login"
              className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
            >
              Back to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60 flex flex-col md:flex-row">
      <ShopNav
        shopName={shop.name}
        ownerName={shop.ownerName || user.name || "Shop Owner"}
        ownerEmail={shop.email || user.email || ""}
      />
      <main className="flex-1 md:pl-64 flex flex-col min-w-0">
        <header className="hidden md:flex items-center justify-end px-8 py-3 bg-white border-b border-gray-200 sticky top-0 z-20">
          <NotificationBell accentColor="emerald" />
        </header>
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
