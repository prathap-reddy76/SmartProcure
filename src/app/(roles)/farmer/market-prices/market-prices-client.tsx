"use client";

import { useState, useEffect, useCallback } from "react";
import { getMarketPrices, getFarmerCropsMarketPrices } from "@/actions/market-prices";
import { MarketPriceData } from "@/lib/market-prices/types";

interface Props {
  farmerId: string;
  defaultState: string;
  defaultDistrict: string;
}

export function MarketPricesClient({ farmerId, defaultState, defaultDistrict }: Props) {
  const [activeTab, setActiveTab] = useState<"MY_CROPS" | "ALL_MARKETS">("MY_CROPS");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters for ALL_MARKETS
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState(defaultState);
  const [selectedDistrict, setSelectedDistrict] = useState(defaultDistrict);

  const loadData = useCallback(async () => {
    setLoading(true);
    if (activeTab === "MY_CROPS") {
      const res = await getFarmerCropsMarketPrices(farmerId);
      if (res.success) setPrices(res.data || []);
    } else {
      const res = await getMarketPrices({
        state: selectedState,
        district: selectedDistrict || undefined,
        commodityName: searchQuery || undefined
      });
      if (res.success) setPrices(res.data || []);
    }
    setLoading(false);
  }, [activeTab, farmerId, selectedState, selectedDistrict, searchQuery]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "ALL_MARKETS") {
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-full max-w-md">
        <button
          onClick={() => setActiveTab("MY_CROPS")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "MY_CROPS" ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          My Crops
        </button>
        <button
          onClick={() => setActiveTab("ALL_MARKETS")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "ALL_MARKETS" ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Explore Markets
        </button>
      </div>

      {/* Filters (only for Explore) */}
      {activeTab === "ALL_MARKETS" && (
        <form onSubmit={handleSearch} className="bg-white p-4 rounded-xl border border-gray-200 flex flex-wrap gap-4 items-end shadow-sm">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1">State</label>
            <select 
              value={selectedState} 
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full border-gray-300 rounded-lg text-sm p-2 bg-gray-50 focus:ring-green-500 focus:border-green-500"
            >
              <option value="Andhra Pradesh">Andhra Pradesh</option>
              <option value="Telangana">Telangana</option>
              <option value="Karnataka">Karnataka</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1">District (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. Guntur"
              value={selectedDistrict} 
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full border-gray-300 rounded-lg text-sm p-2 bg-gray-50 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Commodity Search</label>
            <input 
              type="text" 
              placeholder="e.g. Cotton, Paddy..."
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-gray-300 rounded-lg text-sm p-2 bg-gray-50 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <button 
            type="submit"
            className="px-6 py-2 bg-green-700 text-white text-sm font-semibold rounded-lg hover:bg-green-800 transition-colors h-[38px]"
          >
            Search
          </button>
        </form>
      )}

      {/* Results Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-4 border-green-200 border-t-green-700 rounded-full animate-spin"></div>
          <span className="text-sm text-gray-500">Fetching latest market prices...</span>
        </div>
      ) : prices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {prices.map((p, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow">
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">{p.commodityName}</h3>
                  <div className="text-xs text-gray-500 mt-1">
                    {p.variety && <span>Variety: {p.variety} &bull; </span>}
                    {p.grade && <span>Grade: {p.grade}</span>}
                  </div>
                </div>
                {p.dataSource === "LIVE" ? (
                  <span className="bg-green-100 text-green-700 border border-green-200 text-[10px] uppercase px-2 py-0.5 rounded-full font-bold">LIVE API</span>
                ) : p.dataSource === "DEMO" ? (
                  <span className="bg-orange-100 text-orange-700 border border-orange-200 text-[10px] uppercase px-2 py-0.5 rounded-full font-bold">DEMO</span>
                ) : (
                  <span className="bg-blue-100 text-blue-700 border border-blue-200 text-[10px] uppercase px-2 py-0.5 rounded-full font-bold">CACHED</span>
                )}
              </div>
              
              <div className="p-5">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  {p.market?.name || p.marketName}
                </div>
                <div className="text-[11px] text-gray-400 mb-4">{p.district && `${p.district}, `}{p.state}</div>
                
                <div className="bg-green-50 rounded-lg p-4 text-center border border-green-100">
                  <div className="text-xs text-green-800 font-medium mb-1">Modal Price (Most Common)</div>
                  <div className="text-2xl font-black text-green-700">₹{p.modalPrice}</div>
                  <div className="text-[10px] text-green-600 mt-1">per {p.priceUnit}</div>
                </div>
                
                <div className="flex justify-between mt-4 px-2">
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Min Price</div>
                    <div className="text-sm font-semibold text-gray-700">₹{p.minPrice}</div>
                  </div>
                  <div className="w-px bg-gray-200"></div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Max Price</div>
                    <div className="text-sm font-semibold text-gray-700">₹{p.maxPrice}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-[10px] text-gray-500">
                  Reported: {new Date(p.priceDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                  Set Alert
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Market Prices Found</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {activeTab === "MY_CROPS" 
              ? "We couldn't find any recent price data for the crops registered in your profile."
              : "No market prices match your current search filters. Try adjusting your state, district, or commodity search."}
          </p>
        </div>
      )}

      {/* Mandi Disclaimer & Attribution Banner */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-900 space-y-1">
        <div className="flex items-center gap-2 font-bold">
          <span>ℹ️</span>
          <span>Official APMC / AGMARKNET Wholesale Price Notice</span>
        </div>
        <p className="text-[11px] text-amber-800 leading-relaxed">
          Reported mandi prices are periodic wholesale arrival rates submitted by Agricultural Produce Market Committees (APMC) and Agmarknet. They reflect prevailing auction benchmarks and do not guarantee a fixed purchase or sale price. Actual farmgate rates depend on local moisture content, crop grade, and individual trader negotiations.
        </p>
      </div>
    </div>
  );
}
