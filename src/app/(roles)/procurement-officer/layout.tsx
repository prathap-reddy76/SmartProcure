import React from "react";
import { redirect } from "next/navigation";
import { OfficerRefreshListener } from "@/components/procurement/officer-refresh-listener";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { SessionUser } from "@/types/auth";
import { OfficerNav } from "@/components/layout/officer-nav";
import { NotificationBell } from "@/components/notifications/notification-bell";

export default async function OfficerLayout({ children }: { children: React.ReactNode }) {
  // Strictly enforce PROCUREMENT_OFFICER role; redirect unauthenticated users to /login
  const session = await requireRole("PROCUREMENT_OFFICER", "/login");
  const user = session.user as SessionUser;

  // Verify officer account status and assigned centre
  const officer = await prisma.user.findUnique({ 
    where: { id: user.id }, 
    select: { procurementCentreId: true, isActive: true } 
  });

  if (!officer || !officer.isActive) {
    redirect("/login?error=AccountDeactivated");
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <OfficerNav 
        officerName={user.name || "Procurement Officer"} 
        officerEmail={user.email || ""} 
      />
      <main className="flex-1 overflow-y-auto flex flex-col">
        <header className="hidden lg:flex items-center justify-end px-8 py-3 bg-white border-b border-gray-200 sticky top-0 z-20">
          <NotificationBell accentColor="emerald" />
        </header>
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24">
          {officer?.procurementCentreId && <OfficerRefreshListener centreId={officer.procurementCentreId} />}
          {children}
        </div>
      </main>
    </div>
  );
}
