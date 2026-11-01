import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import { getFarmDetails } from "@/actions/farmer/farm-actions";
import { EditFarmForm } from "./edit-farm-form";

export default async function EditFarmPage() {
  await requireRole("FARMER");
  const res = await getFarmDetails();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {res.farm ? "Edit Farm Information" : "Add Farm Information"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Specify your farm area, irrigation sources, and primary cultivated crops.
          </p>
        </div>
        <Link
          href="/farmer/farm"
          className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-6 sm:p-8">
        <EditFarmForm initialFarm={res.farm} defaultLocation={res.farmerProfile} />
      </div>
    </div>
  );
}
