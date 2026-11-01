import React from 'react';
import { getMachineryOwnerAnalyticsAction } from "@/app/actions/analytics";
import DateFilter from "@/components/analytics/DateFilter";
import AnalyticsKpiCard from "@/components/analytics/AnalyticsKpiCard";
import { AnalyticsPeriod } from "@/lib/analytics";
import { StatusPieChart, SimpleBarChart } from "@/components/analytics/AnalyticsCharts";

export default async function MachineryAnalyticsPage({
  searchParams
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>
}) {
  const params = await searchParams;
  const period = (params.period as AnalyticsPeriod) || "30d";
  const customFrom = params.from;
  const customTo = params.to;

  const stats = await getMachineryOwnerAnalyticsAction(period, customFrom, customTo);

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;
  const formatNumber = (val: number) => val.toLocaleString('en-IN');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rental Analytics</h1>
          <p className="text-gray-500 text-sm">Track your machinery rental performance</p>
        </div>
      </div>

      <DateFilter />

      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnalyticsKpiCard 
            title="Total Booking Value" 
            value={formatCurrency(stats.overview.totalRevenue)} 
          />
          <AnalyticsKpiCard 
            title="Total Bookings" 
            value={formatNumber(stats.overview.totalBookings)} 
          />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-2">Booking Status</h3>
          <StatusPieChart data={stats.statusBreakdown} />
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-2">Revenue by Category</h3>
          <SimpleBarChart data={stats.categoryBreakdown} xKey="name" yKey="volume" fill="#f97316" />
        </div>
      </section>
      
      {stats.categoryBreakdown.length > 0 && (
        <section className="mt-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Category Breakdown Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Category</th>
                  <th className="px-4 py-3 text-right">Bookings</th>
                  <th className="px-4 py-3 text-right rounded-tr-lg">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.categoryBreakdown.map((c, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(c.count)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-orange-600">{formatCurrency(c.volume)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
