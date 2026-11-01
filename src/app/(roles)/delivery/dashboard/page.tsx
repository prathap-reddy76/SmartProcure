import React from "react";
import { getDeliveryDashboardData } from "@/actions/delivery/delivery-actions";
import { DeliveryDashboardClient } from "./delivery-dashboard-client";

export const dynamic = "force-dynamic";

export default async function DeliveryDashboardPage() {
  const { profile, metrics, recentDeliveries } = await getDeliveryDashboardData();

  if (!profile) {
    return null;
  }

  return (
    <DeliveryDashboardClient
      profile={profile}
      metrics={metrics}
      recentDeliveries={recentDeliveries}
    />
  );
}
