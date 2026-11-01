"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { SessionUser } from "@/types/auth";
import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Helper to get the authenticated user ID safely for server actions.
 */
async function getAuthenticatedUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session.user as SessionUser;
}

/**
 * Lightweight action for polling: returns unread notification count.
 */
export async function getUnreadNotificationCount(): Promise<{
  success: boolean;
  count: number;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, count: 0 };
    }

    const count = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });

    return { success: true, count };
  } catch (error) {
    console.error("Error retrieving unread notification count:", error);
    return { success: false, count: 0 };
  }
}

/**
 * Returns latest notifications for dropdown menu (default 5-8).
 */
export async function getLatestNotifications(limit = 6): Promise<{
  success: boolean;
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    targetUrl: string | null;
    isRead: boolean;
    createdAt: string;
  }>;
  unreadCount: number;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, notifications: [], unreadCount: 0 };
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          targetUrl: true,
          isRead: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({
        where: {
          userId: user.id,
          isRead: false,
        },
      }),
    ]);

    return {
      success: true,
      notifications: notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    };
  } catch (error) {
    console.error("Error retrieving latest notifications:", error);
    return { success: false, notifications: [], unreadCount: 0 };
  }
}

/**
 * Paginated notification fetch for the Notification Center page (/notifications).
 */
export async function getNotifications({
  page = 1,
  limit = 15,
  unreadOnly = false,
  category = "all",
}: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  category?: "all" | "procurement" | "orders" | "delivery" | "system";
}): Promise<{
  success: boolean;
  notifications: Array<{
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
  }>;
  total: number;
  page: number;
  totalPages: number;
  unreadCount: number;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return {
        success: false,
        notifications: [],
        total: 0,
        page: 1,
        totalPages: 0,
        unreadCount: 0,
      };
    }

    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * limit;

    const whereClause: {
      userId: string;
      isRead?: boolean;
      type?: { in: NotificationType[] };
    } = {
      userId: user.id,
    };

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    if (category === "procurement") {
      whereClause.type = {
        in: [
          "PROCUREMENT_BOOKING_CREATED",
          "PROCUREMENT_TOKEN_ASSIGNED",
          "PROCUREMENT_ARRIVAL",
          "PROCUREMENT_QUEUE_UPDATE",
          "PROCUREMENT_TURN_APPROACHING",
          "PROCUREMENT_WEIGHING_COMPLETED",
          "PROCUREMENT_QUALITY_COMPLETED",
          "PROCUREMENT_PAYMENT_CREATED",
          "PROCUREMENT_PAYMENT_PROCESSING",
          "PROCUREMENT_PAYMENT_PAID",
          "PROCUREMENT_PAYMENT_FAILED",
          "PROCUREMENT_RECEIPT_READY",
          "MARKET_PRICE_ALERT",
        ],
      };
    } else if (category === "orders") {
      whereClause.type = {
        in: [
          "ORDER_CONFIRMED",
          "ORDER_PROCESSING",
          "ORDER_READY_FOR_DELIVERY",
          "ORDER_CANCELLED",
        ],
      };
    } else if (category === "delivery") {
      whereClause.type = {
        in: [
          "DELIVERY_ASSIGNED",
          "DELIVERY_PICKED_UP",
          "DELIVERY_OUT_FOR_DELIVERY",
          "DELIVERY_DELIVERED",
        ],
      };
    } else if (category === "system") {
      whereClause.type = {
        in: ["SYSTEM"],
      };
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: whereClause }),
      prisma.notification.count({
        where: { userId: user.id, isRead: false },
      }),
    ]);

    return {
      success: true,
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        entityType: n.entityType,
        entityId: n.entityId,
        targetUrl: n.targetUrl,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
        readAt: n.readAt ? n.readAt.toISOString() : null,
      })),
      total,
      page: safePage,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    };
  } catch (error) {
    console.error("Error retrieving notifications:", error);
    return {
      success: false,
      notifications: [],
      total: 0,
      page: 1,
      totalPages: 0,
      unreadCount: 0,
    };
  }
}

/**
 * Mark a single notification as read, strictly scoped to current user.
 */
export async function markNotificationRead(notificationId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: user.id, // Strictly scoped to authenticated user
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    revalidatePath("/notifications");
    return { success: result.count > 0 };
  } catch (error) {
    console.error("Error marking notification read:", error);
    return { success: false, error: "Failed to update notification" };
  }
}

/**
 * Mark all notifications as read for the current user.
 */
export async function markAllNotificationsRead(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications read:", error);
    return { success: false, error: "Failed to update notifications" };
  }
}
