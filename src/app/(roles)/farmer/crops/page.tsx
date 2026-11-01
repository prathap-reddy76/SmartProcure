import React from "react";
import { requireRole } from "@/lib/auth-utils";
import { getFarmerCrops } from "@/actions/farmer/crop-actions";
import { CropsClient } from "./crops-client";
import { CropIcon } from "@/components/ui/icons";

export default async function FarmerCropsPage() {
  await requireRole("FARMER");
  const res = await getFarmerCrops();
  const crops = res.crops || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <CropIcon className="w-6 h-6 text-green-700" />
            <span>My Cultivated Crops</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track and record crops cultivated across your land for procurement and harvest scheduling.
          </p>
        </div>
      </div>

      <CropsClient initialCrops={crops} />
    </div>
  );
}
