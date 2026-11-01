import { prisma } from "@/lib/prisma";
import { getAnalyticsDateRange, buildDateFilter, serializeDecimal, AnalyticsPeriod } from "./core";

export async function getProcurementAnalytics(
  period: AnalyticsPeriod,
  customFrom?: string,
  customTo?: string,
  centreId?: string,
  cropId?: string
) {
  const dateRange = getAnalyticsDateRange(period, customFrom, customTo);
  const dateFilter = buildDateFilter(dateRange);

  const baseWhere: any = {};
  if (dateFilter) baseWhere.createdAt = dateFilter;
  if (centreId) baseWhere.centreId = centreId;
  if (cropId) baseWhere.cropId = cropId;

  // 1. Bookings Overview
  const totalBookings = await prisma.procurementBooking.count({ where: baseWhere });
  const bookingsByStatusRaw = await prisma.procurementBooking.groupBy({
    by: ['status'],
    _count: { id: true },
    where: baseWhere
  });
  const bookingsByStatus = bookingsByStatusRaw.map(b => ({
    status: b.status,
    count: b._count.id
  }));

  // 2. Quality Inspection
  const _qualityWhere = { ...baseWhere };
  // If baseWhere has centreId, we need to join booking for quality, or use bookingId mapping.
  // Actually, ProcurementQualityInspection is related to Booking. We can just query Booking.
  const qualityStatsRaw = await prisma.procurementQualityInspection.groupBy({
    by: ['qualityStatus'],
    _count: { id: true },
    _sum: { acceptedQuantity: true, rejectedQuantity: true },
    where: {
      booking: baseWhere
    }
  });

  const qualityStats = qualityStatsRaw.map(q => ({
    status: q.qualityStatus,
    count: q._count.id,
    acceptedQuantity: serializeDecimal(q._sum.acceptedQuantity),
    rejectedQuantity: serializeDecimal(q._sum.rejectedQuantity)
  }));

  // 3. Crop Breakdown (Paid volume)
  const paymentsByCropRaw = await prisma.procurementPayment.groupBy({
    by: ['cropId'],
    _sum: { netPayableAmount: true, eligibleQuantityKg: true },
    where: {
      ...baseWhere,
      paymentStatus: "PAID"
    }
  });

  // Fetch crop names
  const cropIds = paymentsByCropRaw.map(p => p.cropId);
  const crops = await prisma.crop.findMany({
    where: { id: { in: cropIds } },
    select: { id: true, name: true }
  });
  const cropMap = new Map(crops.map(c => [c.id, c.name]));

  const volumeByCrop = paymentsByCropRaw.map(p => ({
    cropId: p.cropId,
    cropName: cropMap.get(p.cropId) || "Unknown",
    totalAmount: serializeDecimal(p._sum.netPayableAmount),
    totalKg: serializeDecimal(p._sum.eligibleQuantityKg)
  })).sort((a, b) => b.totalAmount - a.totalAmount);

  // 4. Centre Breakdown (if no specific centre selected)
  let volumeByCentre: any[] = [];
  if (!centreId) {
    const paymentsByCentreRaw = await prisma.procurementPayment.groupBy({
      by: ['centreId'],
      _sum: { netPayableAmount: true, eligibleQuantityKg: true },
      where: {
        ...baseWhere,
        paymentStatus: "PAID"
      }
    });

    const centreIds = paymentsByCentreRaw.map(p => p.centreId);
    const centres = await prisma.procurementCentre.findMany({
      where: { id: { in: centreIds } },
      select: { id: true, name: true }
    });
    const centreMap = new Map(centres.map(c => [c.id, c.name]));

    volumeByCentre = paymentsByCentreRaw.map(p => ({
      centreId: p.centreId,
      centreName: centreMap.get(p.centreId) || "Unknown",
      totalAmount: serializeDecimal(p._sum.netPayableAmount),
      totalKg: serializeDecimal(p._sum.eligibleQuantityKg)
    })).sort((a, b) => b.totalAmount - a.totalAmount);
  }

  return {
    overview: {
      totalBookings,
      byStatus: bookingsByStatus
    },
    quality: qualityStats,
    volumeByCrop,
    volumeByCentre
  };
}
