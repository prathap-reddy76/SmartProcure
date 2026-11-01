"use server";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { PaymentStatus, Role, Prisma } from "@prisma/client";
import { serializeDecimal } from "@/lib/analytics/core";

export async function getAdminPaymentsAction(params: {
  page?: number;
  search?: string;
  status?: string;
  provider?: string;
}) {
  await requireRole(Role.ADMIN);

  const page = params.page || 1;
  const limit = 25;
  const skip = (page - 1) * limit;

  const where: Prisma.PaymentTransactionWhereInput = {};
  
  if (params.search) {
    where.OR = [
      { id: { contains: params.search, mode: "insensitive" } },
      { providerOrderId: { contains: params.search, mode: "insensitive" } },
      { providerPaymentId: { contains: params.search, mode: "insensitive" } },
      { orderId: { contains: params.search, mode: "insensitive" } },
      { user: { name: { contains: params.search, mode: "insensitive" } } },
      { user: { email: { contains: params.search, mode: "insensitive" } } },
    ];
  }

  if (params.status) {
    where.status = params.status as PaymentStatus;
  }
  if (params.provider) {
    where.provider = params.provider;
  }

  // Use a parallel request for top metrics and the paginated items
  const [
    totalTransactions,
    transactions,
    aggregate
  ] = await Promise.all([
    prisma.paymentTransaction.count({ where }),
    prisma.paymentTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
    prisma.paymentTransaction.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { amount: true, refundAmount: true },
      where,
    })
  ]);

  const totalPages = Math.ceil(totalTransactions / limit);

  // Compute metrics securely
  let successfulPayments = 0;
  let failedPayments = 0;
  let pendingPayments = 0;
  let refundedPayments = 0;
  let refundPendingPayments = 0;
  
  let totalSuccessfulAmount = 0;
  let totalRefundedAmount = 0;

  aggregate.forEach((group) => {
    const count = group._count.id;
    const amount = serializeDecimal(group._sum.amount);
    const refund = serializeDecimal(group._sum.refundAmount);

    if (group.status === "PAID") {
      successfulPayments += count;
      totalSuccessfulAmount += amount;
    } else if (group.status === "FAILED") {
      failedPayments += count;
    } else if (group.status === "REFUNDED" || group.status === "PARTIALLY_REFUNDED") {
      refundedPayments += count;
      totalSuccessfulAmount += amount; // The original payment was still successfully authorized
      totalRefundedAmount += refund;
    } else if (group.status === "REFUND_PENDING") {
      refundPendingPayments += count;
      totalSuccessfulAmount += amount;
    } else {
      pendingPayments += count;
    }
  });

  // Calculate Net Collected Amount securely using pure server logic mapped from decimal sums
  const netCollectedAmount = totalSuccessfulAmount - totalRefundedAmount;

  // Serialize Decimal objects for Client Components seamlessly
  const serializedTransactions = transactions.map(t => ({
    ...t,
    amount: serializeDecimal(t.amount),
    refundAmount: serializeDecimal(t.refundAmount),
  }));

  return {
    metrics: {
      totalTransactions,
      successfulPayments,
      failedPayments,
      pendingPayments,
      refundedPayments,
      refundPendingPayments,
      totalSuccessfulAmount,
      totalRefundedAmount,
      netCollectedAmount
    },
    transactions: serializedTransactions,
    pagination: {
      page,
      limit,
      total: totalTransactions,
      totalPages
    }
  };
}
