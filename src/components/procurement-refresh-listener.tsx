"use client";

import { useRouter } from "next/navigation";
import { useNotificationStream } from "@/hooks/use-notification-stream";

export function ProcurementRefreshListener({ bookingId }: { bookingId: string }) {
  const router = useRouter();

  useNotificationStream({
    onNewNotification: (notification) => {
      if (notification.category === "procurement" || notification.type.startsWith("PROCUREMENT_")) {
        if (notification.entityId === bookingId || notification.targetUrl?.includes(bookingId)) {
          router.refresh();
        }
      }
    }
  });

  return null;
}
