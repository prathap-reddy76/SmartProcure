import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-utils";
import { getAdminUserDetail } from "@/actions/admin/admin-user-actions";
import { AdminUserDetailClient } from "./admin-user-detail-client";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await requireRole("ADMIN");
  const resolvedParams = await params;

  const { user, error } = await getAdminUserDetail(resolvedParams.userId);

  if (error || !user) {
    notFound();
  }

  // Determine if this is the currently logged in admin trying to view themselves
  const isSelf = session.user?.id === user.id;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link href="/admin/users" className="text-xs font-bold text-gray-500 hover:text-gray-900">&larr; Back to Users</Link>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            User Profile <span className="font-mono text-gray-500 text-sm">#{user.id.slice(-8)}</span>
          </h1>
        </div>
      </div>

      <AdminUserDetailClient user={user} isSelf={isSelf} />
    </div>
  );
}
