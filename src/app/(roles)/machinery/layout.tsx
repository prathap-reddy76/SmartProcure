import React from "react";
import { requireAnyRole } from "@/lib/auth-utils";
import { SessionUser } from "@/types/auth";
import { MachineryNav } from "@/components/layout/machinery-nav";
import { NotificationBell } from "@/components/notifications/notification-bell";

export default async function MachineryRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAnyRole(["MACHINERY_OWNER", "ADMIN"]);
  const user = session.user as SessionUser;

  return (
    <div className="min-h-screen bg-gray-50/60 flex flex-col md:flex-row">
      <MachineryNav
        ownerName={user.name || "Machinery Owner"}
        ownerEmail={user.email || ""}
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
