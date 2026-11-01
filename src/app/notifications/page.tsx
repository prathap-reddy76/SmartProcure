import React from "react";
import { requireAuth } from "@/lib/auth-utils";
import { getNotifications } from "@/actions/notifications/notification-actions";
import { NotificationsListClient } from "./notifications-list-client";
import { SessionUser } from "@/types/auth";

export const metadata = {
  title: "Notification Center | SmartProcure",
  description: "Real-time updates, alerts, and transaction notifications",
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; unread?: string; category?: string }>;
}) {
  const session = await requireAuth();
  const user = session.user as SessionUser;

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const unreadOnly = params.unread === "true";
  const category = (params.category || "all") as
    | "all"
    | "procurement"
    | "orders"
    | "delivery"
    | "system";

  const result = await getNotifications({
    page,
    limit: 15,
    unreadOnly,
    category,
  });

  return (
    <div className="min-h-screen bg-gray-50/70 p-4 sm:p-6 lg:p-8">
      <NotificationsListClient
        initialNotifications={result.notifications}
        initialUnreadCount={result.unreadCount}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        unreadOnly={unreadOnly}
        currentCategory={category}
        userRole={user.role || undefined}
      />
    </div>
  );
}
