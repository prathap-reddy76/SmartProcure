"use server";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { Prisma, OrderStatus, PaymentStatus, DeliveryStatus } from "@prisma/client";
import { SessionUser } from "@/types/auth";

// Define return types
export type AdminOrderSummary = {
  id: string;
  orderNumber: string;
  createdAt: string;
  farmerName: string;
  farmerPhone: string;
  shopName: string | null;
  itemCount: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus | null;
};

export type AdminOrderStats = {
  total: number;
  pending: number;
  processing: number;
  outForDelivery: number;
  delivered: number;
  cancelled: number;
  paymentPending: number;
};

export type AdminOrdersResponse = {
  orders: AdminOrderSummary[];
  totalCount: number;
  pageCount: number;
  error?: string;
};

export async function getAdminOrderStats(): Promise<{ stats: AdminOrderStats | null; error?: string }> {
  try {
    await requireRole("ADMIN");

    const [
      total,
      pending,
      processing,
      outForDelivery,
      delivered,
      cancelled,
      paymentPending
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "PROCESSING" } }),
      prisma.order.count({ where: { status: "OUT_FOR_DELIVERY" } }),
      prisma.order.count({ where: { status: "DELIVERED" } }),
      prisma.order.count({ where: { status: "CANCELLED" } }),
      prisma.order.count({ where: { paymentStatus: "PENDING" } })
    ]);

    return {
      stats: { total, pending, processing, outForDelivery, delivered, cancelled, paymentPending }
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error fetching admin order stats:", error);
    return { stats: null, error: "Failed to fetch order statistics" };
  }
}

interface GetAdminOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  paymentStatus?: string;
  deliveryStatus?: string;
  sortBy?: "newest" | "oldest" | "amount_desc" | "amount_asc";
}

export async function getAdminOrders(params: GetAdminOrdersParams): Promise<AdminOrdersResponse> {
  try {
    await requireRole("ADMIN");

    const {
      page = 1,
      limit = 20,
      search,
      status,
      paymentStatus,
      deliveryStatus,
      sortBy = "newest",
    } = params;

    const skip = (page - 1) * limit;

    // Build Where Clause
    const where: Prisma.OrderWhereInput = {};

    if (status) {
      where.status = status as OrderStatus;
    }
    if (paymentStatus) {
      where.paymentStatus = paymentStatus as PaymentStatus;
    }
    if (deliveryStatus) {
      where.deliveryAssignment = {
        status: deliveryStatus as DeliveryStatus
      };
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { phone: { contains: search, mode: "insensitive" } } },
        { items: { some: { shopName: { contains: search, mode: "insensitive" } } } }
      ];
    }

    // Build OrderBy
    let orderBy: Prisma.OrderOrderByWithRelationInput = { createdAt: "desc" };
    if (sortBy === "oldest") orderBy = { createdAt: "asc" };
    else if (sortBy === "amount_desc") orderBy = { totalAmount: "desc" };
    else if (sortBy === "amount_asc") orderBy = { totalAmount: "asc" };

    const [rawOrders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: { select: { name: true, phone: true } },
          items: { select: { quantity: true, shopName: true } },
          deliveryAssignment: { select: { status: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const orders: AdminOrderSummary[] = rawOrders.map((order: any) => {
      const totalUnits = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      const firstShopName = order.items.find((i: any) => i.shopName)?.shopName || null;

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt.toISOString(),
        farmerName: order.user?.name || "Unknown Farmer",
        farmerPhone: order.user?.phone || "N/A",
        shopName: firstShopName,
        itemCount: totalUnits,
        totalAmount: Number(order.totalAmount),
        status: order.status,
        paymentStatus: order.paymentStatus,
        deliveryStatus: order.deliveryAssignment?.status || null,
      };
    });

    return {
      orders,
      totalCount,
      pageCount: Math.ceil(totalCount / limit),
    };

  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error fetching admin orders:", error);
    return { orders: [], totalCount: 0, pageCount: 0, error: "Failed to fetch orders" };
  }
}

export async function getAdminOrderDetail(orderId: string) {
  try {
    await requireRole("ADMIN");

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, phone: true, email: true } },
        items: {
          orderBy: { createdAt: "asc" },
          include: {
            product: { select: { productType: true } },
            shop: { select: { shopType: true } }
          }
        },
        deliveryAssignment: {
          include: {
            deliveryPartner: {
              include: { user: { select: { name: true, phone: true } } }
            }
          }
        },
        paymentTransactions: {
          orderBy: { createdAt: "desc" },
          take: 5
        }
      },
    });

    if (!order) return { order: null, error: "Order not found" };

    return { order };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error fetching admin order detail:", error);
    return { order: null, error: "Failed to load order details" };
  }
}

export async function cancelAdminOrder(orderId: string, reason: string) {
  try {
    const session = await requireRole("ADMIN");
    const userSession = session.user as SessionUser;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) return { error: "Order not found" };

    if (order.status === "DELIVERED" || order.status === "CANCELLED") {
      return { error: `Cannot cancel an order that is already ${order.status}` };
    }

    // Atomic Cancellation
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Cancel order
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          // Only cancel payment if it was pending or online (if refund not supported yet, at least mark it)
          ...(order.paymentStatus === "PENDING" ? { paymentStatus: "CANCELLED" } : {})
        }
      });

      // Restore stock
      for (const item of order.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          });
        }
      }

      // Log the admin action
      await tx.auditLog.create({
        data: {
          action: "ADMIN_CANCEL_ORDER",
          actorUserId: userSession.id,
          actorRole: userSession.role,
          entityType: "ORDER",
          entityId: order.id,
          metadata: { reason, previousStatus: order.status }
        }
      });
    });

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error cancelling order via admin:", error);
    return { error: "Failed to cancel order" };
  }
}
