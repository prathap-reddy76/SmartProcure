import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-utils";
import { getProcurementCentreDetail } from "@/actions/procurement/centre-actions";
import { BookingForm } from "./booking-form";
import { ProcurementIcon } from "@/components/ui/icons";
import { CentreLocationCard } from "./centre-location-card";
import { CentreWeatherCard } from "@/components/weather/centre-weather-card";

export default async function ProcurementCentreDetailPage({
  params
}: {
  params: Promise<{ centreId: string }>
}) {
  await requireRole("FARMER");
  const { centreId } = await params;
  
  const { centre, crops } = await getProcurementCentreDetail(centreId);
  
  if (!centre) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-gray-500 flex items-center gap-1.5" aria-label="Breadcrumb">
        <Link href="/farmer/dashboard" className="hover:text-green-700">Dashboard</Link>
        <span>&rsaquo;</span>
        <Link href="/farmer/procurement" className="hover:text-green-700">Procurement</Link>
        <span>&rsaquo;</span>
        <Link href="/farmer/procurement/centres" className="hover:text-green-700">Centres</Link>
        <span>&rsaquo;</span>
        <span className="text-gray-800 font-bold">{centre.code}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Centre Info & Location Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center border border-green-100">
              <ProcurementIcon className="w-6 h-6 text-green-700" />
            </div>
            
            <div>
              <h1 className="text-xl font-bold text-gray-900">{centre.name}</h1>
              <p className="text-sm font-mono text-gray-500 mt-0.5">{centre.code}</p>
            </div>
            
            <p className="text-sm text-gray-700 leading-relaxed">
              {centre.description || "Official government and private agricultural crop procurement centre."}
            </p>

            <div className="pt-4 border-t border-gray-100 space-y-3 text-sm text-gray-600">
              <div>
                <strong className="block text-gray-900 text-xs">Operating Hours</strong>
                <span>{centre.operatingStartTime || "09:00"} to {centre.operatingEndTime || "17:00"}</span>
              </div>
              {centre.contactPhone && (
                <div>
                  <strong className="block text-gray-900 text-xs">Contact Phone</strong>
                  <span>{centre.contactPhone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Location & Navigation Card */}
          <CentreLocationCard centre={centre} />

          {/* Current Weather & Travel Conditions at Centre */}
          <CentreWeatherCard centreId={centre.id} centreName={centre.name} />
        </div>

        {/* Right Col: Booking Form */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 sm:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Book Procurement Slot</h2>
            <p className="text-sm text-gray-500 mb-6">Select your crop, quantity, and preferred date to generate a procurement token.</p>
            
            <BookingForm centreId={centre.id} crops={crops} />
          </div>
        </div>
      </div>
    </div>
  );
}
