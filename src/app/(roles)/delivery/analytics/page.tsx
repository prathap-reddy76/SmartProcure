import React from 'react';
import { getDeliveryAnalyticsAction } from "@/app/actions/analytics";
import { getDeliveryPartnerProfile } from "@/actions/delivery/delivery-actions";
import DateFilter from "@/components/analytics/DateFilter";
import AnalyticsKpiCard from "@/components/analytics/AnalyticsKpiCard";
import { AnalyticsPeriod } from "@/lib/analytics";
import { StatusPieChart } from "@/components/analytics/AnalyticsCharts";
import { requireRole } from "@/lib/auth-utils";

export default async function DeliveryAnalyticsPage({
  searchParams
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>
}) {
  const session = await requireRole("DELIVERY_PARTNER");
  const params = await searchParams;
  const period = (params.period as AnalyticsPeriod) || "30d";
  const customFrom = params.from;
  const customTo = params.to;

  const partnerProfile = await getDeliveryPartnerProfile();
  
  if (!partnerProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-md w-full text-center space-y-4">
          <h2 className="text-xl font-bold text-gray-900">No Profile Found</h2>
          <p className="text-sm text-gray-600">Please complete your delivery partner profile first.</p>
        </div>
      </div>
    );
  }

  const stats = await getDeliveryAnalyticsAction(period, customFrom, customTo, partnerProfile.id);
  const formatNumber = (val: number) => val.toLocaleString('en-IN');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Analytics</h1>
          <p className="text-gray-500 text-sm">Track your delivery performance</p>
        </div>
      </div>

      <DateFilter />

      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnalyticsKpiCard 
            title="Total Assignments" 
            value={formatNumber(stats.overview.totalAssignments)} 
          />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-2">Delivery Status</h3>
          <StatusPieChart data={stats.statusBreakdown} />
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-2">Delivery Types</h3>
          <StatusPieChart data={stats.typeBreakdown} nameKey="type" />
        </div>
      </section>
    </div>
  );
}
