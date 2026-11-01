"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FarmerProfileSummary,
  FarmerDashboardCropItem,
  FarmingSuggestionItem,
} from "@/actions/farmer/dashboard-actions";
import { SupportedLanguage, CHAT_TRANSLATIONS } from "@/lib/ai/i18n";
import { FarmerProfileCard } from "./farmer-profile-card";
import { FarmerCropsCard } from "./farmer-crops-card";
import { FarmerSuggestionsCard } from "./farmer-suggestions-card";
import { FarmerMarketCard } from "./farmer-market-card";
import { FarmerQuickActions } from "./farmer-quick-actions";
import { FarmerOrdersCard } from "./farmer-orders-card";
import { FarmerRecommendedProducts } from "./farmer-recommended-products";
import { FarmerDashboardWeatherCard } from "@/components/weather/farmer-dashboard-weather-card";
import { BellIcon } from "@/components/ui/icons";

const LANG_PREF_KEY = "smartprocure-lang-pref";

interface FarmerDashboardShellProps {
  farmerName: string;
  profileSummary: FarmerProfileSummary;
  crops: FarmerDashboardCropItem[];
  suggestions: FarmingSuggestionItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  marketPrices: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeOrders: any[];
  activeOrdersCount: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeProcurement: any[];
  activeProcurementCount: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeDeliveries: any[];
  unreadNotificationsCount: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recommendedProducts: any[];
}

export function FarmerDashboardShell({
  farmerName,
  profileSummary,
  crops,
  suggestions,
  marketPrices,
  activeOrders,
  activeOrdersCount,
  activeProcurement,
  activeProcurementCount,
  activeDeliveries,
  unreadNotificationsCount,
  recommendedProducts,
}: FarmerDashboardShellProps) {
  const [language, setLanguage] = useState<SupportedLanguage>("en");

  // Load language preference and listen for updates
  useEffect(() => {
    const saved = localStorage.getItem(LANG_PREF_KEY) as SupportedLanguage | null;
    if (saved === "en" || saved === "te") {
      setLanguage(saved);
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === LANG_PREF_KEY && (e.newValue === "en" || e.newValue === "te")) {
        setLanguage(e.newValue);
      }
    };
    const handleCustom = (e: Event) => {
      const customEvent = e as CustomEvent<SupportedLanguage>;
      if (customEvent.detail === "en" || customEvent.detail === "te") {
        setLanguage(customEvent.detail);
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("smartprocure-lang-change", handleCustom);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("smartprocure-lang-change", handleCustom);
    };
  }, []);

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    localStorage.setItem(LANG_PREF_KEY, newLang);
    window.dispatchEvent(new CustomEvent("smartprocure-lang-change", { detail: newLang }));
  };

  const t = CHAT_TRANSLATIONS[language];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span>🌾</span>
            <span>{language === "te" ? "రైతు కార్యస్థలం" : "Farmer Workspace"}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {language === "te"
              ? `స్వాగతం, ${farmerName}!`
              : `Welcome back, ${farmerName}!`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Language Toggle Pill */}
          <div
            className="inline-flex rounded-xl bg-gray-100 p-1 border border-gray-200"
            role="group"
            aria-label={t.languageLabel}
          >
            {(["en", "te"] as SupportedLanguage[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => handleLanguageChange(lang)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  language === lang
                    ? "bg-white text-emerald-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                aria-pressed={language === lang}
              >
                {lang === "en" ? "English" : "తెలుగు"}
              </button>
            ))}
          </div>

          {/* Notifications Link */}
          <Link
            href="/farmer/notifications"
            className="relative p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            title={language === "te" ? "నోటిఫికేషన్లు" : "Notifications"}
          >
            <BellIcon className="w-5 h-5 text-gray-600" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            )}
          </Link>

          {/* Marketplace Button */}
          <Link
            href="/farmer/marketplace"
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors"
          >
            {t.shopNowButton}
          </Link>
        </div>
      </div>

      {/* 1. Farmer Profile Summary & Completeness */}
      <FarmerProfileCard summary={profileSummary} language={language} />

      {/* 2. Location-Based Weather on Farmer Home Dashboard (Phase 7) */}
      <FarmerDashboardWeatherCard />

      {/* 3. Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Link
          href="/farmer/orders"
          className="bg-white p-4 rounded-xl border border-gray-200/90 hover:border-emerald-400 transition-colors shadow-2xs"
        >
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {t.actionOrders}
          </p>
          <p className="text-2xl font-black text-gray-900 mt-1">{activeOrdersCount}</p>
        </Link>
        <Link
          href="/farmer/procurement/bookings"
          className="bg-white p-4 rounded-xl border border-gray-200/90 hover:border-emerald-400 transition-colors shadow-2xs"
        >
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {language === "te" ? "కొనుగోలు స్లాట్‌లు" : "Procurement Slots"}
          </p>
          <p className="text-2xl font-black text-gray-900 mt-1">{activeProcurementCount}</p>
        </Link>
        <Link
          href="/farmer/orders"
          className="bg-white p-4 rounded-xl border border-gray-200/90 hover:border-emerald-400 transition-colors shadow-2xs"
        >
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {language === "te" ? "డెలివరీలో ఉంది" : "In Transit"}
          </p>
          <p className="text-2xl font-black text-gray-900 mt-1">{activeDeliveries.length}</p>
        </Link>
        <Link
          href="/farmer/notifications"
          className="bg-white p-4 rounded-xl border border-gray-200/90 hover:border-emerald-400 transition-colors shadow-2xs"
        >
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {language === "te" ? "చదవని హెచ్చరికలు" : "Unread Alerts"}
          </p>
          <p className="text-2xl font-black text-gray-900 mt-1">{unreadNotificationsCount}</p>
        </Link>
      </div>

      {/* 4. Cultivated Crops Overview */}
      <FarmerCropsCard crops={crops} language={language} />

      {/* 5. Suggestions for Your Farm */}
      <FarmerSuggestionsCard suggestions={suggestions} language={language} />

      {/* 6. Agricultural Mandi Market Information */}
      <FarmerMarketCard marketPrices={marketPrices} language={language} />

      {/* 7. Quick Actions Grid */}
      <FarmerQuickActions language={language} />

      {/* 8. Recent Orders & Upcoming Procurement */}
      <FarmerOrdersCard
        activeOrders={activeOrders}
        activeProcurement={activeProcurement}
        language={language}
      />

      {/* 9. Personalized Recommended Products */}
      <FarmerRecommendedProducts products={recommendedProducts} language={language} />
    </div>
  );
}
