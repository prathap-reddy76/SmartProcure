import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import { getPaginatedAdminProcurementCentres } from "@/actions/admin/centre-actions";
import { AdminCentresClient } from "./centres-client";
import { ProcurementIcon } from "@/components/ui/icons";

export default async function AdminProcurementCentresPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await requireRole("ADMIN");
  
  const resolvedParams = await searchParams;
  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page, 10) : 1;
  const search = typeof resolvedParams.search === 'string' ? resolvedParams.search : "";
  const filter = typeof resolvedParams.filter === 'string' ? resolvedParams.filter : "ALL";

  const { centres, pagination } = await getPaginatedAdminProcurementCentres(page, 25, search, filter);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-gray-500 flex items-center gap-1.5" aria-label="Breadcrumb">
        <Link href="/admin/finance" className="hover:text-indigo-700">Admin</Link>
        <span>&rsaquo;</span>
        <span className="text-gray-800 font-bold">Procurement Centres</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <ProcurementIcon className="w-6 h-6 text-indigo-700" />
            <span>Procurement Centres & Geolocation Management</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure procurement hub coordinates (GPS), operating hours, address details, and active status.
          </p>
        </div>
      </div>

      <AdminCentresClient initialCentres={centres} pagination={pagination} initialSearch={search} initialFilter={filter} />
    </div>
  );
}
