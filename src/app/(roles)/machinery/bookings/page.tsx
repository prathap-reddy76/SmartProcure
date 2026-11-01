import React from "react";
import Link from "next/link";
import { getOwnerRentalBookings } from "@/actions/machinery/booking-actions";
import { OwnerBookingsClient } from "./owner-bookings-client";

export default async function OwnerBookingsPage() {
  const result = await getOwnerRentalBookings();
  const bookings = result.success ? result.bookings : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/machinery/dashboard" className="hover:text-amber-700">
          Machinery Portal
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Rental Requests & Bookings</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Machinery Rental Bookings
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Review incoming rental requests, approve time windows, track dispatched machinery, and finalize completions.
          </p>
        </div>

        <Link
          href="/machinery/my-machinery"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <span>🚜 View Fleet</span>
        </Link>
      </div>

      <OwnerBookingsClient initialBookings={bookings} />
    </div>
  );
}
