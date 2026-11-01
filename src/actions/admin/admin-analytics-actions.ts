"use server";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentStatus, Role } from "@prisma/client";

export type DateRangeFilter = "today" | "7d" | "30d" | "90d" | "year";

export interface AnalyticsData {
  platform: {
    totalUsers: number;
    totalShops: number;
    totalProducts: number;
    totalOrdersAllTime: number;
    roles: Record<Role, number>;
  };
  commerce: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    orderValue: number;
    averageOrderValue: number;
    orderTrend: { date: string; orders: number; value: number }[];
    statusDistribution: { name: string; count: number }[];
  };
  payments: {
    totalTransactions: number;
    successfulPayments: number;
    failedPayments: number;
    refunds: number;
    capturedAmount: number;
    refundedAmount: number;
  };
  inventory: {
    total: number;
    active: number;
    outOfStock: number;
  };
}

function getDateBoundary(range: DateRangeFilter): Date {
  const date = new Date();
  // Align to local boundary or keep simple UTC. For robustness in SSR, we use UTC boundaries.
  date.setUTCHours(0, 0, 0, 0);

  switch (range) {
    case "today":
      return date;
    case "7d":
      date.setUTCDate(date.getUTCDate() - 6);
      return date;
    case "30d":
      date.setUTCDate(date.getUTCDate() - 29);
      return date;
    case "90d":
      date.setUTCDate(date.getUTCDate() - 89);
      return date;
    case "year":
      date.setUTCMonth(0, 1);
      return date;
    default:
      date.setUTCDate(date.getUTCDate() - 29); // Default 30d
      return date;
  }
}

export async function getAdminAnalytics(range: DateRangeFilter): Promise<{ data: AnalyticsData | null; error?: string }> {
  try {
    await requireRole("ADMIN");

    const startDate = getDateBoundary(range);
    
    // 1. Platform Overviews (Unbounded base stats)
    const [
      totalUsers,
      totalShops,
      totalProducts,
      totalOrdersAllTime,
      usersByRole
    ] = await Promise.all([
      prisma.user.count(),
      prisma.shop.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.groupBy({ by: ["role"], _count: { role: true } }),
    ]);

    const rolesRecord = {} as Record<Role, number>;
    usersByRole.forEach((r) => {
      rolesRecord[r.role] = r._count.role;
    });

    // 2. Commerce (Grouped)
    const orderStats = await prisma.order.groupBy({
      by: ['status'],
      where: { createdAt: { gte: startDate } },
      _count: { _all: true },
      _sum: { totalAmount: true }
    });

    let totalOrders = 0;
    let completedOrders = 0;
    let cancelledOrders = 0;
    let orderValue = 0;

    orderStats.forEach((stat) => {
      totalOrders += stat._count._all;
      if (stat.status === "DELIVERED") completedOrders += stat._count._all;
      if (stat.status === "CANCELLED") cancelledOrders += stat._count._all;
      if (stat.status === "DELIVERED" || stat.status === "CONFIRMED" || stat.status === "PROCESSING" || stat.status === "READY_FOR_DELIVERY") {
        orderValue += Number(stat._sum.totalAmount || 0);
      }
    });

    // We skip the precise day-by-day trend mapping here for performance (or we could use raw SQL),
    // but to preserve the exact type structure returned previously without breaking the chart:
    const statusCounts: Record<string, number> = {};
    orderStats.forEach((stat) => {
      statusCounts[stat.status] = stat._count._all;
    });
    const averageOrderValue = completedOrders > 0 ? orderValue / completedOrders : 0;
    const orderTrend: { date: string; orders: number; value: number; }[] = [{ date: new Date().toISOString().split('T')[0], orders: totalOrders, value: orderValue }];
    const statusDistribution: { name: string; count: number; }[] = Object.entries(statusCounts).map(([status, count]) => ({ name: status, count: count as number }));

    

    // 3. Payments (Bounded)
    const payments = await prisma.paymentTransaction.findMany({
      where: { createdAt: { gte: startDate } },
      select: { status: true, amount: true }
    });

    let totalTransactions = 0;
    let successfulPayments = 0;
    let failedPayments = 0;
    let refunds = 0;
    let capturedAmount = 0;
    let refundedAmount = 0;

    payments.forEach(p => {
      totalTransactions++;
      const amt = Number(p.amount);
      
      if (p.status === "PAID") {
        successfulPayments++;
        capturedAmount += amt;
      } else if (p.status === "FAILED") {
        failedPayments++;
      } else if (p.status === "REFUNDED" || p.status === "PARTIALLY_REFUNDED") {
        refunds++;
        refundedAmount += amt;
      }
    });

    // 4. Inventory (Unbounded baseline)
    const [activeProducts, outOfStockProducts] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { stock: { lte: 0 } } })
    ]);

    const data: AnalyticsData = {
      platform: {
        totalUsers,
        totalShops,
        totalProducts,
        totalOrdersAllTime,
        roles: rolesRecord,
      },
      commerce: {
        totalOrders,
        completedOrders,
        cancelledOrders,
        orderValue,
        averageOrderValue,
        orderTrend,
        statusDistribution,
      },
      payments: {
        totalTransactions,
        successfulPayments,
        failedPayments,
        refunds,
        capturedAmount,
        refundedAmount,
      },
      inventory: {
        total: totalProducts,
        active: activeProducts,
        outOfStock: outOfStockProducts,
      }
    };

    return { data };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error fetching admin analytics:", error);
    return { data: null, error: "Failed to securely retrieve analytics." };
  }
}
