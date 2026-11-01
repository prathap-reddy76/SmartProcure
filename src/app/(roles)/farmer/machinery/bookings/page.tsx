import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import { getFarmerRentalBookings } from "@/actions/machinery/booking-actions";
import { FarmerBookingsClient } from "./farmer-bookings-client";

export default async function FarmerMachineryBookingsPage() {
  await requireRole("FARMER");

  const result = await getFarmerRentalBookings();
  const bookings = result.success ? result.bookings : [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/farmer/dashboard" className="hover:text-emerald-700">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/farmer/machinery" className="hover:text-emerald-700">
          Machinery Marketplace
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">My Rental Bookings</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            My Machinery Bookings
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Track reservation approvals, active equipment field rentals, and past receipts.
          </p>
        </div>

        <Link
          href="/farmer/machinery"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <span>🚜 Rent More Machinery</span>
        </Link>
      </div>

      <FarmerBookingsClient initialBookings={bookings} />
    </div>
  );
}
