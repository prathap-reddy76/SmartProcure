import React from "react";
import { getFarmerDashboardData } from "@/actions/farmer/dashboard-actions";
import { requireRole } from "@/lib/auth-utils";
import { FarmerDashboardShell } from "@/components/dashboard/farmer-dashboard-shell";

export const dynamic = "force-dynamic";

export default async function FarmerDashboardPage() {
  const session = await requireRole("FARMER");
  const data = await getFarmerDashboardData();

  return (
    <FarmerDashboardShell
      farmerName={session.user?.name || "Farmer"}
      profileSummary={data.profileSummary}
      crops={data.crops}
      suggestions={data.suggestions}
      marketPrices={data.marketPrices}
      activeOrders={data.activeOrders}
      activeOrdersCount={data.activeOrdersCount}
      activeProcurement={data.activeProcurement}
      activeProcurementCount={data.activeProcurementCount}
      activeDeliveries={data.activeDeliveries}
      unreadNotificationsCount={data.unreadNotificationsCount}
      recommendedProducts={data.recommendedProducts}
    />
  );
}
