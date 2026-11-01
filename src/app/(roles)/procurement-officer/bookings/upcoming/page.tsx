import React from "react";
import Link from "next/link";
import { getOfficerUpcomingBookings } from "@/actions/procurement/officer-actions";

export default async function OfficerUpcomingBookingsPage(props: { searchParams?: Promise<{ page?: string }> }) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const page = Number(searchParams.page) || 1;
  const limit = 20;

  const data = await getOfficerUpcomingBookings(page, limit);

  if (data.error) {
    return (
      <div className="bg-red-50 text-red-800 p-6 rounded-2xl border border-red-200">
        <h2 className="font-bold text-lg mb-2">Error</h2>
        <p className="text-sm">{data.error}</p>
      </div>
    );
  }

  const { bookings, pagination } = data;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <nav className="text-xs text-gray-500 flex items-center gap-1.5 mb-2">
        <Link href="/procurement-officer/dashboard" className="hover:text-green-700">Dashboard</Link>
        <span>&rsaquo;</span>
        <span className="text-gray-800 font-bold">Upcoming Bookings</span>
      </nav>

      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Upcoming Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">Scheduled procurement for future dates</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bookings && bookings.length > 0 ? (
          bookings.map((b: any) => {
            const d = new Date(b.date);
            const formattedDate = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            
            return (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 hover:border-green-300 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                      #{b.bookingNumber}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-blue-100 text-blue-800">
                      {b.status}
                    </span>
                  </div>
                  
                  <div className="space-y-1 mb-4">
                    <p className="text-sm text-gray-500">Farmer</p>
                    <p className="font-bold text-gray-900">{b.farmerName}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Crop</p>
                      <p className="text-sm font-bold text-gray-900">{b.cropName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Quantity</p>
                      <p className="text-sm font-bold text-gray-900">{b.expectedQuantity} q</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4">
                    <p className="text-xs text-gray-500 mb-1">Scheduled Slot</p>
                    <p className="text-sm font-bold text-gray-900">{formattedDate}</p>
                    <p className="text-xs font-semibold text-gray-600">{b.startTime} - {b.endTime}</p>
                  </div>
                </div>

                <Link
                  href={`/procurement-officer/bookings/${b.id}`}
                  className="w-full text-center py-2.5 bg-white border border-green-200 text-green-700 hover:bg-green-50 font-bold rounded-xl text-sm transition-colors block"
                >
                  View Details
                </Link>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-gray-500 font-medium">No upcoming bookings found.</p>
          </div>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          {pagination.page > 1 && (
            <Link 
              href={`/procurement-officer/bookings/upcoming?page=${pagination.page - 1}`}
              className="px-4 py-2 border rounded-lg text-sm font-bold hover:bg-gray-50"
            >
              Previous
            </Link>
          )}
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          {pagination.page < pagination.totalPages && (
            <Link 
              href={`/procurement-officer/bookings/upcoming?page=${pagination.page + 1}`}
              className="px-4 py-2 border rounded-lg text-sm font-bold hover:bg-gray-50"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
