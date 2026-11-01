"use client";

import React from "react";
import Link from "next/link";
import { FarmingSuggestionItem } from "@/actions/farmer/dashboard-actions";
import { SupportedLanguage, CHAT_TRANSLATIONS } from "@/lib/ai/i18n";

export function FarmerSuggestionsCard({
  suggestions,
  language = "en",
}: {
  suggestions: FarmingSuggestionItem[];
  language?: SupportedLanguage;
}) {
  const t = CHAT_TRANSLATIONS[language];

  const getBadgeStyle = (category: FarmingSuggestionItem["category"]) => {
    switch (category) {
      case "WEATHER":
        return {
          bg: "bg-sky-50 text-sky-800 border-sky-200",
          badgeLabel: t.weatherAdvisoryBadge,
          icon: "🌦️",
        };
      case "CROP":
        return {
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          badgeLabel: t.cropAdvisoryBadge,
          icon: "🌾",
        };
      case "PROFILE":
        return {
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          badgeLabel: t.profileTipBadge,
          icon: "💡",
        };
      default:
        return {
          bg: "bg-gray-50 text-gray-800 border-gray-200",
          badgeLabel: "Tip",
          icon: "✨",
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 bg-gray-50/70">
        <div className="flex items-center gap-2">
          <span className="text-xl">✨</span>
          <h2 className="font-bold text-gray-900 tracking-tight text-base sm:text-lg">
            {t.suggestionsHeading}
          </h2>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{t.suggestionsSubheading}</p>
      </div>

      {/* Suggestions List */}
      <div className="p-5 flex-1 divide-y divide-gray-100 space-y-3">
        {suggestions.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-500">
            {t.noSuggestionsAvailable}
          </div>
        ) : (
          suggestions.map((s, index) => {
            const badge = getBadgeStyle(s.category);
            const title = language === "te" ? s.titleTe : s.title;
            const description = language === "te" ? s.descriptionTe : s.description;
            const actionLabel = language === "te" ? s.actionLabelTe : s.actionLabel;

            return (
              <div
                key={s.id || index}
                className={`pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`}
              >
                <div className="space-y-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}
                    >
                      <span>{badge.icon}</span>
                      <span>{badge.badgeLabel}</span>
                    </span>
                    <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
                </div>

                <div className="shrink-0">
                  <Link
                    href={s.actionUrl}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors whitespace-nowrap"
                  >
                    <span>{actionLabel}</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
