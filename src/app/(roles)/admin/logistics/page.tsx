import React from "react";
import { requireRole } from "@/lib/auth-utils";
import { getAdminLogisticsData } from "@/actions/delivery/delivery-actions";
import { AdminLogisticsClient } from "./admin-logistics-client";

export const dynamic = "force-dynamic";

export default async function AdminLogisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole("ADMIN");
  const qParams = await searchParams;

  const typeParam = typeof qParams.type === "string" ? qParams.type : undefined;
  const statusParam = typeof qParams.status === "string" ? qParams.status : undefined;
  const partnerParam = typeof qParams.partnerId === "string" ? qParams.partnerId : undefined;
  const searchParam = typeof qParams.search === "string" ? qParams.search : undefined;

  const { metrics, deliveries, partners } = await getAdminLogisticsData({
    type: typeParam,
    status: statusParam,
    partnerId: partnerParam,
    search: searchParam,
  });

  return (
    <div className="space-y-6">
      <AdminLogisticsClient
        initialMetrics={metrics}
        initialDeliveries={deliveries}
        partners={partners}
        activeFilters={{
          type: typeParam || "ALL",
          status: statusParam || "ALL",
          partnerId: partnerParam || "ALL",
          search: searchParam || "",
        }}
      />
    </div>
  );
}
