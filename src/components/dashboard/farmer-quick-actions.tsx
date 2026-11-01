"use client";

import React from "react";
import Link from "next/link";
import { SupportedLanguage, CHAT_TRANSLATIONS } from "@/lib/ai/i18n";

export function FarmerQuickActions({
  language = "en",
}: {
  language?: SupportedLanguage;
}) {
  const t = CHAT_TRANSLATIONS[language];

  const actions = [
    {
      href: "/farmer/assistant",
      icon: "🤖",
      color: "bg-emerald-50 text-emerald-800 border-emerald-200 group-hover:bg-emerald-100",
      title: t.actionAiAssistant,
      desc: t.actionAiAssistantDesc,
    },
    {
      href: "/farmer/assistant",
      icon: "📸",
      color: "bg-teal-50 text-teal-800 border-teal-200 group-hover:bg-teal-100",
      title: t.actionPlantDisease,
      desc: t.actionPlantDiseaseDesc,
    },
    {
      href: "/farmer/marketplace",
      icon: "🛒",
      color: "bg-indigo-50 text-indigo-800 border-indigo-200 group-hover:bg-indigo-100",
      title: t.actionMarketplace,
      desc: t.actionMarketplaceDesc,
    },
    {
      href: "/farmer/market-prices",
      icon: "📊",
      color: "bg-amber-50 text-amber-800 border-amber-200 group-hover:bg-amber-100",
      title: t.actionMarketPrices,
      desc: t.actionMarketPricesDesc,
    },
    {
      href: "/farmer/weather",
      icon: "🌦️",
      color: "bg-sky-50 text-sky-800 border-sky-200 group-hover:bg-sky-100",
      title: t.actionWeather,
      desc: t.actionWeatherDesc,
    },
    {
      href: "/farmer/orders",
      icon: "📦",
      color: "bg-blue-50 text-blue-800 border-blue-200 group-hover:bg-blue-100",
      title: t.actionOrders,
      desc: t.actionOrdersDesc,
    },
    {
      href: "/farmer/farm/edit",
      icon: "🚜",
      color: "bg-green-50 text-green-800 border-green-200 group-hover:bg-green-100",
      title: t.actionProfile,
      desc: t.actionProfileDesc,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-5">
      <h2 className="font-bold text-gray-900 tracking-tight text-base sm:text-lg mb-4">
        {t.quickActionsHeading}
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {actions.map((act, i) => (
          <Link
            key={i}
            href={act.href}
            className="group p-3.5 rounded-xl border border-gray-200/80 bg-gray-50/50 hover:bg-white hover:border-emerald-400 hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div>
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg mb-2.5 transition-colors ${act.color}`}
              >
                {act.icon}
              </div>
              <h3 className="text-sm font-bold text-gray-900 group-hover:text-emerald-800 transition-colors line-clamp-1">
                {act.title}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{act.desc}</p>
            </div>
            <div className="mt-2.5 text-right">
              <span className="text-[11px] font-bold text-emerald-700 group-hover:translate-x-0.5 inline-block transition-transform">
                &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
