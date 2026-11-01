"use client";

import React from "react";
import Link from "next/link";
import { FarmerProfileSummary } from "@/actions/farmer/dashboard-actions";
import { SupportedLanguage, CHAT_TRANSLATIONS } from "@/lib/ai/i18n";
import { FarmIcon, ProfileIcon } from "@/components/ui/icons";

export function FarmerProfileCard({
  summary,
  language = "en",
}: {
  summary: FarmerProfileSummary;
  language?: SupportedLanguage;
}) {
  const t = CHAT_TRANSLATIONS[language];
  const percent = summary.completionPercentage;

  // Determine progress bar color based on percentage
  const barColor =
    percent >= 80
      ? "bg-emerald-600"
      : percent >= 50
      ? "bg-amber-500"
      : "bg-blue-600";

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
      {/* Top Banner / Identity */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-900 to-green-800 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0 text-xl font-black text-white">
            {summary.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">{summary.name}</h2>
              <span className="bg-emerald-500/30 text-emerald-100 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-emerald-400/30">
                {language === "te" ? "రైతు ఖాతా" : "Verified Farmer"}
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 mt-0.5 flex items-center gap-1.5">
              <span>📍 {summary.location}</span>
              {summary.phone && <span>• 📞 {summary.phone}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/farmer/profile/edit"
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg border border-white/20 transition-colors inline-flex items-center gap-1.5"
          >
            <ProfileIcon className="w-3.5 h-3.5" />
            <span>{t.editProfileButton}</span>
          </Link>
          <Link
            href="/farmer/farm/edit"
            className="px-3.5 py-1.5 bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <FarmIcon className="w-3.5 h-3.5 text-emerald-800" />
            <span>{language === "te" ? "పొలం వివరాలు" : "Farm Details"}</span>
          </Link>
        </div>
      </div>

      {/* Profile Metrics Grid */}
      <div className="p-5 sm:p-6 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Farm Size */}
          <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-100">
            <dt className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              {t.farmAreaLabel}
            </dt>
            <dd className="mt-1 text-base font-bold text-gray-900 truncate">
              {summary.farmSize !== null && summary.farmSize > 0
                ? `${summary.farmSize} ${summary.farmSizeUnit}`
                : <span className="text-gray-400 font-normal text-xs">{t.notSpecifiedLabel}</span>}
            </dd>
          </div>

          {/* Soil Type */}
          <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-100">
            <dt className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              {t.soilTypeLabel}
            </dt>
            <dd className="mt-1 text-base font-bold text-gray-900 truncate">
              {summary.landType || (
                <span className="text-gray-400 font-normal text-xs">{t.notSpecifiedLabel}</span>
              )}
            </dd>
          </div>

          {/* Irrigation Method */}
          <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-100">
            <dt className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              {t.irrigationLabel}
            </dt>
            <dd className="mt-1 text-base font-bold text-gray-900 truncate">
              {summary.irrigationType || (
                <span className="text-gray-400 font-normal text-xs">{t.notSpecifiedLabel}</span>
              )}
            </dd>
          </div>

          {/* Registered Crops */}
          <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-100">
            <dt className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              {t.registeredCropsLabel}
            </dt>
            <dd className="mt-1 text-base font-bold text-emerald-800 truncate">
              {summary.cropsCount}{" "}
              <span className="text-xs font-normal text-gray-600">
                {language === "te" ? "పంటలు" : summary.cropsCount === 1 ? "crop" : "crops"}
              </span>
            </dd>
          </div>
        </div>

        {/* Profile Completeness Bar */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-gray-700 flex items-center gap-1.5">
              <span>{t.profileCompletionLabel}</span>
              <span className="font-bold text-gray-900">({percent}%)</span>
            </span>
            <span className="text-gray-500">
              {percent === 100
                ? (language === "te" ? "పూర్తి అయ్యింది ✨" : "All set ✨")
                : (language === "te" ? "అసంపూర్ణం" : "In progress")}
            </span>
          </div>

          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${barColor} transition-all duration-500 rounded-full`}
              style={{ width: `${percent}%` }}
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          {summary.missingFields.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-600">
              <span className="text-[11px] text-gray-500 font-medium">
                {language === "te" ? "ఖచ్చితమైన సలహాల కోసం నమోదు చేయండి:" : "Add missing details for better AI advice:"}
              </span>
              {summary.missingFields.slice(0, 3).map((mf) => (
                <Link
                  key={mf.field}
                  href={mf.editUrl}
                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold border border-amber-200 transition-colors"
                >
                  + {language === "te" ? mf.labelTe : mf.labelEn}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
