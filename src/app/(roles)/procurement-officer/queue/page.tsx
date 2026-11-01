import React from "react";
import { getOfficerDashboardData } from "@/actions/procurement/officer-actions";
import { OrdersIcon } from "@/components/ui/icons";
import OfficerQueueClient from "./officer-queue-client";

export default async function OfficerQueuePage() {
  const data = await getOfficerDashboardData();

  if (data.error || !data.centre) {
    return (
      <div className="bg-red-50 text-red-800 p-6 rounded-2xl border border-red-200">
        <h2 className="font-bold text-lg mb-2">Configuration Error</h2>
        <p className="text-sm">{data.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <OrdersIcon className="w-6 h-6 text-green-700" />
            Live Procurement Queue
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage incoming farmers for today&apos;s slots at {data.centre.name}.
          </p>
        </div>
      </div>

      <OfficerQueueClient centreName={data.centre.name} bookings={data.todayBookings || []} />
    </div>
  );
}
