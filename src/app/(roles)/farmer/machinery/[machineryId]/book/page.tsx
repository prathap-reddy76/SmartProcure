import React from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import { getMachineryListingById } from "@/actions/machinery/machinery-actions";
import { BookingFormClient } from "./booking-form-client";

interface PageProps {
  params: Promise<{
    machineryId: string;
  }>;
  searchParams?: Promise<{
    mode?: string;
    duration?: string;
  }>;
}

export default async function MachineryBookPage({ params, searchParams }: PageProps) {
  await requireRole("FARMER");
  const { machineryId } = await params;
  const sp = searchParams ? await searchParams : undefined;

  const result = await getMachineryListingById(machineryId);

  if (!result.success || !result.machinery) {
    notFound();
  }

  const { machinery } = result;

  if (!machinery.isApproved || !machinery.isAvailable) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto text-2xl font-bold mb-4">
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Machinery Unavailable</h2>
        <p className="text-sm text-gray-600 mb-6">
          This piece of equipment is currently unavailable or has been unlisted for bookings.
        </p>
        <Link
          href="/farmer/machinery"
          className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Explore Other Machinery
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/farmer/machinery" className="hover:text-emerald-700">
          Machinery Marketplace
        </Link>
        <span>/</span>
        <Link href={`/farmer/machinery/${machinery.id}`} className="hover:text-emerald-700">
          {machinery.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Book Rental</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Book {machinery.name}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Configure rental duration, schedule field times, and review transparent cost breakdown.
        </p>
      </div>

      <BookingFormClient
        machinery={machinery}
        initialMode={sp?.mode}
        initialDuration={sp?.duration ? Number(sp.duration) : undefined}
      />
    </div>
  );
}
