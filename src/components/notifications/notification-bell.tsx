"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getLatestNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/actions/notifications/notification-actions";
import {
  getUserNotificationPreferences,
  UserNotificationPreferences,
} from "@/actions/notifications/preference-actions";
import { useNotificationStream } from "@/hooks/use-notification-stream";
import { NotificationToast } from "@/components/notifications/notification-toast";
import { RealtimeNotificationEvent } from "@/lib/notification-events";
import { BellIcon } from "@/components/ui/icons";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  targetUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

function playSubtleChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Autoplay or audio context may be blocked by browser policy
  }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function getNotificationTypeIcon(type: string) {
  if (type.includes("PAYMENT") || type.includes("RECEIPT")) {
    return (
      <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </span>
    );
  }
  if (type.includes("QUALITY") || type.includes("WEIGHING")) {
    return (
      <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </span>
    );
  }
  if (type.includes("DELIVERY")) {
    return (
      <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h2" />
        </svg>
      </span>
    );
  }
  return (
    <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    </span>
  );
}

export function NotificationBell({
  initialCount = 0,
  accentColor = "green",
}: {
  initialCount?: number;
  accentColor?: "green" | "emerald" | "blue" | "purple" | "indigo";
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeToast, setActiveToast] = useState<RealtimeNotificationEvent | null>(null);
  const [preferences, setPreferences] = useState<UserNotificationPreferences | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load preferences
  useEffect(() => {
    getUserNotificationPreferences().then((res) => {
      if (res.success && res.preferences) {
        setPreferences(res.preferences);
      }
    });
  }, []);

  // Handle incoming real-time notifications from SSE
  const handleNewNotification = useCallback(
    (event: RealtimeNotificationEvent) => {
      // Check user category preferences
      const categoryAllowed =
        !preferences ||
        (event.category === "procurement" && preferences.procurement) ||
        (event.category === "orders" && preferences.orders) ||
        (event.category === "delivery" && preferences.delivery) ||
        (event.category === "system" && preferences.system);

      if (categoryAllowed) {
        // Show real-time toast if enabled
        if (!preferences || preferences.toasts) {
          setActiveToast(event);
        }

        // Play sound if enabled
        if (preferences?.sound) {
          playSubtleChime();
        }
      }

      // Add to latest notifications list if dropdown is open
      setNotifications((prev) => [
        {
          id: event.notificationId,
          type: event.type,
          title: event.title,
          message: event.message,
          targetUrl: event.targetUrl || null,
          isRead: false,
          createdAt: event.createdAt,
        },
        ...prev.slice(0, 5),
      ]);
    },
    [preferences]
  );

  // Real-time SSE stream hook with polling fallback
  const { unreadCount, setUnreadCount, isConnected } = useNotificationStream({
    initialCount,
    onNewNotification: handleNewNotification,
  });

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      setIsLoading(true);
      getLatestNotifications(6).then((res) => {
        if (res.success) {
          setNotifications(res.notifications);
          setUnreadCount(res.unreadCount);
        }
        setIsLoading(false);
      });
    }
  };

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      await markNotificationRead(notification.id);
    }

    setIsOpen(false);
    if (notification.targetUrl) {
      router.push(notification.targetUrl);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await markAllNotificationsRead();
  };

  const ringColorClass =
    accentColor === "emerald"
      ? "focus:ring-emerald-600"
      : accentColor === "blue"
      ? "focus:ring-blue-600"
      : accentColor === "indigo"
      ? "focus:ring-indigo-600"
      : "focus:ring-green-600";

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={handleToggle}
          className={`relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors focus:outline-hidden focus:ring-2 ${ringColorClass}`}
          aria-label={`Notifications (${unreadCount} unread)`}
          aria-expanded={isOpen}
        >
          <BellIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          {/* Real-time live status indicator dot */}
          {isConnected && (
            <span
              className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-500 border border-white ring-1 ring-emerald-300"
              title="Real-time notifications connected"
            />
          )}
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-xs border-2 border-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 sm:right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header */}
            <div className="px-4 py-3.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    {unreadCount} new
                  </span>
                )}
                {isConnected && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">
                    LIVE
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-semibold text-green-700 hover:text-green-800 transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-88 overflow-y-auto divide-y divide-gray-100">
              {isLoading && notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="py-10 px-6 text-center">
                  <div className="w-10 h-10 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-2">
                    <BellIcon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-gray-700">No notifications yet</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    We&apos;ll notify you when something important happens.
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left p-3.5 hover:bg-gray-50/80 transition-colors flex items-start gap-3 cursor-pointer ${
                      !n.isRead ? "bg-green-50/40" : ""
                    }`}
                  >
                    {getNotificationTypeIcon(n.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className={`text-xs truncate ${!n.isRead ? "font-bold text-gray-900" : "font-medium text-gray-800"}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-gray-400 shrink-0 font-mono">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-green-600 mt-1.5 shrink-0" aria-label="Unread" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-green-700 px-4">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="hover:text-green-800 py-1"
              >
                View All &rarr;
              </Link>
              <Link
                href="/settings/notifications"
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-800 py-1 flex items-center gap-1 font-semibold"
              >
                <span>Preferences</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Floating real-time toast */}
      <NotificationToast
        notification={activeToast}
        onClose={() => setActiveToast(null)}
      />
    </>
  );
}
