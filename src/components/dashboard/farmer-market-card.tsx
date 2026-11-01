"use client";

import React from "react";
import Link from "next/link";
import { SupportedLanguage, CHAT_TRANSLATIONS } from "@/lib/ai/i18n";
import { MarketIcon } from "@/components/ui/icons";
import { formatDeterministicDate } from "@/lib/date-utils";

interface MarketCropPriceItem {
  id?: string;
  commodityName: string;
  variety?: string | null;
  marketName: string;
  modalPrice: number;
  minPrice: number;
  maxPrice: number;
  priceUnit: string;
  priceDate: string;
  dataSource?: string;
}

export function FarmerMarketCard({
  marketPrices,
  language = "en",
}: {
  marketPrices: MarketCropPriceItem[];
  language?: SupportedLanguage;
}) {
  const t = CHAT_TRANSLATIONS[language];

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-800">
            <MarketIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 tracking-tight text-base sm:text-lg">
              {t.dashboardMarketHeading}
            </h2>
            <p className="text-xs text-gray-500">{t.dashboardMarketSubheading}</p>
          </div>
        </div>

        <Link
          href="/farmer/market-prices"
          className="text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline flex items-center gap-1"
        >
          <span>{t.viewAllMarketPrices}</span>
          <span>&rarr;</span>
        </Link>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-center">
        {marketPrices.length === 0 ? (
          <div className="text-center py-6 px-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3 text-2xl">
              📊
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">{t.noCropPricesFound}</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">{t.noCropPricesSubtext}</p>
            <Link
              href="/farmer/market-prices"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <span>{t.viewAllMarketPrices}</span>
              <span>&rarr;</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {marketPrices.map((p, idx) => (
              <div
                key={p.id || idx}
                className="bg-amber-50/40 border border-amber-200/70 rounded-xl p-3.5 flex flex-col justify-between hover:border-amber-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] font-bold text-amber-800 truncate" title={p.marketName}>
                      🏛️ {p.marketName}
                    </span>
                    {p.dataSource === "LIVE" && (
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                        LIVE
                      </span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-gray-900 text-sm">{p.commodityName}</h4>
                  {p.variety && <p className="text-[11px] text-gray-500 truncate">{p.variety}</p>}
                </div>

                <div className="mt-3 pt-2.5 border-t border-amber-200/50">
                  <div className="text-lg font-black text-amber-900">
                    ₹{p.modalPrice}{" "}
                    <span className="text-[11px] font-normal text-gray-600">/ {p.priceUnit}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500 mt-1">
                    <span>
                      Min ₹{p.minPrice} - Max ₹{p.maxPrice}
                    </span>
                    <span>{formatDeterministicDate(p.priceDate)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
