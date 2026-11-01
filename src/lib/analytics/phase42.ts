import { prisma } from "@/lib/prisma";
import { getAnalyticsDateRange, buildDateFilter, serializeDecimal, AnalyticsPeriod } from "./core";
import { PaymentStatus } from "@prisma/client";

export async function getPhase42Analytics(
  period: AnalyticsPeriod,
  customFrom?: string,
  customTo?: string
) {
  const dateRange = getAnalyticsDateRange(period, customFrom, customTo);
  const dateFilter = buildDateFilter(dateRange);

  // 1. Order Trend (Group by Day)
  // Since Prisma groupBy doesn't easily do date truncation across all DBs out-of-the-box,
  // we fetch orders and group in memory. Bounded by date, this is safe and fast.
  const orderWhere = dateFilter ? { createdAt: dateFilter } : {};
  const orders = await prisma.order.findMany({
    where: orderWhere,
    select: { createdAt: true, totalAmount: true }
  });

  const trendMap: Record<string, { orders: number; value: number }> = {};
  orders.forEach((o) => {
    const dateStr = o.createdAt.toISOString().split("T")[0]; // YYYY-MM-DD
    if (!trendMap[dateStr]) trendMap[dateStr] = { orders: 0, value: 0 };
    trendMap[dateStr].orders += 1;
    trendMap[dateStr].value += serializeDecimal(o.totalAmount);
  });

  const orderTrend = Object.keys(trendMap).sort().map(date => ({
    date,
    orders: trendMap[date].orders,
    value: trendMap[date].value
  }));

  // 2. Payment Analytics
  const payments = await prisma.paymentTransaction.findMany({
    where: orderWhere,
    select: { status: true, amount: true }
  });

  let totalTransactions = 0;
  let successfulPayments = 0;
  let failedPayments = 0;
  let pendingPayments = 0;
  let refunds = 0;
  let capturedAmount = 0;
  let refundedAmount = 0;

  payments.forEach((p) => {
    totalTransactions++;
    const amt = serializeDecimal(p.amount);
    
    if (p.status === PaymentStatus.PAID) {
      successfulPayments++;
      capturedAmount += amt;
    } else if (p.status === PaymentStatus.FAILED) {
      failedPayments++;
    } else if (p.status === PaymentStatus.PENDING || p.status === PaymentStatus.CREATED || p.status === PaymentStatus.PROCESSING || p.status === PaymentStatus.AUTHORIZED) {
      pendingPayments++;
    } else if (p.status === PaymentStatus.REFUNDED || p.status === PaymentStatus.PARTIALLY_REFUNDED) {
      refunds++;
      refundedAmount += amt;
    }
  });

  const paymentStats = {
    totalTransactions,
    successfulPayments,
    failedPayments,
    pendingPayments,
    refunds,
    capturedAmount,
    refundedAmount
  };

  const paymentDistribution = [
    { status: "Paid", count: successfulPayments },
    { status: "Failed", count: failedPayments },
    { status: "Pending", count: pendingPayments },
    { status: "Refunded", count: refunds },
  ].filter(d => d.count > 0);

  // 3. Inventory & Marketplace Analytics (Unbounded, reflects current state)
  const [
    totalProducts,
    activeProducts,
    outOfStockProducts,
    productsByType,
    totalShops,
    shopsByType
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { stock: { lte: 0 } } }),
    prisma.product.groupBy({ by: ["productType"], _count: { id: true } }),
    prisma.shop.count(),
    prisma.shop.groupBy({ by: ["shopType"], _count: { id: true } })
  ]);

  const inventoryStats = {
    totalProducts,
    activeProducts,
    outOfStockProducts,
    lowStockProducts: 0, // Simplified as we don't always use minStock explicitly in all tables
    productsByType: productsByType.map(p => ({ type: p.productType, count: p._count.id })),
    totalShops,
    shopsByType: shopsByType.map(s => ({ type: s.shopType, count: s._count.id }))
  };

  return {
    orderTrend,
    paymentStats,
    paymentDistribution,
    inventoryStats
  };
}
