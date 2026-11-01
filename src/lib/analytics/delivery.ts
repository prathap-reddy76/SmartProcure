import { prisma } from "@/lib/prisma";
import { getAnalyticsDateRange, buildDateFilter, AnalyticsPeriod } from "./core";

export async function getDeliveryAnalytics(
  period: AnalyticsPeriod,
  customFrom?: string,
  customTo?: string,
  deliveryPartnerId?: string
) {
  const dateRange = getAnalyticsDateRange(period, customFrom, customTo);
  const dateFilter = buildDateFilter(dateRange);

  const baseWhere: any = {};
  if (dateFilter) baseWhere.createdAt = dateFilter;
  if (deliveryPartnerId) baseWhere.deliveryPartnerId = deliveryPartnerId;

  // 1. Status Breakdown
  const totalAssignments = await prisma.deliveryAssignment.count({ where: baseWhere });
  
  const statusBreakdownRaw = await prisma.deliveryAssignment.groupBy({
    by: ['status'],
    _count: { id: true },
    where: baseWhere
  });

  const statusBreakdown = statusBreakdownRaw.map(s => ({
    status: s.status,
    count: s._count.id
  }));

  // 2. Delivery Types
  const typeBreakdownRaw = await prisma.deliveryAssignment.groupBy({
    by: ['deliveryType'],
    _count: { id: true },
    where: baseWhere
  });

  const typeBreakdown = typeBreakdownRaw.map(t => ({
    type: t.deliveryType,
    count: t._count.id
  }));

  // 3. Performance / Partner Breakdown (Only if admin, i.e. deliveryPartnerId not provided)
  let partnerBreakdown: any[] = [];
  if (!deliveryPartnerId) {
    const partnerBreakdownRaw = await prisma.deliveryAssignment.groupBy({
      by: ['deliveryPartnerId'],
      _count: { id: true },
      where: {
        ...baseWhere,
        deliveryPartnerId: { not: null },
        status: "DELIVERED"
      },
      orderBy: {
        _count: { id: 'desc' }
      },
      take: 10
    });

    const partnerIds = partnerBreakdownRaw.map(p => p.deliveryPartnerId as string);
    const partners = await prisma.deliveryPartner.findMany({
      where: { id: { in: partnerIds } },
      include: { user: { select: { name: true } } }
    });
    const partnerMap = new Map(partners.map(p => [p.id, p.user.name || "Unknown"]));

    partnerBreakdown = partnerBreakdownRaw.map(p => ({
      partnerId: p.deliveryPartnerId,
      partnerName: partnerMap.get(p.deliveryPartnerId as string) || "Unknown",
      deliveries: p._count.id
    }));
  }

  return {
    overview: {
      totalAssignments
    },
    statusBreakdown,
    typeBreakdown,
    partnerBreakdown
  };
}
