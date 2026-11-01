import React from "react";
import { requireAuth } from "@/lib/auth-utils";
import { getUserNotificationPreferences } from "@/actions/notifications/preference-actions";
import { PreferencesClient } from "./preferences-client";

export const metadata = {
  title: "Notification Preferences | SmartProcure",
  description: "Configure your real-time notification alerts, sound, and toasts",
};

export default async function NotificationSettingsPage() {
  await requireAuth();

  const res = await getUserNotificationPreferences();

  return (
    <div className="min-h-screen bg-gray-50/70 p-4 sm:p-6 lg:p-8">
      <PreferencesClient initialPreferences={res.preferences} />
    </div>
  );
}
