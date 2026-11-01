import React from 'react';
import { getShopAnalyticsAction } from "@/app/actions/analytics";
import DateFilter from "@/components/analytics/DateFilter";
import AnalyticsKpiCard from "@/components/analytics/AnalyticsKpiCard";
import { AnalyticsPeriod } from "@/lib/analytics";
import { StatusPieChart } from "@/components/analytics/AnalyticsCharts";

export default async function ShopAnalyticsPage({
  searchParams
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>
}) {
  const params = await searchParams;
  const period = (params.period as AnalyticsPeriod) || "30d";
  const customFrom = params.from;
  const customTo = params.to;

  const stats = await getShopAnalyticsAction(period, customFrom, customTo);

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;
  const formatNumber = (val: number) => val.toLocaleString('en-IN');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Analytics</h1>
          <p className="text-gray-500 text-sm">Track your sales and top products</p>
        </div>
      </div>

      <DateFilter />

      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnalyticsKpiCard 
            title="Total Sales Value" 
            value={formatCurrency(stats.overview.totalRevenue)} 
          />
          <AnalyticsKpiCard 
            title="Items Sold" 
            value={formatNumber(stats.overview.totalItemsSold)} 
          />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <div className="col-span-1 lg:col-span-1 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-2">Order Status</h3>
          <StatusPieChart data={stats.statusBreakdown} />
        </div>
        
        <div className="col-span-1 lg:col-span-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Top Performing Products</h3>
          {stats.topProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 uppercase">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Product</th>
                    <th className="px-4 py-3 text-right">Quantity Sold</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Sales Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.topProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{p.productName}</td>
                      <td className="px-4 py-3 text-right">{formatNumber(p.quantity)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600">{formatCurrency(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-10">No products sold in this period.</div>
          )}
        </div>
      </section>
    </div>
  );
}
