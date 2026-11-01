"use client";

import React from "react";
import Link from "next/link";
import { SupportedLanguage, CHAT_TRANSLATIONS } from "@/lib/ai/i18n";

interface RecommendedProduct {
  id: string;
  name: string;
  price: string;
  category?: { name: string } | null;
  images?: Array<{ imageUrl: string }> | null;
}

export function FarmerRecommendedProducts({
  products,
  language = "en",
}: {
  products: RecommendedProduct[];
  language?: SupportedLanguage;
}) {
  const t = CHAT_TRANSLATIONS[language];

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-gray-100 bg-gray-50/70 flex justify-between items-center">
        <div>
          <h2 className="font-bold text-gray-900 tracking-tight text-base sm:text-lg">
            {t.recommendedProductsHeading}
          </h2>
          <p className="text-xs text-gray-500">
            {language === "te"
              ? "మీ పంటలు మరియు అవసరాలకు సరిపోయే ఉత్పత్తులు"
              : "Tailored to your registered crops and cultivation needs"}
          </p>
        </div>
        <Link
          href="/farmer/marketplace"
          className="text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline"
        >
          {t.exploreMarketplaceLink} &rarr;
        </Link>
      </div>

      <div className="p-5">
        {products.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-gray-500">{t.noProductsAvailable}</p>
            <Link
              href="/farmer/marketplace"
              className="mt-3 inline-block px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors"
            >
              {t.browseCatalog}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/farmer/marketplace/${p.id}`}
                className="group border border-gray-200/80 rounded-xl overflow-hidden hover:border-emerald-400 hover:shadow-xs transition-all flex flex-col bg-white"
              >
                <div className="aspect-square bg-gray-50 flex items-center justify-center p-3 relative">
                  {p.images && p.images[0] ? (
                    <img
                      src={p.images[0].imageUrl}
                      alt={p.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xl">
                      📦
                    </div>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    {p.category && (
                      <p className="text-[10px] font-semibold text-emerald-800 mb-0.5 uppercase tracking-wider">
                        {p.category.name}
                      </p>
                    )}
                    <h3 className="text-xs font-bold text-gray-900 line-clamp-2 group-hover:text-emerald-800 transition-colors">
                      {p.name}
                    </h3>
                  </div>
                  <p className="font-black text-gray-900 text-sm mt-2">
                    ₹{parseFloat(p.price).toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
