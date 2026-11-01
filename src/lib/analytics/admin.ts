import { prisma } from "@/lib/prisma";
import { getAnalyticsDateRange, buildDateFilter, serializeDecimal, AnalyticsPeriod } from "./core";

export async function getAdminPlatformOverview(period: AnalyticsPeriod, customFrom?: string, customTo?: string) {
  const dateRange = getAnalyticsDateRange(period, customFrom, customTo);
  const dateFilter = buildDateFilter(dateRange);

  const userWhere = dateFilter ? { createdAt: dateFilter } : {};

  // 1. User Growth & Breakdown
  const totalUsers = await prisma.user.count({ where: userWhere });
  
  const roleBreakdownRaw = await prisma.user.groupBy({
    by: ['role'],
    _count: { id: true },
    where: userWhere
  });

  const roleBreakdown = roleBreakdownRaw.map(r => ({
    role: r.role,
    count: r._count.id
  }));

  // 2. Financial & Volume Metrics (Orders)
  const orderWhere = dateFilter ? { createdAt: dateFilter } : {};
  const orderAgg = await prisma.order.aggregate({
    _count: { id: true },
    _sum: { totalAmount: true },
    where: {
      ...orderWhere,
      status: { notIn: ["CANCELLED"] }
    }
  });

  // 3. Procurement Volume
  const procurementWhere = dateFilter ? { createdAt: dateFilter } : {};
  const procurementAgg = await prisma.procurementPayment.aggregate({
    _sum: { netPayableAmount: true, eligibleQuantityKg: true },
    where: {
      ...procurementWhere,
      paymentStatus: "PAID"
    }
  });

  // 4. Machinery Volume
  const machineryWhere = dateFilter ? { createdAt: dateFilter } : {};
  const machineryAgg = await prisma.machineryBooking.aggregate({
    _sum: { totalAmount: true },
    where: {
      ...machineryWhere,
      status: { notIn: ["CANCELLED", "OWNER_REJECTED", "EXPIRED"] }
    }
  });

  return {
    users: {
      total: totalUsers,
      byRole: roleBreakdown
    },
    marketplace: {
      totalOrders: orderAgg._count.id,
      totalVolume: serializeDecimal(orderAgg._sum.totalAmount)
    },
    procurement: {
      totalPaid: serializeDecimal(procurementAgg._sum.netPayableAmount),
      totalKg: serializeDecimal(procurementAgg._sum.eligibleQuantityKg)
    },
    machinery: {
      totalVolume: serializeDecimal(machineryAgg._sum.totalAmount)
    },
    platformRevenue: "Not configured" // Explicitly answering the prompt requirement
  };
}
