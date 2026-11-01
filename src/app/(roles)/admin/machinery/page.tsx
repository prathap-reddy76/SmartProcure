import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import { getAdminMachineryListings } from "@/actions/machinery/machinery-actions";
import { AdminMachineryClient } from "./admin-machinery-client";

export default async function AdminMachineryPage() {
  await requireRole("ADMIN");

  const result = await getAdminMachineryListings();
  const listings = result.success ? result.listings : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/admin/dashboard" className="hover:text-emerald-700">
          Admin
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Machinery Marketplace Oversight</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Machinery Marketplace Oversight
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Review equipment listings submitted by machinery partners, grant platform approval, and audit rental operations.
          </p>
        </div>
      </div>

      <AdminMachineryClient initialListings={listings} />
    </div>
  );
}
