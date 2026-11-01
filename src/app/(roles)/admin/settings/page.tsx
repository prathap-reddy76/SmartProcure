import React from "react";
import { requireRole } from "@/lib/auth-utils";
import { getPlatformSettingsStatus } from "@/actions/admin/admin-settings-actions";
import { AdminSettingsClient } from "./admin-settings-client";
import { notFound } from "next/navigation";

export default async function AdminSettingsPage() {
  await requireRole("ADMIN");

  const { data, error } = await getPlatformSettingsStatus();

  if (error || !data) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Platform Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage safe operational configuration for SmartProcure.
        </p>
      </div>

      <AdminSettingsClient status={data} />
    </div>
  );
}
