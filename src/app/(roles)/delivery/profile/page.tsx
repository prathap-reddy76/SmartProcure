import React from "react";
import { getDeliveryPartnerProfile } from "@/actions/delivery/delivery-actions";
import { AvailabilityToggle } from "./availability-toggle";
import { ProfileIcon, TruckIcon, CheckCircleIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function DeliveryProfilePage() {
  const profile = await getDeliveryPartnerProfile();

  if (!profile) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
          <ProfileIcon className="w-4 h-4" />
          <span>Personnel Profile</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Delivery Partner Profile
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Manage your duty availability, registered delivery vehicle information, and partner credentials.
        </p>
      </div>

      {/* Duty Toggle Card */}
      <AvailabilityToggle initialAvailable={profile.isAvailable} />

      {/* Profile Details Card */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center text-xl font-black shrink-0">
            {profile.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{profile.name}</h2>
            <p className="text-xs text-gray-500">{profile.email}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                Verified Driver Partner
              </span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div>
            <span className="text-gray-400 block font-medium">Registered Phone</span>
            <span className="font-bold text-gray-900 text-sm mt-0.5 block">
              {profile.phone || "Not recorded"}
            </span>
          </div>

          <div>
            <span className="text-gray-400 block font-medium">Account Status</span>
            <span
              className={`font-bold text-xs mt-0.5 inline-block px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                profile.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700"
              }`}
            >
              {profile.isActive ? "Active / In Good Standing" : "Suspended"}
            </span>
          </div>

          <div>
            <span className="text-gray-400 block font-medium">Vehicle Category</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <TruckIcon className="w-4 h-4 text-gray-400" />
              <span className="font-bold text-gray-900 text-sm">
                {profile.vehicleType || "Not configured"}
              </span>
            </div>
          </div>

          <div>
            <span className="text-gray-400 block font-medium">Vehicle Registration Number</span>
            <span className="font-mono font-bold text-gray-900 text-sm mt-0.5 block">
              {profile.vehicleNumber || "Not configured"}
            </span>
          </div>
        </div>

        {/* Operating Rules */}
        <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-900 space-y-1">
          <div className="font-bold">Logistics Guidelines:</div>
          <ul className="list-disc list-inside space-y-0.5 text-blue-800 text-[11px]">
            <li>Maximum 3 active deliveries can be claimed concurrently to ensure rapid fulfillment.</li>
            <li>Always collect the 6-digit confirmation code from the customer before completing delivery.</li>
            <li>For Cash on Delivery (COD) orders, collect full exact cash before handing over packages.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
