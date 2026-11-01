import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import { getFarmerProfile } from "@/actions/farmer/profile-actions";
import { EditProfileForm } from "./edit-profile-form";

export default async function EditProfilePage() {
  await requireRole("FARMER");
  const res = await getFarmerProfile();
  const profile = res.profile;

  if (!profile) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-gray-200">
        <p className="text-red-600">Failed to load profile. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Farmer Profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            Update your personal contact details and residential address.
          </p>
        </div>
        <Link
          href="/farmer/profile"
          className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-6 sm:p-8">
        <EditProfileForm initialProfile={profile} />
      </div>
    </div>
  );
}
