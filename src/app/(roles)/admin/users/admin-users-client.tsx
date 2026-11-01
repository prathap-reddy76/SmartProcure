"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminUserSummary, AdminUserStats } from "@/actions/admin/admin-user-actions";
import { Role } from "@prisma/client";

interface Props {
  initialUsers: AdminUserSummary[];
  initialStats: AdminUserStats | null;
  totalCount: number;
  pageCount: number;
  currentPage: number;
}

export function AdminUsersClient({ initialUsers, initialStats, totalCount, pageCount, currentPage }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [role, setRole] = useState(searchParams.get("role") || "");
  const [activeStatus, setActiveStatus] = useState(searchParams.get("activeStatus") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "newest");

  // Debounced Search Apply
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters({ search, role, activeStatus, sortBy, page: 1 });
    }, 500);
    return () => clearTimeout(timer);
  }, [search]); // Only run on search string change (others are manual triggers)

  const applyFilters = (filters: any) => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.role) params.set("role", filters.role);
    if (filters.activeStatus) params.set("activeStatus", filters.activeStatus);
    if (filters.sortBy && filters.sortBy !== "newest") params.set("sortBy", filters.sortBy);
    if (filters.page && filters.page > 1) params.set("page", filters.page.toString());

    router.push(`/admin/users?${params.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    let newFilters = { search, role, activeStatus, sortBy, page: 1 } as any;
    newFilters[key] = value;
    
    if (key === "role") setRole(value);
    if (key === "activeStatus") setActiveStatus(value);
    if (key === "sortBy") setSortBy(value);

    applyFilters(newFilters);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      {initialStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <StatCard label="Total Users" value={initialStats.total} color="bg-gray-50 text-gray-900 border-gray-200" />
          <StatCard label="Active" value={initialStats.active} color="bg-emerald-50 text-emerald-900 border-emerald-200" />
          <StatCard label="Farmers" value={initialStats.farmers} color="bg-blue-50 text-blue-900 border-blue-200" />
          <StatCard label="Shop Owners" value={initialStats.shopOwners} color="bg-amber-50 text-amber-900 border-amber-200" />
          <StatCard label="Delivery" value={initialStats.deliveryPartners} color="bg-indigo-50 text-indigo-900 border-indigo-200" />
          <StatCard label="Machinery" value={initialStats.machineryOwners} color="bg-purple-50 text-purple-900 border-purple-200" />
          <StatCard label="Officers" value={initialStats.procurementOfficers} color="bg-pink-50 text-pink-900 border-pink-200" />
          <StatCard label="Admins" value={initialStats.admins} color="bg-red-50 text-red-900 border-red-200" />
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200/90 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-2">
          <input
            type="text"
            placeholder="Search name, email, phone..."
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <select value={role} onChange={(e) => handleFilterChange("role", e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg bg-white">
            <option value="">All Roles</option>
            <option value="FARMER">Farmer</option>
            <option value="SHOP_OWNER">Shop Owner</option>
            <option value="DELIVERY_PARTNER">Delivery Partner</option>
            <option value="MACHINERY_OWNER">Machinery Owner</option>
            <option value="PROCUREMENT_OFFICER">Procurement Officer</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div>
          <select value={activeStatus} onChange={(e) => handleFilterChange("activeStatus", e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg bg-white">
            <option value="">Status (All)</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive / Suspended</option>
          </select>
        </div>
        <div>
          <select value={sortBy} onChange={(e) => handleFilterChange("sortBy", e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg bg-white">
            <option value="newest">Newest Registered</option>
            <option value="oldest">Oldest Registered</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="email_asc">Email (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-left">Registered</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {initialUsers.length > 0 ? (
                initialUsers.map((user) => (
                  <tr key={user.id} className={`hover:bg-gray-50/80 transition-colors ${!user.isActive ? 'bg-gray-50/50' : ''}`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`font-bold ${!user.isActive ? 'text-gray-500' : 'text-gray-900'}`}>{user.name || "Unknown User"}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                      {user.phone && <div className="text-xs text-gray-400">{user.phone}</div>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {user.isActive ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider bg-emerald-100 text-emerald-800 border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider bg-gray-100 text-gray-600 border-gray-300">
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <Link 
                        href={`/admin/users/${user.id}`}
                        className="inline-flex items-center justify-center px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded shadow hover:bg-gray-800 transition-colors"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                    <div className="max-w-md mx-auto">
                      <h3 className="text-base font-bold text-gray-900 mb-1">No Users Found</h3>
                      <p className="text-xs text-gray-500">Try adjusting your filters or search term to find what you're looking for.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pageCount > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Showing <span className="font-bold text-gray-900">{initialUsers.length}</span> of <span className="font-bold text-gray-900">{totalCount}</span> users
            </span>
            <div className="flex gap-2">
              <button 
                disabled={currentPage <= 1}
                onClick={() => applyFilters({ search, role, activeStatus, sortBy, page: currentPage - 1 })}
                className="px-3 py-1 border border-gray-300 rounded text-sm bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button 
                disabled={currentPage >= pageCount}
                onClick={() => applyFilters({ search, role, activeStatus, sortBy, page: currentPage + 1 })}
                className="px-3 py-1 border border-gray-300 rounded text-sm bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className={`p-3 rounded-xl border ${color} flex flex-col justify-between`}>
      <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{label}</span>
      <span className="text-xl font-black mt-1">{value}</span>
    </div>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const getRoleColors = (r: string) => {
    switch (r) {
      case "ADMIN": return "bg-red-100 text-red-800 border-red-200";
      case "SHOP_OWNER": return "bg-amber-100 text-amber-800 border-amber-200";
      case "FARMER": return "bg-blue-100 text-blue-800 border-blue-200";
      case "DELIVERY_PARTNER": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "MACHINERY_OWNER": return "bg-purple-100 text-purple-800 border-purple-200";
      case "PROCUREMENT_OFFICER": return "bg-pink-100 text-pink-800 border-pink-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getRoleColors(role)}`}>
      {role.replace(/_/g, " ")}
    </span>
  );
}
