import { prisma } from "@/lib/prisma";
import { getAnalyticsDateRange, buildDateFilter, serializeDecimal, AnalyticsPeriod } from "./core";

export async function getMachineryAnalytics(
  period: AnalyticsPeriod,
  customFrom?: string,
  customTo?: string,
  ownerId?: string
) {
  const dateRange = getAnalyticsDateRange(period, customFrom, customTo);
  const dateFilter = buildDateFilter(dateRange);

  const baseWhere: any = {};
  if (dateFilter) baseWhere.createdAt = dateFilter;
  if (ownerId) baseWhere.ownerId = ownerId;

  // 1. Volume & Count
  const validStatuses = ["CONFIRMED", "READY", "ACTIVE", "COMPLETED"];
  
  const bookingAgg = await prisma.machineryBooking.aggregate({
    _count: { id: true },
    _sum: { totalAmount: true },
    where: {
      ...baseWhere,
      status: { in: validStatuses as unknown[] }
    }
  });

  const totalRevenue = serializeDecimal(bookingAgg._sum.totalAmount);
  const totalBookings = bookingAgg._count.id;

  // 2. Status Breakdown (all statuses)
  const statusBreakdownRaw = await prisma.machineryBooking.groupBy({
    by: ['status'],
    _count: { id: true },
    where: baseWhere
  });

  const statusBreakdown = statusBreakdownRaw.map(s => ({
    status: s.status,
    count: s._count.id
  }));

  // 3. Category Breakdown (using machinery relation)
  // For group by relation, prisma doesn't support grouping directly by relation fields simply.
  // We'll fetch the booked machineries and sum in memory or via machinery query.
  const bookingsForCategory = await prisma.machineryBooking.findMany({
    where: {
      ...baseWhere,
      status: { in: validStatuses as unknown[] }
    },
    select: {
      totalAmount: true,
      machinery: {
        select: {
          category: {
            select: { name: true, id: true }
          }
        }
      }
    }
  });

  const categoryMap = new Map<string, { name: string, volume: number, count: number }>();
  
  bookingsForCategory.forEach(b => {
    const cat = b.machinery.category;
    const amount = serializeDecimal(b.totalAmount);
    if (!categoryMap.has(cat.id)) {
      categoryMap.set(cat.id, { name: cat.name, volume: 0, count: 0 });
    }
    const stat = categoryMap.get(cat.id)!;
    stat.volume += amount;
    stat.count += 1;
  });

  const categoryBreakdown = Array.from(categoryMap.values()).sort((a, b) => b.volume - a.volume);

  return {
    overview: {
      totalRevenue,
      totalBookings
    },
    statusBreakdown,
    categoryBreakdown
  };
}
