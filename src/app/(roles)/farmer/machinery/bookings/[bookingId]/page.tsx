import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import { getRentalBookingById } from "@/actions/machinery/booking-actions";
import { BookingDetailClient } from "./booking-detail-client";

interface PageProps {
  params: Promise<{
    bookingId: string;
  }>;
}

export default async function FarmerBookingDetailPage({ params }: PageProps) {
  await requireRole("FARMER");
  const { bookingId } = await params;

  const result = await getRentalBookingById(bookingId);

  if (!result.success || !result.booking) {
    notFound();
  }

  const { booking } = result;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/farmer/machinery" className="hover:text-emerald-700">
          Machinery Marketplace
        </Link>
        <span>/</span>
        <Link href="/farmer/machinery/bookings" className="hover:text-emerald-700">
          My Bookings
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-mono font-medium">#{booking.bookingNumber}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Booking #{booking.bookingNumber}
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Created on {new Date(booking.createdAt).toLocaleDateString()} at{" "}
            {new Date(booking.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        <Link
          href="/farmer/machinery/bookings"
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
        >
          ← Back to All Bookings
        </Link>
      </div>

      <BookingDetailClient booking={booking} />
    </div>
  );
}
