import React from 'react';
import { getFarmerAnalyticsAction } from "@/app/actions/analytics";
import DateFilter from "@/components/analytics/DateFilter";
import AnalyticsKpiCard from "@/components/analytics/AnalyticsKpiCard";
import { AnalyticsPeriod } from "@/lib/analytics";


export default async function FarmerAnalyticsPage({
  searchParams
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>
}) {
  const params = await searchParams;
  const period = (params.period as AnalyticsPeriod) || "30d";
  const customFrom = params.from;
  const customTo = params.to;

  const stats = await getFarmerAnalyticsAction(period, customFrom, customTo);

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;
  const formatNumber = (val: number) => val.toLocaleString('en-IN');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-green-900">My Activity</h1>
          <p className="text-gray-500 text-sm">Overview of your operations on SmartProcure</p>
        </div>
      </div>

      <DateFilter />

      {/* My Procurement */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4">My Procurement (Sales)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AnalyticsKpiCard 
            title="Total Paid" 
            value={formatCurrency(stats.procurement.earned)} 
            subtitle={`${stats.procurement.salesCount} bookings`}
          />
          <AnalyticsKpiCard 
            title="Total Quantity Sold" 
            value={`${formatNumber(stats.procurement.volumeKg)} KG`} 
          />
        </div>

        {/* Demo Data Warning for Market Comparison */}
        {stats.priceComparisons.length > 0 && (
          <div className="mt-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Procurement vs Market Price</h3>
              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded border border-amber-200">
                SOURCE: DEMO DATA
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 uppercase">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Date</th>
                    <th className="px-4 py-3">Crop</th>
                    <th className="px-4 py-3 text-right">Procurement Price (Quintal)</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Market Price (Quintal)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.priceComparisons.map((c, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{new Date(c.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{c.cropName}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-700">{formatCurrency(c.procurementPricePerQuintal)}</td>
                      <td className="px-4 py-3 text-right text-gray-500 line-through">{formatCurrency(c.marketPricePerQuintal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* My Orders */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4 mt-8">My Marketplace Purchases</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnalyticsKpiCard 
            title="Total Spent" 
            value={formatCurrency(stats.marketplace.spent)} 
          />
          <AnalyticsKpiCard 
            title="Orders Placed" 
            value={formatNumber(stats.marketplace.ordersCount)} 
          />
        </div>
      </section>

      {/* My Machinery */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4 mt-8">My Machinery Rentals</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnalyticsKpiCard 
            title="Rental Value" 
            value={formatCurrency(stats.machinery.spent)} 
          />
          <AnalyticsKpiCard 
            title="Machines Booked" 
            value={formatNumber(stats.machinery.rentalsCount)} 
          />
        </div>
      </section>
    </div>
  );
}
