import React from 'react';
import { 
  getAdminAnalyticsAction, 
  getAdminMarketplaceAnalyticsAction, 
  getProcurementAnalyticsAction,
  getDeliveryAnalyticsAction,
  getAdminMachineryAnalyticsAction,
  getPhase42AnalyticsAction
} from "@/app/actions/analytics";
import DateFilter from "@/components/analytics/DateFilter";
import AnalyticsKpiCard from "@/components/analytics/AnalyticsKpiCard";
import { AnalyticsPeriod } from "@/lib/analytics";
import { StatusPieChart, SimpleBarChart, MultiBarChart, SimpleLineChart } from "@/components/analytics/AnalyticsCharts";

export default async function AdminAnalyticsPage({
  searchParams
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>
}) {
  const params = await searchParams;
  const period = (params.period as AnalyticsPeriod) || "30d";
  const customFrom = params.from;
  const customTo = params.to;

  // Fetch all required data in parallel
  const [
    platformStats,
    marketplaceStats,
    procurementStats,
    deliveryStats,
    machineryStats,
    phase42Stats
  ] = await Promise.all([
    getAdminAnalyticsAction(period, customFrom, customTo),
    getAdminMarketplaceAnalyticsAction(period, customFrom, customTo),
    getProcurementAnalyticsAction(period, customFrom, customTo),
    getDeliveryAnalyticsAction(period, customFrom, customTo),
    getAdminMachineryAnalyticsAction(period, customFrom, customTo),
    getPhase42AnalyticsAction(period, customFrom, customTo)
  ]);

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;
  const formatNumber = (val: number) => val.toLocaleString('en-IN');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-gray-500 text-sm">Comprehensive business intelligence overview</p>
        </div>
      </div>

      <DateFilter />

      {/* Platform Overview */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Platform Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnalyticsKpiCard 
            title="Total Users" 
            value={formatNumber(platformStats.users.total)} 
            subtitle="Registered accounts"
          />
          <AnalyticsKpiCard 
            title="Marketplace Orders" 
            value={formatNumber(platformStats.marketplace.totalOrders)} 
          />
          <AnalyticsKpiCard 
            title="Procurement Volume" 
            value={`${formatNumber(platformStats.procurement.totalKg)} KG`} 
          />
          <AnalyticsKpiCard 
            title="Active Deliveries" 
            value={formatNumber(deliveryStats.overview.totalAssignments)} 
          />
        </div>
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-2">User Roles</h3>
            <StatusPieChart data={platformStats.users.byRole} nameKey="role" />
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-2">Platform Revenue</h3>
            <div className="flex items-center justify-center h-48 text-gray-500 bg-gray-50 rounded-lg">
              {platformStats.platformRevenue}
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace Analytics */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4 mt-8">Marketplace</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="col-span-1 lg:col-span-1 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <AnalyticsKpiCard 
              title="Gross Order Value" 
              value={formatCurrency(marketplaceStats.overview.totalRevenue)} 
              subtitle={`${formatNumber(marketplaceStats.overview.totalItemsSold)} items sold`}
            />
          </div>
          <div className="col-span-1 lg:col-span-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-2">Order Status Breakdown</h3>
            <StatusPieChart data={marketplaceStats.statusBreakdown} />
          </div>
        </div>
        
                  {phase42Stats.orderTrend.length > 0 && (
            <div className="mt-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-2">Order Trend (Value)</h3>
              <SimpleLineChart data={phase42Stats.orderTrend} xKey="date" yKey="value" stroke="#3b82f6" />
            </div>
          )}

          {marketplaceStats.topProducts.length > 0 && (
          <div className="mt-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Top Products by Revenue</h3>
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
                  {marketplaceStats.topProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{p.productName}</td>
                      <td className="px-4 py-3 text-right">{formatNumber(p.quantity)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600">{formatCurrency(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

            {/* Inventory Analytics */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4 mt-8">Inventory & Catalog</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
          <AnalyticsKpiCard 
            title="Total Shops" 
            value={formatNumber(phase42Stats.inventoryStats.totalShops)} 
          />
          <AnalyticsKpiCard 
            title="Total Products" 
            value={formatNumber(phase42Stats.inventoryStats.totalProducts)} 
          />
          <AnalyticsKpiCard 
            title="Active Products" 
            value={formatNumber(phase42Stats.inventoryStats.activeProducts)} 
          />
          <AnalyticsKpiCard 
            title="Out of Stock" 
            value={formatNumber(phase42Stats.inventoryStats.outOfStockProducts)} 
          />
        </div>
      </section>

      {/* Procurement Analytics */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4 mt-8">Procurement</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <AnalyticsKpiCard 
            title="Total Bookings" 
            value={formatNumber(procurementStats.overview.totalBookings)} 
          />
          <AnalyticsKpiCard 
            title="Total Accepted (Paid)" 
            value={`${formatNumber(procurementStats.volumeByCrop.reduce((acc, c) => acc + c.totalKg, 0))} KG`} 
          />
          <AnalyticsKpiCard 
            title="Total Paid Value" 
            value={formatCurrency(platformStats.procurement.totalPaid)} 
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-2">Crop Breakdown (Revenue)</h3>
            <SimpleBarChart 
              data={procurementStats.volumeByCrop} 
              xKey="cropName" 
              yKey="totalAmount" 
              fill="#f59e0b"
            />
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-2">Quality Inspection Results</h3>
            <StatusPieChart data={procurementStats.quality} />
          </div>
        </div>

        <div className="mt-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Centre Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Centre</th>
                  <th className="px-4 py-3 text-right">Accepted Quantity</th>
                  <th className="px-4 py-3 text-right rounded-tr-lg">Total Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {procurementStats.volumeByCentre.map((c, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.centreName}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(c.totalKg)} KG</td>
                    <td className="px-4 py-3 text-right font-semibold text-amber-600">{formatCurrency(c.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Delivery Analytics */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4 mt-8">Delivery & Logistics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-2">Delivery Types</h3>
            <StatusPieChart data={deliveryStats.typeBreakdown} nameKey="type" />
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-2">Delivery Status</h3>
            <StatusPieChart data={deliveryStats.statusBreakdown} />
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Top Delivery Partners</h3>
            <div className="space-y-3">
              {deliveryStats.partnerBreakdown.slice(0, 5).map((p, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0">
                  <span className="text-sm font-medium text-gray-700">{p.partnerName}</span>
                  <span className="text-sm font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{p.deliveries}</span>
                </div>
              ))}
              {deliveryStats.partnerBreakdown.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-4">No partner data</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Machinery Analytics */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4 mt-8">Machinery Rental</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <AnalyticsKpiCard 
              title="Machinery Booking Value" 
              value={formatCurrency(machineryStats.overview.totalRevenue)} 
              subtitle={`${formatNumber(machineryStats.overview.totalBookings)} bookings`}
            />
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-2">Booking Status</h3>
            <StatusPieChart data={machineryStats.statusBreakdown} />
          </div>
        </div>
      </section>

            {/* Payment Analytics */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4 mt-8">Payment Gateway Analytics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <AnalyticsKpiCard 
            title="Total Transactions" 
            value={formatNumber(phase42Stats.paymentStats.totalTransactions)} 
          />
          <AnalyticsKpiCard 
            title="Successful Payments" 
            value={formatNumber(phase42Stats.paymentStats.successfulPayments)} 
          />
          <AnalyticsKpiCard 
            title="Refunds" 
            value={formatNumber(phase42Stats.paymentStats.refunds)} 
          />
          <AnalyticsKpiCard 
            title="Captured Amount" 
            value={formatCurrency(phase42Stats.paymentStats.capturedAmount)} 
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-2">Payment Status Distribution</h3>
            <StatusPieChart data={phase42Stats.paymentDistribution} />
          </div>
        </div>
      </section>

      {/* Financial Overview */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4 mt-8">Financial Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AnalyticsKpiCard 
            title="Marketplace Value" 
            value={formatCurrency(marketplaceStats.overview.totalRevenue)} 
            icon={<span className="text-emerald-500 font-bold">₹</span>}
          />
          <AnalyticsKpiCard 
            title="Procurement Payments" 
            value={formatCurrency(platformStats.procurement.totalPaid)} 
            icon={<span className="text-amber-500 font-bold">₹</span>}
          />
          <AnalyticsKpiCard 
            title="Machinery Booking Value" 
            value={formatCurrency(machineryStats.overview.totalRevenue)} 
            icon={<span className="text-orange-500 font-bold">₹</span>}
          />
        </div>
      </section>
    </div>
  );
}
