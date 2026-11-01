import { prisma } from "@/lib/prisma";
import { getAnalyticsDateRange, buildDateFilter, serializeDecimal, AnalyticsPeriod } from "./core";

export async function getFarmerAnalytics(
  period: AnalyticsPeriod,
  farmerId: string,
  customFrom?: string,
  customTo?: string
) {
  const dateRange = getAnalyticsDateRange(period, customFrom, customTo);
  const dateFilter = buildDateFilter(dateRange);

  const baseWhere = dateFilter ? { createdAt: dateFilter } : {};

  // 1. My Marketplace (Orders placed by this farmer)
  const orders = await prisma.order.aggregate({
    _count: { id: true },
    _sum: { totalAmount: true },
    where: {
      userId: farmerId,
      ...baseWhere,
      status: { notIn: ["CANCELLED"] }
    }
  });

  // 2. My Procurement (Crops sold)
  const procurement = await prisma.procurementPayment.aggregate({
    _count: { id: true },
    _sum: { netPayableAmount: true, eligibleQuantityKg: true },
    where: {
      farmerId: farmerId,
      ...baseWhere,
      paymentStatus: "PAID"
    }
  });

  // 3. My Machinery (Rentals booked)
  const machinery = await prisma.machineryBooking.aggregate({
    _count: { id: true },
    _sum: { totalAmount: true },
    where: {
      farmerId: farmerId,
      ...baseWhere,
      status: { notIn: ["CANCELLED", "OWNER_REJECTED", "EXPIRED"] }
    }
  });

  // 4. Procurement vs Market Price Demo (Demo data)
  // Get recent procurement for this farmer
  const recentProcurements = await prisma.procurementPayment.findMany({
    where: {
      farmerId: farmerId,
      ...baseWhere,
      paymentStatus: "PAID"
    },
    include: {
      crop: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  });

  const priceComparisons = await Promise.all(recentProcurements.map(async (p) => {
    // Find the latest market price for this crop around the payment date
    const marketPrice = await prisma.marketCropPrice.findFirst({
      where: {
        cropId: p.cropId,
        priceDate: { lte: p.createdAt }
      },
      orderBy: {
        priceDate: 'desc'
      }
    });

    const procurementPricePerKg = serializeDecimal(p.pricePerKg);
    const procurementPricePerQuintal = procurementPricePerKg * 100;
    
    // Default to some demo fallback if no market price found (explicitly labeled as DEMO)
    const demoMarketPrice = marketPrice ? serializeDecimal(marketPrice.modalPrice) : (procurementPricePerQuintal * 0.95);

    return {
      cropName: p.crop.name,
      date: p.createdAt,
      procurementPricePerQuintal,
      marketPricePerQuintal: demoMarketPrice,
      isDemoData: !marketPrice
    };
  }));

  return {
    marketplace: {
      ordersCount: orders._count.id,
      spent: serializeDecimal(orders._sum.totalAmount)
    },
    procurement: {
      salesCount: procurement._count.id,
      earned: serializeDecimal(procurement._sum.netPayableAmount),
      volumeKg: serializeDecimal(procurement._sum.eligibleQuantityKg)
    },
    machinery: {
      rentalsCount: machinery._count.id,
      spent: serializeDecimal(machinery._sum.totalAmount)
    },
    priceComparisons
  };
}
