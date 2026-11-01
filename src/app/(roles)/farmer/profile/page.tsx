import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import { getFarmerProfile } from "@/actions/farmer/profile-actions";
import { ProfileIcon, CheckCircleIcon } from "@/components/ui/icons";

export default async function FarmerProfilePage() {
  await requireRole("FARMER");
  const res = await getFarmerProfile();
  const profile = res.profile;

  if (!profile) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-gray-200">
        <p className="text-red-600">Failed to load profile. Please refresh or try again.</p>
      </div>
    );
  }

  const formattedDate = new Date(profile.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <ProfileIcon className="w-6 h-6 text-green-700" />
            <span>My Farmer Profile</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your personal contact details, location, and account status.
          </p>
        </div>
        <div>
          <Link
            href="/farmer/profile/edit"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-medium rounded-lg shadow-xs transition-colors"
          >
            Edit Profile
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Personal Details */}
        <div className="md:col-span-2 bg-white rounded-xl border border-gray-200/80 shadow-xs p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-4 border-b pb-2">
              Personal Information
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50/70 p-3.5 rounded-lg border border-gray-100">
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Full Name
                </dt>
                <dd className="mt-1 font-medium text-gray-900 text-base">{profile.name || "—"}</dd>
              </div>

              <div className="bg-gray-50/70 p-3.5 rounded-lg border border-gray-100">
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Email Address
                </dt>
                <dd className="mt-1 font-medium text-gray-900 break-all">{profile.email}</dd>
              </div>

              <div className="bg-gray-50/70 p-3.5 rounded-lg border border-gray-100">
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Phone Number
                </dt>
                <dd className="mt-1 font-medium text-gray-900">{profile.phone || "Not provided"}</dd>
              </div>

              <div className="bg-gray-50/70 p-3.5 rounded-lg border border-gray-100">
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Farmer ID
                </dt>
                <dd className="mt-1 font-mono text-xs text-gray-700 break-all">
                  {profile.profileId || profile.id}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-900 mb-4 border-b pb-2">
              Residential & Farm Location
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50/70 p-3.5 rounded-lg border border-gray-100">
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Village
                </dt>
                <dd className="mt-1 font-medium text-gray-900">{profile.village || "Not specified"}</dd>
              </div>

              <div className="bg-gray-50/70 p-3.5 rounded-lg border border-gray-100">
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  District
                </dt>
                <dd className="mt-1 font-medium text-gray-900">{profile.district || "Not specified"}</dd>
              </div>

              <div className="bg-gray-50/70 p-3.5 rounded-lg border border-gray-100">
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  State
                </dt>
                <dd className="mt-1 font-medium text-gray-900">{profile.state || "Not specified"}</dd>
              </div>

              <div className="bg-gray-50/70 p-3.5 rounded-lg border border-gray-100">
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  PIN Code
                </dt>
                <dd className="mt-1 font-medium text-gray-900">{profile.pincode || "Not specified"}</dd>
              </div>

              <div className="sm:col-span-2 bg-gray-50/70 p-3.5 rounded-lg border border-gray-100">
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Street / Detailed Address
                </dt>
                <dd className="mt-1 font-medium text-gray-900">{profile.address || "Not specified"}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Account Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4 border-b pb-2">
              Account Status
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs text-gray-500 block uppercase font-semibold">User Role</span>
                <span className="inline-block mt-1 px-2.5 py-1 bg-green-100 text-green-800 font-bold text-xs rounded-md">
                  {profile.role}
                </span>
              </div>

              <div>
                <span className="text-xs text-gray-500 block uppercase font-semibold">
                  Status
                </span>
                <span className="inline-flex items-center gap-1.5 mt-1 text-green-700 font-medium">
                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                  Active & Verified
                </span>
              </div>

              <div>
                <span className="text-xs text-gray-500 block uppercase font-semibold">
                  Member Since
                </span>
                <span className="mt-1 font-medium text-gray-800 block">{formattedDate}</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50/80 rounded-xl border border-green-200/60 p-5 text-sm text-green-900">
            <h3 className="font-bold text-green-950 mb-1">Need to update your farm?</h3>
            <p className="text-xs text-green-800 mb-3">
              Keep your farm land acreage and irrigation type updated to receive tailored procurement recommendations.
            </p>
            <Link
              href="/farmer/farm"
              className="text-xs font-semibold text-green-700 hover:text-green-900 underline"
            >
              Go to My Farm &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
