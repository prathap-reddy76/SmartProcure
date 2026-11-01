"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getUnreadNotificationCount } from "@/actions/notifications/notification-actions";
import { RealtimeNotificationEvent } from "@/lib/notification-events";

interface UseNotificationStreamOptions {
  initialCount?: number;
  onNewNotification?: (notification: RealtimeNotificationEvent) => void;
  pollingIntervalMs?: number;
}

export function useNotificationStream({
  initialCount = 0,
  onNewNotification,
  pollingIntervalMs = 8000,
}: UseNotificationStreamOptions = {}) {
  const [unreadCount, setUnreadCount] = useState(initialCount);
  const [isConnected, setIsConnected] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  // Keep track of received notification IDs to prevent duplicate toasts / count increments
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const onNewNotificationRef = useRef(onNewNotification);
  useEffect(() => {
    onNewNotificationRef.current = onNewNotification;
  }, [onNewNotification]);

  // Sync count from server
  const refreshCount = useCallback(async () => {
    try {
      const res = await getUnreadNotificationCount();
      if (res.success) {
        setUnreadCount(res.count);
      }
    } catch (err) {
      console.warn("Failed to fetch unread notification count:", err);
    }
  }, []);

  // Multi-tab synchronization via BroadcastChannel
  useEffect(() => {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        const channel = new BroadcastChannel("smartprocure_notifications");
        broadcastChannelRef.current = channel;

        channel.onmessage = (event) => {
          if (event.data?.type === "COUNT_UPDATED" && typeof event.data.count === "number") {
            setUnreadCount(event.data.count);
          } else if (event.data?.type === "NOTIFICATION_READ") {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          } else if (event.data?.type === "ALL_READ") {
            setUnreadCount(0);
          }
        };

        return () => {
          channel.close();
          broadcastChannelRef.current = null;
        };
      } catch {
        // BroadcastChannel might not be supported in some environments
      }
    }
  }, []);

  const broadcastCountUpdate = useCallback((newCount: number) => {
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({
          type: "COUNT_UPDATED",
          count: newCount,
        });
      } catch {}
    }
  }, []);

  // Start / stop fallback polling
  const startPolling = useCallback(() => {
    if (pollingTimerRef.current) return;
    setIsUsingFallback(true);
    pollingTimerRef.current = setInterval(() => {
      refreshCount();
    }, pollingIntervalMs);
  }, [pollingIntervalMs, refreshCount]);

  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    setIsUsingFallback(false);
  }, []);

  // Primary SSE connection lifecycle
  useEffect(() => {
    let isMounted = true;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    // Fetch initial count asynchronously
    getUnreadNotificationCount().then((res) => {
      if (isMounted && res.success) {
        setUnreadCount(res.count);
      }
    });

    function connectSSE() {
      if (!isMounted) return;

      try {
        const es = new EventSource("/api/notifications/stream");
        eventSourceRef.current = es;

        es.addEventListener("connected", () => {
          if (!isMounted) return;
          setIsConnected(true);
          stopPolling();
        });

        es.addEventListener("notification", (e: MessageEvent) => {
          if (!isMounted) return;
          try {
            const data: RealtimeNotificationEvent = JSON.parse(e.data);
            if (!data || !data.notificationId) return;

            // Deduplication: do not process same notification twice
            if (seenNotificationIdsRef.current.has(data.notificationId)) {
              return;
            }
            seenNotificationIdsRef.current.add(data.notificationId);

            // Increment unread count
            setUnreadCount((prev) => {
              const next = prev + 1;
              broadcastCountUpdate(next);
              return next;
            });

            // Trigger callback (for toasts, dropdown update, sound)
            if (onNewNotificationRef.current) {
              onNewNotificationRef.current(data);
            }
          } catch (err) {
            console.error("Error parsing notification SSE event:", err);
          }
        });

        es.onerror = () => {
          if (!isMounted) return;
          setIsConnected(false);
          es.close();
          eventSourceRef.current = null;

          // Switch to polling fallback while disconnected
          startPolling();

          // Attempt reconnect after 5 seconds
          reconnectTimeout = setTimeout(() => {
            if (isMounted) {
              connectSSE();
            }
          }, 5000);
        };
      } catch {
        // Fall back to polling if EventSource fails to construct
        startPolling();
      }
    }

    connectSSE();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      stopPolling();
    };
  }, [broadcastCountUpdate, refreshCount, startPolling, stopPolling]);

  return {
    unreadCount,
    setUnreadCount,
    isConnected,
    isUsingFallback,
    refreshCount,
  };
}
