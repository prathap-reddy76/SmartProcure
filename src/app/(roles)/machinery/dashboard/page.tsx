import React from "react";
import Link from "next/link";
import { getOwnerMachineryListings } from "@/actions/machinery/machinery-actions";
import { getOwnerRentalBookings } from "@/actions/machinery/booking-actions";

export default async function MachineryDashboardPage() {
  const [machineryRes, bookingsRes] = await Promise.all([
    getOwnerMachineryListings(),
    getOwnerRentalBookings(),
  ]);

  const listings = machineryRes.success ? machineryRes.listings : [];
  const bookings = bookingsRes.success ? bookingsRes.bookings : [];

  const totalListings = listings.length;
  const availableListings = listings.filter((m) => m.isAvailable && m.isApproved).length;
  const pendingRequests = bookings.filter((b) => b.status === "PENDING").length;
  const activeRentals = bookings.filter((b) => b.status === "ACTIVE").length;
  const completedRentals = bookings.filter((b) => b.status === "COMPLETED");
  const totalRevenue = completedRentals.reduce((sum, b) => sum + b.totalAmount, 0);

  const recentBookings = bookings.slice(0, 5);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Machinery Fleet Dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your equipment rentals, approve incoming bookings, and monitor field operations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/machinery/my-machinery/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <span>+ Add Machinery</span>
          </Link>
          <Link
            href="/machinery/bookings"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <span>View All Bookings</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
            Fleet Size
          </span>
          <div className="text-2xl font-black text-gray-900 mt-2">{totalListings}</div>
          <span className="text-xs text-gray-500 mt-1 block">Listed equipment</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 block">
            Available Now
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-2">{availableListings}</div>
          <span className="text-xs text-emerald-600 mt-1 block">Ready for rent</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 block">
            Pending Requests
          </span>
          <div className="text-2xl font-black text-amber-700 mt-2">{pendingRequests}</div>
          <span className="text-xs text-amber-600 mt-1 block">Requires approval</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 block">
            Active Rentals
          </span>
          <div className="text-2xl font-black text-blue-700 mt-2">{activeRentals}</div>
          <span className="text-xs text-blue-600 mt-1 block">Currently on field</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
            Total Revenue
          </span>
          <div className="text-2xl font-black text-gray-900 mt-2">
            ₹{totalRevenue.toFixed(0)}
          </div>
          <span className="text-xs text-gray-500 mt-1 block">
            {completedRentals.length} completed rentals
          </span>
        </div>
      </div>

      {/* Pending Requests Alert Banner */}
      {pendingRequests > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                You have {pendingRequests} pending rental request{pendingRequests > 1 ? "s" : ""}
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Farmers are waiting for your approval to confirm their rental slots.
              </p>
            </div>
          </div>
          <Link
            href="/machinery/bookings"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            Review Requests →
          </Link>
        </div>
      )}

      {/* Two Column Section: Fleet Overview & Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Recent Rental Activity</h2>
            <Link
              href="/machinery/bookings"
              className="text-xs font-semibold text-amber-700 hover:text-amber-800"
            >
              View All ({bookings.length})
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs">
              No rental bookings have been placed for your machinery fleet yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentBookings.map((b) => (
                <div key={b.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-gray-500">
                        #{b.bookingNumber}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          b.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : b.status === "OWNER_APPROVED"
                            ? "bg-blue-100 text-blue-800"
                            : b.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : b.status === "COMPLETED"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {b.machinery.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Farmer: <span className="font-medium text-gray-700">{b.farmer.name}</span> •{" "}
                      {new Date(b.startDateTime).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-gray-900">
                      ₹{b.totalAmount.toFixed(2)}
                    </div>
                    <Link
                      href="/machinery/bookings"
                      className="text-xs text-amber-700 hover:underline font-medium"
                    >
                      Manage →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Machinery Fleet Summary (1 Col) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Your Fleet</h2>
            <Link
              href="/machinery/my-machinery"
              className="text-xs font-semibold text-amber-700 hover:text-amber-800"
            >
              Manage Fleet
            </Link>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-xs space-y-3">
              <p>You haven't added any machinery listings yet.</p>
              <Link
                href="/machinery/my-machinery/new"
                className="inline-block px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold"
              >
                + Add First Machine
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.slice(0, 4).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div className="min-w-0 pr-2">
                    <h4 className="text-xs font-bold text-gray-900 truncate">{m.name}</h4>
                    <p className="text-[11px] text-gray-500">
                      {m.brand} • {m.categoryName}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      m.isAvailable
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {m.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
