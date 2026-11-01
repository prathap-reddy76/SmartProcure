import React from "react";
import Link from "next/link";
import { getOwnerMachineryListings } from "@/actions/machinery/machinery-actions";
import { MyMachineryClient } from "./my-machinery-client";

export default async function MyMachineryPage() {
  const result = await getOwnerMachineryListings();
  const listings = result.success ? result.listings : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/machinery/dashboard" className="hover:text-amber-700">
          Machinery Portal
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">My Machinery Fleet</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            My Machinery Fleet
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your equipment catalog, toggle active rental availability, and monitor booking interest.
          </p>
        </div>

        <Link
          href="/machinery/my-machinery/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <span>+ Add New Machinery</span>
        </Link>
      </div>

      <MyMachineryClient initialListings={listings} />
    </div>
  );
}
