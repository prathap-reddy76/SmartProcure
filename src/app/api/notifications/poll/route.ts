import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Secure HTTP polling endpoint for notifications.
 * Strictly verifies the authenticated user session.
 * Never accesses or returns another user's notifications.
 */
export async function GET(req: Request) {
  try {
    let session = null;
    try {
      session = await auth();
    } catch {
      session = null;
    }

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const url = new URL(req.url);
    const sinceParam = url.searchParams.get("since");
    const unreadOnly = url.searchParams.get("unreadOnly") === "true";
    const limitParam = parseInt(url.searchParams.get("limit") || "10", 10);
    const limit = Math.min(Math.max(1, isNaN(limitParam) ? 10 : limitParam), 50);

    // Build the query where clause - strictly scoped to userId
    const where: {
      userId: string;
      isRead?: boolean;
      createdAt?: { gt: Date };
    } = {
      userId,
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    if (sinceParam) {
      const sinceDate = new Date(sinceParam);
      if (!isNaN(sinceDate.getTime())) {
        where.createdAt = { gt: sinceDate };
      }
    }

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        entityType: true,
        entityId: true,
        targetUrl: true,
        isRead: true,
        readAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      count: unreadCount,
      notifications,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in /api/notifications/poll:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
