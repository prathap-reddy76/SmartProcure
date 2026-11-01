import { prisma } from "@/lib/prisma";
import { getAnalyticsDateRange, buildDateFilter, serializeDecimal, AnalyticsPeriod } from "./core";

export async function getMarketplaceAnalytics(
  period: AnalyticsPeriod,
  customFrom?: string,
  customTo?: string,
  shopId?: string // Important: For shop owners, this MUST be passed and validated beforehand
) {
  const dateRange = getAnalyticsDateRange(period, customFrom, customTo);
  const dateFilter = buildDateFilter(dateRange);

  // Base query for Orders (need to filter by shopId for items if shopId is provided)
  const orderItemWhere: any = {};
  if (dateFilter) orderItemWhere.createdAt = dateFilter;
  if (shopId) orderItemWhere.shopId = shopId;
  orderItemWhere.status = { notIn: ["CANCELLED"] };

  // 1. Sales Volume & Count
  const salesAgg = await prisma.orderItem.aggregate({
    _sum: { lineTotal: true },
    _count: { id: true },
    where: orderItemWhere
  });

  const totalRevenue = serializeDecimal(salesAgg._sum.lineTotal);
  const totalItemsSold = salesAgg._count.id;

  // 2. Top Products
  const topProductsRaw = await prisma.orderItem.groupBy({
    by: ['productId', 'productName'],
    _sum: { lineTotal: true, quantity: true },
    where: orderItemWhere,
    orderBy: {
      _sum: { lineTotal: 'desc' }
    },
    take: 10
  });

  const topProducts = topProductsRaw.map(p => ({
    productId: p.productId,
    productName: p.productName,
    revenue: serializeDecimal(p._sum.lineTotal),
    quantity: p._sum.quantity || 0
  }));

  // 3. Status Breakdown
  const statusBreakdownRaw = await prisma.orderItem.groupBy({
    by: ['status'],
    _count: { id: true },
    where: {
      ...orderItemWhere,
      status: undefined // We want to see cancelled items too in this breakdown
    }
  });

  const statusBreakdown = statusBreakdownRaw.map(s => ({
    status: s.status,
    count: s._count.id
  }));

  return {
    overview: {
      totalRevenue,
      totalItemsSold
    },
    topProducts,
    statusBreakdown
  };
}
