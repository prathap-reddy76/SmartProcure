import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-utils";
import { getMachineryListingById } from "@/actions/machinery/machinery-actions";
import { getDirectionsUrl } from "@/lib/distance";
import {
  getMachineTypeFromCategory,
  formatMachinerySpecifications,
  MACHINE_TYPES,
  MachinerySpecificationsRecord,
} from "@/lib/machinery-specifications";
import { MachineryEquipmentRentalCalculator } from "@/components/farmer/machinery-equipment-rental-calculator";

export const metadata = {
  title: "Machinery Specifications & Booking | SmartProcure",
  description: "View verified equipment specifications, comparison data, and book rental.",
};

export default async function MachineryDetailsPage({
  params,
}: {
  params: Promise<{ machineryId: string }>;
}) {
  await requireRole("FARMER");
  const { machineryId } = await params;

  const res = await getMachineryListingById(machineryId);
  if (!res.success || !res.machinery) {
    notFound();
  }

  const machine = res.machinery;
  const directionsUrl =
    machine.latitude !== null && machine.longitude !== null
      ? getDirectionsUrl(machine.latitude, machine.longitude)
      : null;

  const machineTypeKey =
    (machine.specifications as any)?.machineType ||
    getMachineTypeFromCategory(machine.category?.slug || machine.category?.name);

  const machineTypeMeta = MACHINE_TYPES.find((m) => m.key === machineTypeKey);

  // Extract structured specifications using formatter
  const formattedSpecs = formatMachinerySpecifications(
    machine.specifications as unknown as MachinerySpecificationsRecord,
    machineTypeKey
  );

  // Group specifications by category section
  const specGroups: Record<string, typeof formattedSpecs> = {};
  for (const item of formattedSpecs) {
    const groupName = item.group || "Technical Specifications";
    if (!specGroups[groupName]) {
      specGroups[groupName] = [];
    }
    specGroups[groupName].push(item);
  }

  return (
    <div className="min-h-screen bg-gray-50/70 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Breadcrumb / Back button */}
        <div>
          <Link
            href="/farmer/machinery"
            className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors inline-flex items-center gap-1.5"
          >
            <span>&larr;</span>
            <span>Back to Machinery Marketplace</span>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Media & Specs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="h-72 sm:h-96 bg-gray-100 flex items-center justify-center relative">
                {machine.images && machine.images.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={machine.images[0]}
                    alt={machine.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-7xl opacity-40">🚜</div>
                )}

                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-full text-xs font-black uppercase text-amber-900 border border-amber-200 shadow-sm flex items-center gap-1.5">
                    <span>{machineTypeMeta?.icon || "🚜"}</span>
                    <span>{machineTypeMeta?.label || machine.category.name}</span>
                  </span>
                  <span className="bg-emerald-600/90 text-white backdrop-blur-xs px-2.5 py-1.5 rounded-full text-[11px] font-bold shadow-sm">
                    {machine.condition} Condition
                  </span>
                </div>
              </div>

              {/* Thumbnails if multiple */}
              {machine.images && machine.images.length > 1 && (
                <div className="p-3 flex items-center gap-2.5 overflow-x-auto border-t border-gray-100 bg-gray-50/50">
                  {machine.images.map((img, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={img}
                      alt={`Photo ${i + 1}`}
                      className="w-16 h-16 rounded-xl object-cover border border-gray-200 shrink-0 hover:border-amber-500 cursor-pointer transition-all"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Overview & Identification */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-4">
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                  {machine.brand || "Agricultural Machine"} {machine.modelNumber ? `• ${machine.modelNumber}` : ""}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-0.5">
                  {machine.name}
                </h1>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                  <span>📍 {machine.location}</span>
                  {machine.yearOfMake && <span>• Make Year: {machine.yearOfMake}</span>}
                  {machine.horsepower && <span>• Power: {machine.horsepower} HP</span>}
                </p>
              </div>

              {machine.description && (
                <div className="pt-3 border-t border-gray-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Equipment Description & Inclusions
                  </h3>
                  <p className="text-sm text-gray-700 mt-1.5 leading-relaxed whitespace-pre-line">
                    {machine.description}
                  </p>
                </div>
              )}

              {/* Highlights Summary Grid */}
              <div className="pt-3 border-t border-gray-100">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl">
                    <span className="text-gray-500 block text-[10px] uppercase font-bold">
                      Machine Type
                    </span>
                    <span className="font-bold text-gray-900 mt-0.5 block truncate">
                      {machineTypeMeta?.label || machine.category.name}
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">
                      Horsepower / Engine
                    </span>
                    <span className="font-bold text-gray-900 mt-0.5 block">
                      {machine.horsepower ? `${machine.horsepower} HP` : "N/A"}
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">
                      Condition
                    </span>
                    <span className="font-bold text-gray-900 mt-0.5 block">
                      {machine.condition}
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">
                      Fuel / Drive
                    </span>
                    <span className="font-bold text-gray-900 mt-0.5 block truncate">
                      {String((machine.specifications as any)?.driveType || machine.fuelType || "Diesel")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* DYNAMIC MACHINE-TYPE SPECIFICATIONS DISPLAY (SECTION 17)      */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-6">
              <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <span>{machineTypeMeta?.icon || "⚙️"}</span>
                    <span>{machineTypeMeta?.label || "Machine"} Detailed Specifications</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Verified technical specifications provided by the equipment owner.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
                  {formattedSpecs.length} Specs Available
                </span>
              </div>

              {formattedSpecs.length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(specGroups).map(([groupTitle, items]) => (
                    <div key={groupTitle} className="space-y-2.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>{groupTitle}</span>
                      </h3>
                      <div className="bg-gray-50/70 rounded-xl border border-gray-200/80 overflow-hidden divide-y divide-gray-200/60">
                        {items.map((item, idx) => (
                          <div
                            key={idx}
                            className={`p-3 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 transition-colors ${
                              item.highlight ? "bg-amber-50/40" : "hover:bg-white"
                            }`}
                          >
                            <span className="text-gray-500 font-medium sm:w-1/2">
                              {item.label}
                            </span>
                            <span className="font-bold text-gray-900 sm:w-1/2 sm:text-right">
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Fallback if no extended specs entered yet */
                <div className="py-6 text-center text-gray-500 text-xs">
                  Basic machine details recorded. Contact owner for custom implement compatibility.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Pricing & Booking Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-6 space-y-6 sticky top-24">
              <MachineryEquipmentRentalCalculator
                machineryId={machine.id}
                supportsHourly={machine.supportsHourly}
                pricePerHour={machine.pricePerHour}
                supportsDaily={machine.supportsDaily}
                pricePerDay={machine.pricePerDay}
                supportsPerAcre={machine.supportsPerAcre}
                pricePerAcre={machine.pricePerAcre}
                securityDeposit={machine.securityDeposit}
                deliveryCharge={machine.deliveryCharge}
                serviceRadiusKm={
                  (machine.specifications as any)?.serviceRadiusKm
                    ? Number((machine.specifications as any)?.serviceRadiusKm)
                    : null
                }
              />

              {/* Owner and Location Snapshot */}
              <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Equipment Location:</span>
                  <span className="font-bold text-gray-800">{machine.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Owner Contact:</span>
                  <span className="font-bold text-gray-800">{machine.ownerName}</span>
                </div>
                {directionsUrl && (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 pt-1"
                  >
                    <span>🗺️ Open in Google Maps</span>
                    <span>&rarr;</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
