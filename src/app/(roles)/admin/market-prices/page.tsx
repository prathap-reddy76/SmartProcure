import { requireRole } from "@/lib/auth-utils";
import { prisma as db } from "@/lib/prisma";
import Link from "next/link";

export const metadata = {
  title: "Market Prices Admin - SmartProcure",
};

export default async function AdminMarketPricesPage() {
  await requireRole("ADMIN");

  const recentPrices = await db.marketCropPrice.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { market: true },
  });

  const markets = await db.market.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Market Intelligence Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Manage market connections, view cached data, and manually import prices.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/market-prices/new"
            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Add Market
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-xs border border-gray-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-gray-900 text-lg">Recent Price Data</h2>
            </div>
            {recentPrices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 bg-gray-50 uppercase">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Commodity</th>
                      <th className="px-6 py-3 font-semibold">Market</th>
                      <th className="px-6 py-3 font-semibold text-right">Modal Price</th>
                      <th className="px-6 py-3 font-semibold">Source</th>
                      <th className="px-6 py-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentPrices.map((price) => (
                      <tr key={price.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-medium text-gray-900">{price.commodityName}</td>
                        <td className="px-6 py-4 text-gray-600">{price.market.name}</td>
                        <td className="px-6 py-4 text-right font-bold text-green-700">₹{price.modalPrice.toNumber()}</td>
                        <td className="px-6 py-4">
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-semibold">
                            {price.dataSource}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{new Date(price.priceDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 text-sm">No price data cached yet.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5">
            <h2 className="font-bold text-gray-900 text-lg mb-4">Supported Markets</h2>
            {markets.length > 0 ? (
              <ul className="space-y-3">
                {markets.map(market => (
                  <li key={market.id} className="flex justify-between items-center border-b border-gray-50 pb-2">
                    <div>
                      <div className="font-medium text-gray-900">{market.name}</div>
                      <div className="text-xs text-gray-500">{market.district}, {market.state}</div>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${market.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No markets registered.</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5">
            <h2 className="font-bold text-gray-900 text-lg mb-2">Provider Status</h2>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <div>
                <div className="font-bold text-gray-900">Demo Provider</div>
                <div className="text-xs text-green-600">Active (Fallback)</div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4 leading-relaxed">
              The demo provider generates realistic market fluctuations for testing. In production, this would be replaced with Gov Data Portal API integration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
