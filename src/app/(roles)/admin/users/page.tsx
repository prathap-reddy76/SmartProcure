import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import { getAdminUserStats, getAdminUsers } from "@/actions/admin/admin-user-actions";
import { AdminUsersClient } from "./admin-users-client";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole("ADMIN");

  const qParams = await searchParams;

  const page = typeof qParams.page === "string" ? parseInt(qParams.page, 10) : 1;
  const search = typeof qParams.search === "string" ? qParams.search : undefined;
  const role = typeof qParams.role === "string" ? qParams.role : undefined;
  const activeStatus = typeof qParams.activeStatus === "string" ? qParams.activeStatus : undefined;
  const sortBy = typeof qParams.sortBy === "string" ? (qParams.sortBy as any) : "newest";

  const [statsRes, usersRes] = await Promise.all([
    getAdminUserStats(),
    getAdminUsers({ page, limit: 20, search, role, activeStatus, sortBy }),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User & Role Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor platform accounts, audit roles, and securely manage system access.
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          Add User
        </Link>
      </div>

      <AdminUsersClient 
        initialUsers={usersRes.users || []}
        initialStats={statsRes.stats}
        totalCount={usersRes.totalCount || 0}
        pageCount={usersRes.pageCount || 0}
        currentPage={page}
      />
    </div>
  );
}
