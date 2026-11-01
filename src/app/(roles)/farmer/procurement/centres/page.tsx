import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import { getActiveProcurementCentres } from "@/actions/procurement/centre-actions";
import { ProcurementIcon } from "@/components/ui/icons";
import { FarmerCentresExplorer } from "@/components/procurement/farmer-centres-explorer";

export default async function ProcurementCentresPage() {
  await requireRole("FARMER");
  const centres = await getActiveProcurementCentres();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-gray-500 flex items-center gap-1.5" aria-label="Breadcrumb">
        <Link href="/farmer/dashboard" className="hover:text-green-700">Dashboard</Link>
        <span>&rsaquo;</span>
        <Link href="/farmer/procurement" className="hover:text-green-700">Procurement</Link>
        <span>&rsaquo;</span>
        <span className="text-gray-800 font-bold">Find Centre & Map</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <ProcurementIcon className="w-6 h-6 text-green-700" />
            <span>Procurement Centres & Navigation</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Locate procurement centres on the map, calculate distance from your farm, and book your slot.
          </p>
        </div>
      </div>

      {/* Main Explorer */}
      <FarmerCentresExplorer initialCentres={centres} />
    </div>
  );
}
