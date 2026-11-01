"use client";

import React from "react";
import Link from "next/link";
import { FarmerDashboardCropItem } from "@/actions/farmer/dashboard-actions";
import { SupportedLanguage, CHAT_TRANSLATIONS } from "@/lib/ai/i18n";
import { CropIcon } from "@/components/ui/icons";
import { formatDeterministicDate } from "@/lib/date-utils";

export function FarmerCropsCard({
  crops,
  language = "en",
}: {
  crops: FarmerDashboardCropItem[];
  language?: SupportedLanguage;
}) {
  const t = CHAT_TRANSLATIONS[language];

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-800">
            <CropIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 tracking-tight text-base sm:text-lg">
              {t.cropsHeading}
            </h2>
            <p className="text-xs text-gray-500">
              {crops.length > 0
                ? `${crops.length} ${language === "te" ? "పంటలు సాగులో ఉన్నాయి" : crops.length === 1 ? "crop recorded" : "crops recorded"}`
                : t.notSpecifiedLabel}
            </p>
          </div>
        </div>

        <Link
          href="/farmer/crops"
          className="text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline flex items-center gap-1"
        >
          <span>{t.manageCropsLink}</span>
          <span>&rarr;</span>
        </Link>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-center">
        {crops.length === 0 ? (
          <div className="text-center py-6 px-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3 text-2xl">
              🌱
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">{t.noCropsRegistered}</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">{t.noCropsSubtext}</p>
            <Link
              href="/farmer/crops"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <span>+</span>
              <span>{t.registerCropButton}</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {crops.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl border border-gray-200/80 bg-gray-50/40 hover:bg-white hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-gray-900 text-base leading-tight">
                        {c.cropName}
                      </h4>
                      {c.variety && (
                        <p className="text-xs font-medium text-emerald-700 mt-0.5">{c.variety}</p>
                      )}
                    </div>
                    {c.area !== null && c.area > 0 && (
                      <span className="text-[11px] font-bold text-gray-700 bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-2xs shrink-0">
                        {c.area} {c.areaUnit}
                      </span>
                    )}
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white p-2 rounded-lg border border-gray-100">
                      <dt className="text-gray-400 font-medium">{t.sowingDateLabel}</dt>
                      <dd className="font-semibold text-gray-800 mt-0.5 truncate">
                        {c.plantingDate ? formatDeterministicDate(c.plantingDate) : t.notSpecifiedLabel}
                      </dd>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-gray-100">
                      <dt className="text-gray-400 font-medium">{t.daysSinceSowingLabel}</dt>
                      <dd className="font-semibold text-emerald-800 mt-0.5 truncate">
                        {c.daysSinceSowing !== null
                          ? `${c.daysSinceSowing} ${language === "te" ? "రోజులు" : "days"}`
                          : t.notSpecifiedLabel}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-gray-100">
                  <Link
                    href={`/farmer/assistant?q=${encodeURIComponent(c.askAiQuery)}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 transition-colors"
                  >
                    <span>🤖</span>
                    <span>{t.askAiAboutCrop}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
