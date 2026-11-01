import { formatUTCDate } from "@/lib/date-utils";
import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import { ProcurementIcon, FarmIcon, OrdersIcon } from "@/components/ui/icons";
import { getFarmerProcurementBookings } from "@/actions/procurement/booking-actions";

export default async function ProcurementLandingPage() {
  await requireRole("FARMER");
  
  const { bookings } = await getFarmerProcurementBookings(1, 5);
  const activeBookings = bookings.filter(b => ["BOOKED", "ARRIVED", "WAITING", "IN_PROGRESS"].includes(b.status));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <ProcurementIcon className="w-6 h-6 text-green-700" />
            <span>Crop Procurement</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Book slots to sell your agricultural produce at government and private procurement centres.
          </p>
        </div>
        <Link
          href="/farmer/procurement/centres"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <span>Find Procurement Centre</span>
          <span>&rarr;</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-6 shadow-2xs">
            <h2 className="text-lg font-bold text-green-900 mb-2">Ready to sell your harvest?</h2>
            <p className="text-sm text-green-800 mb-5 leading-relaxed">
              Find a nearby procurement centre, check their daily crop capacity, and book a confirmed slot. Avoid long waiting times by booking in advance.
            </p>
            <div className="flex gap-3">
              <Link
                href="/farmer/procurement/centres"
                className="px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white font-bold text-sm rounded-xl shadow-xs transition-all"
              >
                Book a Slot
              </Link>
              <Link
                href="/farmer/procurement/bookings"
                className="px-5 py-2.5 bg-white border border-green-200 hover:border-green-300 text-green-800 font-bold text-sm rounded-xl shadow-2xs transition-all"
              >
                My Bookings
              </Link>
            </div>
          </div>

          {/* Active Bookings Summary */}
          {activeBookings.length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 space-y-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                <OrdersIcon className="w-5 h-5 text-green-700" />
                <span>Upcoming Bookings ({activeBookings.length})</span>
              </h3>
              <div className="space-y-3">
                {activeBookings.slice(0, 3).map(booking => (
                  <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100 gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-900">{booking.cropName}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 uppercase tracking-wide">
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 font-medium">{booking.centreName}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {formatUTCDate(booking.slotDate, "EEE, MMM d")} &bull; {booking.slotStartTime} - {booking.slotEndTime}
                      </p>
                    </div>
                    <Link
                      href={`/farmer/procurement/bookings/${booking.id}`}
                      className="text-xs font-bold text-green-700 hover:text-green-900 px-3 py-1.5 bg-green-50 rounded-lg text-center"
                    >
                      View Token &rarr;
                    </Link>
                  </div>
                ))}
                {activeBookings.length > 3 && (
                  <Link href="/farmer/procurement/bookings" className="block text-center text-xs font-bold text-green-700 hover:underline pt-2">
                    View all active bookings
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-8 text-center">
              <FarmIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-700">No active procurement bookings.</p>
              <p className="text-xs text-gray-500 mt-1">When you book a slot to sell your crops, it will appear here.</p>
            </div>
          )}
        </div>

        {/* Side Info */}
        <div className="space-y-4">
          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-blue-900 mb-2">How it works</h3>
            <ol className="space-y-3 text-xs text-blue-800 relative pl-4">
              <li className="list-decimal pl-1">Select a procurement centre near you.</li>
              <li className="list-decimal pl-1">Choose your crop and expected quantity.</li>
              <li className="list-decimal pl-1">Pick an available date and time slot.</li>
              <li className="list-decimal pl-1">Get your unique token and arrive on time.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
