"use client";

import { useRouter } from "next/navigation";
import { useNotificationStream } from "@/hooks/use-notification-stream";

export function AdminRefreshListener() {
  const router = useRouter();

  useNotificationStream({
    onNewNotification: (notification) => {
      // Refresh admin pages if relevant events occur (centres, logistics, finance)
      if (
        notification.category === "procurement" || 
        notification.category === "system" || 
        notification.type.startsWith("PROCUREMENT_")
      ) {
        router.refresh();
      }
    }
  });

  return null;
}
