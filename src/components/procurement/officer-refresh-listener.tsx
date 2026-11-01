"use client";

import { useRouter } from "next/navigation";
import { useNotificationStream } from "@/hooks/use-notification-stream";

export function OfficerRefreshListener({ centreId }: { centreId: string }) {
  const router = useRouter();

  useNotificationStream({
    onNewNotification: (notification) => {
      // If the notification belongs to procurement and this centre, refresh the page state
      if (notification.category === "procurement" || notification.type.startsWith("PROCUREMENT_")) {
        // We refresh if the event is globally relevant to the centre (or specifically targeting it)
        router.refresh();
      }
    }
  });

  return null;
}
