import React from "react";
import { requireRole } from "@/lib/auth-utils";
import { DeliveryNav } from "@/components/layout/delivery-nav";
import { SessionUser } from "@/types/auth";
import { getDeliveryPartnerProfile } from "@/actions/delivery/delivery-actions";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { DeliveryPendingApproval } from "@/components/delivery/delivery-pending-approval";
import { prisma } from "@/lib/prisma";

export default async function DeliveryRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Enforce DELIVERY_PARTNER role and redirect unauthenticated to /delivery/login
  const session = await requireRole("DELIVERY_PARTNER", "/delivery/login");
  const user = session.user as SessionUser;

  // 2. Fetch linked DeliveryPartner profile
  const profile = await getDeliveryPartnerProfile();

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-gray-900">Delivery Profile Missing</h2>
          <p className="text-sm text-gray-600">
            Your account ({user.email}) has the Delivery Partner role, but no delivery profile has been configured yet.
          </p>
          <div className="pt-2">
            <a
              href="/delivery/login"
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
            >
              Back to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 3. Server-side account status check (Strict rejection of inactive/unapproved/suspended partners)
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isActive: true },
  });

  const isUserActive = dbUser?.isActive ?? false;
  const isPartnerActive = profile.isActive;

  if (!isUserActive || !isPartnerActive) {
    return (
      <DeliveryPendingApproval
        partnerName={profile.name}
        partnerEmail={profile.email}
        isSuspended={!isUserActive}
      />
    );
  }

  // 4. Approved & Active Operational Layout
  return (
    <div className="min-h-screen bg-gray-50/60 flex flex-col md:flex-row">
      <DeliveryNav
        partnerName={profile.name}
        partnerEmail={profile.email}
        vehicleType={profile.vehicleType}
        vehicleNumber={profile.vehicleNumber}
        isAvailable={profile.isAvailable}
      />
      <main className="flex-1 md:pl-64 flex flex-col min-w-0">
        <header className="hidden md:flex items-center justify-end px-8 py-3 bg-white border-b border-gray-200 sticky top-0 z-20">
          <NotificationBell accentColor="blue" />
        </header>
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
