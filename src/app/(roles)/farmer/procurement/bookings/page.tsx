import { formatUTCDate } from "@/lib/date-utils";
import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import { getFarmerProcurementBookings } from "@/actions/procurement/booking-actions";
import { OrdersIcon, ProcurementIcon } from "@/components/ui/icons";

export default async function ProcurementBookingsPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string }>
}) {
  await requireRole("FARMER");
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const { bookings, pagination } = await getFarmerProcurementBookings(page, 25);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "BOOKED":
      case "WAITING":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "ARRIVED":
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "CANCELLED":
      case "NO_SHOW":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <OrdersIcon className="w-6 h-6 text-green-700" />
            <span>My Bookings</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track the status of your procurement slots.</p>
        </div>
        <Link
          href="/farmer/procurement/centres"
          className="px-5 py-2.5 bg-green-700 text-white font-bold text-sm rounded-xl hover:bg-green-800 transition-colors shadow-xs"
        >
          Book New Slot
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="divide-y divide-gray-100">
          {bookings.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 text-green-600">
                <ProcurementIcon className="w-8 h-8" />
              </div>
              <p className="text-gray-900 font-bold text-lg">No bookings found</p>
              <p className="text-gray-500 text-sm mt-1 mb-6 max-w-sm mx-auto">
                You haven&apos;t booked any procurement slots yet. Book a slot to sell your harvest.
              </p>
              <Link
                href="/farmer/procurement/centres"
                className="px-6 py-2.5 bg-white border-2 border-green-700 text-green-800 font-bold rounded-xl hover:bg-green-50 transition-colors"
              >
                Find a Centre
              </Link>
            </div>
          ) : (
            bookings.map(booking => (
              <div key={booking.id} className="p-5 sm:p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-gray-900 text-lg">{booking.cropName}</h3>
                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border ${getStatusBadge(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs font-medium mb-0.5">Procurement Centre</p>
                      <p className="font-medium text-gray-900">{booking.centreName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-medium mb-0.5">Booking ID</p>
                      <p className="font-mono text-gray-900">{booking.bookingNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-medium mb-0.5">Slot Date & Time</p>
                      <p className="font-medium text-gray-900">
                        {formatUTCDate(booking.slotDate, "d MMM yyyy")}<br/>
                        <span className="text-xs text-gray-600">{booking.slotStartTime} - {booking.slotEndTime}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-medium mb-0.5">Expected Quantity</p>
                      <p className="font-medium text-gray-900">{booking.expectedQuantity} Quintals</p>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col gap-3 justify-end items-end shrink-0 border-t border-gray-100 sm:border-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
                  <div className="w-full sm:text-right hidden sm:block">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Queue Token</p>
                    <p className="text-xl font-mono font-black text-green-700 bg-green-50 px-3 py-1 rounded-lg inline-block border border-green-100">{booking.tokenNumber}</p>
                  </div>
                  <Link
                    href={`/farmer/procurement/bookings/${booking.id}`}
                    className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors text-center shadow-xs"
                  >
                    View Status &rarr;
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
        
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500 bg-gray-50">
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex gap-2">
              {pagination.page > 1 && <Link href={`?page=${pagination.page-1}`} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 font-medium">Previous</Link>}
              {pagination.page < pagination.totalPages && <Link href={`?page=${pagination.page+1}`} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 font-medium">Next</Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
