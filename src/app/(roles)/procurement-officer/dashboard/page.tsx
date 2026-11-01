import React from "react";
import Link from "next/link";
import { getOfficerDashboardData } from "@/actions/procurement/officer-actions";
import { ProcurementIcon, OrdersIcon } from "@/components/ui/icons";

export default async function OfficerDashboardPage() {
  const data = await getOfficerDashboardData();

  if (data.error || !data.centre) {
    return (
      <div className="bg-red-50 text-red-800 p-6 rounded-2xl border border-red-200">
        <h2 className="font-bold text-lg mb-2">Configuration Error</h2>
        <p className="text-sm">{data.error}</p>
      </div>
    );
  }

  const { centre, stats, todayBookings } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Procurement Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
            <ProcurementIcon className="w-4 h-4" /> {centre.name} ({centre.code})
          </p>
        </div>
        <Link
          href="/procurement-officer/queue"
          className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-bold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          View Today&apos;s Queue &rarr;
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
        {[
          { label: "Today's", value: stats?.totalBookings, classes: "bg-gray-50 border-gray-100 text-gray-600", valClasses: "text-gray-800" },
          { label: "Arrived", value: stats?.arrived, classes: "bg-blue-50 border-blue-100 text-blue-600", valClasses: "text-blue-800" },
          { label: "Waiting", value: stats?.waiting, classes: "bg-amber-50 border-amber-100 text-amber-600", valClasses: "text-amber-800" },
          { label: "In Prog", value: stats?.inProgress, classes: "bg-indigo-50 border-indigo-100 text-indigo-600", valClasses: "text-indigo-800" },
          { label: "Weighing", value: stats?.weighing, classes: "bg-purple-50 border-purple-100 text-purple-600", valClasses: "text-purple-800" },
          { label: "Quality", value: stats?.quality, classes: "bg-fuchsia-50 border-fuchsia-100 text-fuchsia-600", valClasses: "text-fuchsia-800" },
          { label: "Accepted", value: stats?.accepted, classes: "bg-emerald-50 border-emerald-100 text-emerald-600", valClasses: "text-emerald-800" },
          { label: "Partial", value: stats?.partiallyAccepted, classes: "bg-lime-50 border-lime-100 text-lime-600", valClasses: "text-lime-800" },
          { label: "Rejected", value: stats?.rejected, classes: "bg-red-50 border-red-100 text-red-600", valClasses: "text-red-800" },
        ].map((kpi, idx) => (
          <div key={idx} className={`${kpi.classes} p-4 rounded-2xl border shadow-2xs text-center flex flex-col justify-center`}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1 leading-tight">{kpi.label}</p>
            <p className={`text-2xl font-black ${kpi.valClasses}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Today's Bookings Snapshot */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <OrdersIcon className="w-5 h-5 text-green-700" />
            Today&apos;s Scheduled Slots
          </h2>
        </div>
        <div className="p-5">
          {todayBookings && todayBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                    <th className="pb-3 font-bold">Token</th>
                    <th className="pb-3 font-bold">Farmer</th>
                    <th className="pb-3 font-bold">Time Slot</th>
                    <th className="pb-3 font-bold">Crop / Qty</th>
                    <th className="pb-3 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {todayBookings.slice(0, 10).map(b => (
                    <tr key={b.id} className="hover:bg-gray-50/50">
                      <td className="py-3 font-mono font-bold text-gray-900">{b.tokenNumber}</td>
                      <td className="py-3 font-medium text-gray-800">{b.farmerName}</td>
                      <td className="py-3 text-gray-600">{b.slotStartTime} - {b.slotEndTime}</td>
                      <td className="py-3 text-gray-600">{b.cropName} ({b.expectedQuantity}q)</td>
                      <td className="py-3 text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          b.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800"
                          : b.status === "BOOKED" || b.status === "WAITING" ? "bg-amber-100 text-amber-800"
                          : b.status === "CANCELLED" ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No bookings scheduled for today.</p>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Bookings Snapshot */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 mt-6">
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
          <h2 className="text-lg font-bold text-gray-900">Upcoming Procurement</h2>
          <Link href="/procurement-officer/bookings/upcoming" className="text-sm font-bold text-green-700 hover:text-green-800">
            View All Upcoming &rarr;
          </Link>
        </div>
        
        {data.upcomingSummary && data.upcomingSummary.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.upcomingSummary.map((summary: any, i: number) => {
              const d = new Date(summary.date);
              const today = new Date();
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              
              let title = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
              if (d.toDateString() === tomorrow.toDateString()) {
                title = "Tomorrow";
              }

              return (
                <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                  <p className="text-sm font-bold text-gray-900 mb-1">{title}</p>
                  <p className="text-xs text-gray-600">{summary.count} bookings</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No upcoming bookings scheduled.</p>
        )}
      </div>
    </div>
  );
}
