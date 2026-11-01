"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RealtimeNotificationEvent } from "@/lib/notification-events";

interface NotificationToastProps {
  notification: RealtimeNotificationEvent | null;
  onClose: () => void;
}

export function NotificationToast({
  notification,
  onClose,
}: NotificationToastProps) {
  const router = useRouter();

  useEffect(() => {
    if (!notification) return;

    // Auto-dismiss after 6 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 6000);

    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  const handleAction = () => {
    onClose();
    if (notification.targetUrl) {
      router.push(notification.targetUrl);
    }
  };

  const isProcurement = notification.category === "procurement";
  const isOrders = notification.category === "orders";
  const isDelivery = notification.category === "delivery";

  const badgeColor = isProcurement
    ? "bg-emerald-100 text-emerald-800"
    : isOrders
    ? "bg-indigo-100 text-indigo-800"
    : isDelivery
    ? "bg-purple-100 text-purple-800"
    : "bg-amber-100 text-amber-800";

  return (
    <div
      role="alert"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-sm w-full mx-auto p-4 bg-white rounded-2xl shadow-xl border border-gray-200 transition-all transform animate-in slide-in-from-bottom-5 duration-200 pointer-events-auto"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${badgeColor}`}>
            🔔
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-green-700">
              {notification.category}
            </span>
            <span className="text-[10px] text-gray-400 font-mono">Just now</span>
          </div>
          <h4 className="text-sm font-bold text-gray-900 truncate mt-0.5">
            {notification.title}
          </h4>
          <p className="text-xs text-gray-600 line-clamp-2 mt-1 leading-relaxed">
            {notification.message}
          </p>

          <div className="flex items-center gap-2 mt-3">
            {notification.targetUrl && (
              <button
                onClick={handleAction}
                className="px-3 py-1 bg-green-700 hover:bg-green-800 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs"
              >
                View Details &rarr;
              </button>
            )}
            <button
              onClick={onClose}
              className="px-2.5 py-1 text-gray-500 hover:text-gray-800 text-xs font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
          aria-label="Close notification"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
