"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFarmerCropsMarketPrices } from "@/actions/market-prices";
import { formatDeterministicDate } from "@/lib/date-utils";

import { MarketPriceData } from "@/lib/market-prices/types";

export function FarmerDashboardMarketCard({ farmerId }: { farmerId: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPrices() {
      const res = await getFarmerCropsMarketPrices(farmerId);
      if (res.success && res.data) {
        setPrices(res.data.slice(0, 3)); // show top 3
      }
      setLoading(false);
    }
    loadPrices();
  }, [farmerId]);

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900">Live Market Prices (Your Crops)</h2>
        <Link href="/farmer/market-prices" className="text-xs font-semibold text-green-700 hover:text-green-800">
          View All Markets &rarr;
        </Link>
      </div>
      {loading ? (
        <div className="py-8 flex justify-center"><span className="text-sm text-gray-500 animate-pulse">Loading market prices...</span></div>
      ) : prices.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {prices.map((p, i) => (
            <div key={i} className="bg-orange-50 border border-orange-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="text-xs text-orange-600 font-semibold mb-1 truncate pr-2" title={p.marketName}>{p.marketName}</div>
                {p.dataSource === "LIVE" && <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded font-bold">LIVE</span>}
              </div>
              <div className="font-bold text-gray-900">{p.commodityName}</div>
              <div className="text-lg font-extrabold text-orange-700 mt-2">
                ₹{p.modalPrice} <span className="text-xs font-normal text-gray-600">/ {p.priceUnit}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="text-[10px] text-gray-500">Min: ₹{p.minPrice} - Max: ₹{p.maxPrice}</div>
                <div className="text-[10px] text-gray-400">{formatDeterministicDate(p.priceDate)}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-sm text-gray-500">
          No live prices found for your registered crops in your area. Add more crops to see their prices.
        </div>
      )}
    </div>
  );
}
