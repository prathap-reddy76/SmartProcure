"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/actions/notifications/notification-actions";
import { BellIcon, CheckCircleIcon } from "@/components/ui/icons";

import { useNotificationStream } from "@/hooks/use-notification-stream";
import { RealtimeNotificationEvent } from "@/lib/notification-events";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  targetUrl: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

interface NotificationsListClientProps {
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
  total: number;
  page: number;
  totalPages: number;
  unreadOnly: boolean;
  currentCategory?: "all" | "procurement" | "orders" | "delivery" | "system";
  userRole?: string;
}

function getNotificationTypeIcon(type: string) {
  if (type.includes("ADMIN") || type.includes("ALERT") || type.includes("ISSUE")) {
    return (
      <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    );
  }
  if (type.includes("PAYMENT") || type.includes("RECEIPT")) {
    return (
      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  }
  if (type.includes("QUALITY") || type.includes("WEIGHING")) {
    return (
      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  }
  if (type.includes("DELIVERY")) {
    return (
      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h2" />
        </svg>
      </div>
    );
  }
  if (type.includes("ORDER")) {
    return (
      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    </div>
  );
}

export function NotificationsListClient({
  initialNotifications,
  initialUnreadCount,
  total,
  page,
  totalPages,
  unreadOnly,
  currentCategory = "all",
  userRole,
}: NotificationsListClientProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isProcessing, setIsProcessing] = useState(false);

  // Hook for real-time incoming notifications
  useNotificationStream({
    initialCount: initialUnreadCount,
    onNewNotification: (event: RealtimeNotificationEvent) => {
      // If matches active category or active category is "all", prepend to list
      const matchesCategory =
        currentCategory === "all" || currentCategory === event.category;
      if (matchesCategory) {
        setNotifications((prev) => [
          {
            id: event.notificationId,
            type: event.type,
            title: event.title,
            message: event.message,
            entityType: event.entityType || null,
            entityId: event.entityId || null,
            targetUrl: event.targetUrl || null,
            isRead: false,
            createdAt: event.createdAt,
            readAt: null,
          },
          ...prev,
        ]);
      }
      setUnreadCount((c) => c + 1);
    },
  });

  const handleMarkRead = async (id: string, targetUrl: string | null) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    await markNotificationRead(id);

    if (targetUrl) {
      router.push(targetUrl);
    }
  };

  const handleMarkAllRead = async () => {
    setIsProcessing(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await markAllNotificationsRead();
    setIsProcessing(false);
    router.refresh();
  };

  const getDashboardUrl = () => {
    switch (userRole) {
      case "FARMER":
        return "/farmer/dashboard";
      case "PROCUREMENT_OFFICER":
      case "PROCUREMENTS_OFFICER":
        return "/procurement-officer/dashboard";
      case "SHOP_OWNER":
        return "/shop/dashboard";
      case "DELIVERY_PARTNER":
        return "/delivery/dashboard";
      case "ADMIN":
        return "/admin/finance";
      default:
        return "/";
    }
  };

  const categoryParam = currentCategory !== "all" ? `&category=${currentCategory}` : "";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={getDashboardUrl()}
              className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
            >
              &larr; Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">
            Notification Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Stay updated with your real-time procurement, orders, and delivery events.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Link
            href="/settings/notifications"
            className="px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <span>⚙️</span>
            <span>Preferences</span>
          </Link>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={isProcessing}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl transition-colors shadow-2xs"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2 overflow-x-auto no-scrollbar">
        <Link
          href="/notifications"
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            !unreadOnly && currentCategory === "all"
              ? "bg-green-700 text-white shadow-2xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          All ({total})
        </Link>
        <Link
          href="/notifications?unread=true"
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            unreadOnly
              ? "bg-green-700 text-white shadow-2xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                unreadOnly
                  ? "bg-white text-green-900"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {unreadCount}
            </span>
          )}
        </Link>
        <Link
          href="/notifications?category=procurement"
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            !unreadOnly && currentCategory === "procurement"
              ? "bg-green-700 text-white shadow-2xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Procurement
        </Link>
        <Link
          href="/notifications?category=orders"
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            !unreadOnly && currentCategory === "orders"
              ? "bg-green-700 text-white shadow-2xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Orders
        </Link>
        <Link
          href="/notifications?category=delivery"
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            !unreadOnly && currentCategory === "delivery"
              ? "bg-green-700 text-white shadow-2xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Delivery
        </Link>
        <Link
          href="/notifications?category=system"
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            !unreadOnly && currentCategory === "system"
              ? "bg-green-700 text-white shadow-2xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          System
        </Link>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs divide-y divide-gray-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
              <BellIcon className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900">No notifications found</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              {unreadOnly
                ? "You have caught up with all your updates. No unread notifications!"
                : "We will notify you when new bookings, weighings, payments, or orders occur."}
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 sm:p-5 transition-colors flex flex-col sm:flex-row sm:items-start gap-4 ${
                !n.isRead ? "bg-green-50/30" : "hover:bg-gray-50/60"
              }`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {getNotificationTypeIcon(n.type)}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`text-sm ${!n.isRead ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
                      {n.title}
                    </h3>
                    {!n.isRead && (
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-black uppercase tracking-wider">
                        New
                      </span>
                    )}
                    <span className="text-xs text-gray-400 font-mono">
                      {new Date(n.createdAt).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {n.message}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkRead(n.id, null)}
                    className="p-2 text-gray-400 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                    title="Mark as read"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Mark read</span>
                  </button>
                )}
                {n.targetUrl && (
                  <button
                    onClick={() => handleMarkRead(n.id, n.targetUrl)}
                    className="px-3.5 py-1.5 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl text-xs transition-colors shadow-2xs flex items-center gap-1"
                  >
                    <span>View</span>
                    <span>&rarr;</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500 pt-2">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/notifications?page=${page - 1}${unreadOnly ? "&unread=true" : ""}${categoryParam}`}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-xs font-bold"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/notifications?page=${page + 1}${unreadOnly ? "&unread=true" : ""}${categoryParam}`}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-xs font-bold"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
