"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CentreModal, CentreItem } from "./centre-modal";
import { toggleAdminProcurementCentreStatusSafe } from "@/actions/admin/centre-actions";
import { getDirectionsUrl } from "@/lib/distance";
import Link from "next/link";

interface AdminCentresClientProps {
  initialCentres: (CentreItem & {
    _count: {
      supportedCrops: number;
      slots: number;
      bookings: number;
      officers: number;
    };
  })[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  initialSearch: string;
  initialFilter: string;
}

export function AdminCentresClient({ initialCentres, pagination, initialSearch, initialFilter }: AdminCentresClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [filter, setFilter] = useState(initialFilter);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCentre, setEditingCentre] = useState<CentreItem | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyFilters = (newSearch: string, newFilter: string) => {
    const params = new URLSearchParams();
    if (newSearch) params.set("search", newSearch);
    if (newFilter !== "ALL") params.set("filter", newFilter);
    router.push(`/admin/procurement-centres?${params.toString()}`);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    if (!currentStatus) {
      if (!confirm("Are you sure you want to ACTIVATE this centre?")) return;
    } else {
      if (!confirm("Are you sure you want to DEACTIVATE this centre? Active bookings may be blocked. Proceed?")) return;
    }
    
    setTogglingId(id);
    setError(null);
    const res = await toggleAdminProcurementCentreStatusSafe(id, !currentStatus);
    if (!res.success) {
      setError(res.error || "Failed to toggle status.");
    } else {
      router.refresh();
    }
    setTogglingId(null);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm font-bold text-red-800">
          {error}
        </div>
      )}
      
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search centres by name, code, or village..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters(search, filter)}
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            applyFilters(search, e.target.value);
          }}
          className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active Only</option>
          <option value="INACTIVE">Inactive Only</option>
          <option value="MAPPED">Mapped (GPS)</option>
          <option value="UNMAPPED">Unmapped (No GPS)</option>
        </select>
        <button
          onClick={() => {
            setEditingCentre(null);
            setModalOpen(true);
          }}
          className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-bold rounded-xl shadow-xs transition-colors"
        >
          + Add New Centre
        </button>
      </div>

      {/* Grid */}
      {initialCentres.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <p className="text-gray-500 text-sm">No centres found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialCentres.map((c) => (
            <div key={c.id} className={`bg-white rounded-2xl border ${c.isActive ? 'border-gray-200' : 'border-gray-200 opacity-75'} overflow-hidden flex flex-col`}>
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 truncate pr-2">
                      <Link href={`/admin/procurement-centres/${c.id}`} className="hover:text-indigo-600 hover:underline">
                        {c.name}
                      </Link>
                    </h3>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{c.code}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                    c.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                  }`}>
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="line-clamp-2 leading-tight">
                      {c.address ? `${c.address}, ${c.village || ''} ${c.mandal || ''}`.replace(/, $/, '') : "Address not configured"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {c.latitude && c.longitude ? (
                      <a 
                        href={getDirectionsUrl(c.latitude, c.longitude)} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1"
                      >
                        {c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </a>
                    ) : (
                      <span className="text-amber-600 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        GPS Not Configured
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100 bg-gray-50/50">
                <div className="p-3 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">Crops</p>
                  <p className="font-bold text-gray-900">{c._count.supportedCrops}</p>
                </div>
                <div className="p-3 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">Slots</p>
                  <p className="font-bold text-gray-900">{c._count.slots}</p>
                </div>
                <div className="p-3 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">Bookings</p>
                  <p className="font-bold text-gray-900">{c._count.bookings}</p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-3 border-t border-gray-100 flex items-center justify-between gap-2 bg-gray-50">
                <Link
                  href={`/admin/procurement-centres/${c.id}`}
                  className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex-1 text-center"
                >
                  Manage Centre &rarr;
                </Link>
                <button
                  onClick={() => {
                    setEditingCentre(c);
                    setModalOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Edit Geo
                </button>
                <button
                  onClick={() => handleToggle(c.id, c.isActive)}
                  disabled={togglingId === c.id}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    togglingId === c.id ? "opacity-50 cursor-not-allowed" : ""
                  } ${
                    c.isActive 
                      ? "text-red-700 bg-red-50 hover:bg-red-100" 
                      : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                  }`}
                >
                  {togglingId === c.id ? "..." : c.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex gap-2">
             <button disabled={pagination.page <= 1} onClick={() => {
                const params = new URLSearchParams();
                if (search) params.set("search", search);
                if (filter !== "ALL") params.set("filter", filter);
                params.set("page", String(pagination.page - 1));
                router.push(`/admin/procurement-centres?${params.toString()}`);
             }} className="px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50">Prev</button>
             <span className="px-4 py-1 text-sm font-bold text-gray-700 bg-gray-100 rounded">{pagination.page} / {pagination.totalPages}</span>
             <button disabled={pagination.page >= pagination.totalPages} onClick={() => {
                const params = new URLSearchParams();
                if (search) params.set("search", search);
                if (filter !== "ALL") params.set("filter", filter);
                params.set("page", String(pagination.page + 1));
                router.push(`/admin/procurement-centres?${params.toString()}`);
             }} className="px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50">Next</button>
          </div>
        </div>
      )}

      {modalOpen && (
        <CentreModal 
          isOpen={modalOpen} 
          onClose={() => {
            setModalOpen(false);
            setEditingCentre(null);
          }} 
          centre={editingCentre} onSuccess={() => router.refresh()} 
        />
      )}
    </div>
  );
}
