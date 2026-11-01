"use server";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { SessionUser } from "@/types/auth";
import {
  SellerOrderSummary,
  SellerOrderDetail,
} from "@/types/shop";
import { OrderStatus } from "@prisma/client";
import { notifyOrderProcessing, notifyOrderReadyForDelivery } from "@/lib/notifications";
import { autoAssignOrderDelivery, AutoAssignResult } from "@/actions/delivery/delivery-actions";

async function getAuthorizedShopHelper() {
  const session = await requireRole("SHOP_OWNER");
  const user = session.user as SessionUser;

  const shop = await prisma.shop.findUnique({
    where: { userId: user.id },
  });

  if (!shop) {
    throw new Error("No agricultural shop found linked to your account.");
  }

  return { user, shop };
}

export async function getShopOrders(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: SellerOrderSummary[], total: number, totalPages: number, currentPage: number }> {
  const { shop } = await getAuthorizedShopHelper();

  try {
    const whereClause: {
      items: {
        some: {
          OR: Array<{ shopId: string } | { product: { shopId: string } }>;
          status?: OrderStatus;
        };
      };
      orderNumber?: { contains: string; mode: "insensitive" };
      status?: OrderStatus;
    } = {
      items: {
        some: {
          OR: [
            { shopId: shop.id },
            { product: { shopId: shop.id } },
          ],
        },
      },
    };

    if (params?.search && params.search.trim()) {
      whereClause.orderNumber = {
        contains: params.search.trim(),
        mode: "insensitive",
      };
    }

    if (params?.status && params.status !== "ALL") {
      // Filter by order item status for this shop
      whereClause.items.some.status = params.status as OrderStatus;
    }

    const page = params?.page || 1;
    const limit = params?.limit || 12;
    const skip = (page - 1) * limit;
    
    const [orders, totalOrders] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          items: {
            where: {
              OR: [
                { shopId: shop.id },
                { product: { shopId: shop.id } },
              ],
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.order.count({ where: whereClause })
    ]);

    const mappedItems = orders.map((order) => {
      const itemStatuses = order.items.map((i) => i.status);
      let shopFulfillmentStatus: OrderStatus = "CONFIRMED";

      if (order.status === "CANCELLED") {
        shopFulfillmentStatus = "CANCELLED";
      } else if (order.status === "DELIVERED") {
        shopFulfillmentStatus = "DELIVERED";
      } else if (itemStatuses.every((s) => s === "READY_FOR_DELIVERY")) {
        shopFulfillmentStatus = "READY_FOR_DELIVERY";
      } else if (itemStatuses.some((s) => s === "PROCESSING" || s === "READY_FOR_DELIVERY")) {
        shopFulfillmentStatus = "PROCESSING";
      } else {
        shopFulfillmentStatus = "CONFIRMED";
      }

      const shopTotal = order.items.reduce((sum, item) => sum + Number(item.lineTotal), 0);

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt.toISOString(),
        overallStatus: order.status,
        shopFulfillmentStatus,
        itemCount: order.items.reduce((count, item) => count + item.quantity, 0),
        shopTotal,
        customerName: order.shippingName,
        customerPhone: order.shippingPhone,
        customerLocation: [order.shippingVillage, order.shippingDistrict].filter(Boolean).join(", ") || "Local Area",
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          productPrice: Number(item.productPrice),
          quantity: item.quantity,
          unit: item.unit,
          lineTotal: Number(item.lineTotal),
          status: item.status,
        })),
      };
    });
    
    return {
      items: mappedItems,
      total: totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error fetching shop orders:", error);
    return { items: [], total: 0, totalPages: 0, currentPage: 1 };
  }
}

export async function getShopOrderDetail(orderId: string): Promise<SellerOrderDetail | null> {
  const { shop } = await getAuthorizedShopHelper();

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: {
            OR: [
              { shopId: shop.id },
              { product: { shopId: shop.id } },
            ],
          },
        },
        deliveryAssignment: {
          include: {
            deliveryPartner: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!order || order.items.length === 0) {
      return null;
    }

    const itemStatuses = order.items.map((i) => i.status);
    let shopFulfillmentStatus: OrderStatus = "CONFIRMED";

    if (order.status === "CANCELLED") {
      shopFulfillmentStatus = "CANCELLED";
    } else if (order.status === "DELIVERED") {
      shopFulfillmentStatus = "DELIVERED";
    } else if (itemStatuses.length > 0 && itemStatuses.every((s) => s === "READY_FOR_DELIVERY")) {
      shopFulfillmentStatus = "READY_FOR_DELIVERY";
    } else if (itemStatuses.some((s) => s === "PROCESSING" || s === "READY_FOR_DELIVERY")) {
      shopFulfillmentStatus = "PROCESSING";
    } else {
      shopFulfillmentStatus = "CONFIRMED";
    }

    const shopTotal = order.items.reduce((sum, item) => sum + Number(item.lineTotal), 0);

    const canMarkProcessing =
      shopFulfillmentStatus === "CONFIRMED" &&
      order.status !== "CANCELLED" &&
      order.status !== "DELIVERED";

    const canMarkReady =
      shopFulfillmentStatus === "PROCESSING" &&
      order.status !== "CANCELLED" &&
      order.status !== "DELIVERED";

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      overallStatus: order.status,
      shopFulfillmentStatus,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      shippingName: order.shippingName,
      shippingPhone: order.shippingPhone,
      shippingAddress: order.shippingAddress,
      shippingVillage: order.shippingVillage,
      shippingDistrict: order.shippingDistrict,
      shippingState: order.shippingState,
      shippingPincode: order.shippingPincode,
      shopTotal,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productPrice: Number(item.productPrice),
        quantity: item.quantity,
        unit: item.unit,
        lineTotal: Number(item.lineTotal),
        status: item.status,
      })),
      canMarkProcessing,
      canMarkReady,
      deliveryAssignment: order.deliveryAssignment
        ? {
            id: order.deliveryAssignment.id,
            status: order.deliveryAssignment.status,
            deliveryCode: order.deliveryAssignment.deliveryCode,
            partnerName: order.deliveryAssignment.deliveryPartner?.user?.name || null,
            partnerPhone:
              order.deliveryAssignment.deliveryPartner?.phone ||
              order.deliveryAssignment.deliveryPartner?.user?.phone ||
              null,
            vehicleType: order.deliveryAssignment.deliveryPartner?.vehicleType || null,
            vehicleNumber: order.deliveryAssignment.deliveryPartner?.vehicleNumber || null,
            assignedAt: order.deliveryAssignment.assignedAt?.toISOString() || null,
            pickedUpAt: order.deliveryAssignment.pickedUpAt?.toISOString() || null,
            outForDeliveryAt: order.deliveryAssignment.outForDeliveryAt?.toISOString() || null,
            deliveredAt: order.deliveryAssignment.deliveredAt?.toISOString() || null,
          }
        : null,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error fetching shop order detail:", error);
    return null;
  }
}

