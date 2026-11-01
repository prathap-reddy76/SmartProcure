import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import { getFarmDetails } from "@/actions/farmer/farm-actions";
import { FarmIcon } from "@/components/ui/icons";

export default async function FarmDetailsPage() {
  await requireRole("FARMER");
  const res = await getFarmDetails();
  const farm = res.farm;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <FarmIcon className="w-6 h-6 text-green-700" />
            <span>My Farm Details</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Information about your land holding, soil & irrigation methods, and primary crops.
          </p>
        </div>
        <div>
          <Link
            href="/farmer/farm/edit"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-medium rounded-lg shadow-xs transition-colors"
          >
            {farm ? "Edit Farm Details" : "Add Farm Details"}
          </Link>
        </div>
      </div>

      {farm ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-xl border border-gray-200/80 shadow-xs p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-4 border-b pb-2">
                Land & Cultivation Metrics
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/80">
                  <dt className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                    Total Cultivated Area
                  </dt>
                  <dd className="mt-1 font-extrabold text-2xl text-emerald-950">
                    {farm.farmSize} <span className="text-base font-medium">{farm.farmSizeUnit}</span>
                  </dd>
                </div>

                <div className="bg-green-50/50 p-4 rounded-xl border border-green-100/80">
                  <dt className="text-xs font-semibold text-green-800 uppercase tracking-wider">
                    Primary Crop
                  </dt>
                  <dd className="mt-1 font-extrabold text-2xl text-green-950 truncate">
                    {farm.primaryCrop || "Not specified"}
                  </dd>
                </div>

                <div className="bg-gray-50/70 p-3.5 rounded-lg border border-gray-100">
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Farm Name / Title
                  </dt>
                  <dd className="mt-1 font-medium text-gray-900 text-base">
                    {farm.farmName || "Primary Farm Land"}
                  </dd>
                </div>

                <div className="bg-gray-50/70 p-3.5 rounded-lg border border-gray-100">
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Land Classification
                  </dt>
                  <dd className="mt-1 font-medium text-gray-900">{farm.landType || "Standard"}</dd>
                </div>

                <div className="bg-gray-50/70 p-3.5 rounded-lg border border-gray-100">
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Irrigation Source
                  </dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {farm.irrigationType || "Rainfed"}
                  </dd>
                </div>

                <div className="bg-gray-50/70 p-3.5 rounded-lg border border-gray-100">
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Farm Location
                  </dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {[farm.village, farm.district, farm.state].filter(Boolean).join(", ") ||
                      "Same as registered profile"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Quick tips & guidelines */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                Why Keep Farm Details Updated?
              </h3>
              <ul className="text-xs text-gray-600 space-y-2.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Accurate land area calculations assist in calculating exact MSP procurement quotas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Irrigation details help future weather and disease alerts cater to your crop needs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>District information connects you to the nearest designated procurement center.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-8 sm:p-12 text-center max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <FarmIcon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Your farm profile isn&apos;t complete yet
          </h2>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Add your farm details such as total land size, irrigation type, and primary crop to get started with SmartProcure services.
          </p>
          <Link
            href="/farmer/farm/edit"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg text-sm shadow-xs transition-colors"
          >
            <span>Add Farm Details</span>
            <span>&rarr;</span>
          </Link>
        </div>
      )}
    </div>
  );
}