export async function updateShopOrderStatus(
  orderId: string,
  targetStatus: "PROCESSING" | "READY_FOR_DELIVERY"
): Promise<{
  success?: boolean;
  error?: string;
  assigned?: boolean;
  partnerName?: string;
  message?: string;
}> {
  const { shop } = await getAuthorizedShopHelper();

  try {
    // 1. Fetch order and verify that this shop owns items in it
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: {
            OR: [
              { shopId: shop.id },
              { product: { shopId: shop.id } },
            ],
          },
        },
      },
    });

    if (!order || order.items.length === 0) {
      return { error: "Order not found or you do not have permission to fulfill this order." };
    }

    if (order.status === "CANCELLED") {
      return { error: "Cannot update status of a cancelled order." };
    }

    if (order.status === "DELIVERED") {
      return { error: "Order has already been delivered." };
    }

    // Determine current fulfillment status for this shop
    const currentStatuses = order.items.map((i) => i.status);
    const isCurrentlyConfirmed = currentStatuses.every((s) => s === "CONFIRMED");
    const isCurrentlyProcessing = currentStatuses.some((s) => s === "PROCESSING");
    const isCurrentlyReady = currentStatuses.every((s) => s === "READY_FOR_DELIVERY");

    // 2. Validate state transitions strictly: CONFIRMED -> PROCESSING -> READY_FOR_DELIVERY
    if (targetStatus === "PROCESSING") {
      if (!isCurrentlyConfirmed) {
        return {
          error: isCurrentlyReady
            ? "Order items are already marked ready for delivery."
            : "Order items are already processing.",
        };
      }
    } else if (targetStatus === "READY_FOR_DELIVERY") {
      if (!isCurrentlyProcessing && !isCurrentlyConfirmed) {
        return {
          error: isCurrentlyReady
            ? "Order items are already marked ready for delivery."
            : "Invalid status transition.",
        };
      }
    } else {
      return { error: "Invalid fulfillment status requested." };
    }

    // 3. Atomic Transaction: Update items for this shop and reconcile parent order status
    let assignResult: AutoAssignResult | undefined;
    await prisma.$transaction(async (tx) => {
      // Update this shop's order items
      await tx.orderItem.updateMany({
        where: {
          orderId,
          OR: [
            { shopId: shop.id },
            { product: { shopId: shop.id } },
          ],
        },
        data: {
          status: targetStatus,
        },
      });

      // Fetch all items across all shops to reconcile parent order
      const allItems = await tx.orderItem.findMany({
        where: { orderId },
        select: { status: true },
      });

      const allItemsReady = allItems.every((i) => i.status === "READY_FOR_DELIVERY");
      const anyItemProcessingOrReady = allItems.some(
        (i) => i.status === "PROCESSING" || i.status === "READY_FOR_DELIVERY"
      );

      let newParentStatus: OrderStatus = "CONFIRMED";
      if (allItemsReady) {
        newParentStatus = "READY_FOR_DELIVERY";
      } else if (anyItemProcessingOrReady) {
        newParentStatus = "PROCESSING";
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: newParentStatus,
        },
      });

      if (targetStatus === "PROCESSING") {
        await notifyOrderProcessing({
          farmerId: order.userId,
          orderId: order.id,
          orderNumber: order.orderNumber,
          tx,
        });
      } else if (targetStatus === "READY_FOR_DELIVERY") {
        // Automatically assign Delivery Partner server-side
        assignResult = await autoAssignOrderDelivery(orderId, tx);

        // If assignment is pending (no partner currently available), notify farmer that packing is done
        if (!assignResult.assigned) {
          await notifyOrderReadyForDelivery({
            farmerId: order.userId,
            orderId: order.id,
            orderNumber: order.orderNumber,
            tx,
          });
        }
      }
    });

    // Revalidate paths for real-time reflection across seller, farmer, and delivery portals
    revalidatePath("/shop/orders");
    revalidatePath(`/shop/orders/${orderId}`);
    revalidatePath("/shop/dashboard");
    revalidatePath("/farmer/orders");
    revalidatePath(`/farmer/orders/${orderId}`);
    revalidatePath("/delivery/dashboard");
    revalidatePath("/delivery/available");
    revalidatePath("/delivery/orders");
    revalidatePath(`/delivery/orders/${orderId}`);

    return {
      success: true,
      assigned: assignResult?.assigned,
      partnerName: assignResult?.partnerName,
      message: assignResult?.message,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error updating shop order status:", error);
    return { error: "Failed to update order status. Please try again." };
  }
}
