"use server";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { SessionUser } from "@/types/auth";
import { PaymentMethod } from "@prisma/client";
import {
  checkoutSchema,
  CheckoutFormValues,
  OrderDetail,
  OrderSummaryCard,
  CheckoutDefaults,
} from "@/types/order";
import { notifyOrderConfirmed, notifyShopNewOrder } from "@/lib/notifications";

export async function getCheckoutDefaults(): Promise<CheckoutDefaults> {
  try {
    const session = await requireRole("FARMER");
    const userSession = session.user as SessionUser;
    const userId = userSession.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { farmerProfile: true },
    });

    return {
      shippingName: user?.name || "",
      shippingPhone: user?.phone || "",
      shippingAddress: user?.farmerProfile?.address || "",
      shippingVillage: user?.farmerProfile?.village || "",
      shippingDistrict: user?.farmerProfile?.district || "",
      shippingState: user?.farmerProfile?.state || "",
      shippingPincode: user?.farmerProfile?.pincode || "",
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error retrieving checkout defaults:", error);
    return {
      shippingName: "",
      shippingPhone: "",
      shippingAddress: "",
      shippingVillage: "",
      shippingDistrict: "",
      shippingState: "",
      shippingPincode: "",
    };
  }
}

function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SP-${year}${month}${day}-${randomSuffix}`;
}

export async function createOrder(
  values: CheckoutFormValues
): Promise<{ success?: boolean; error?: string; orderId?: string; orderNumber?: string; orderIds?: string[] }> {
  try {
    const session = await requireRole("FARMER");
    const userSession = session.user as SessionUser;
    const userId = userSession.id;

    const parsed = checkoutSchema.safeParse(values);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Invalid checkout details" };
    }

    const {
      shippingName,
      shippingPhone,
      shippingAddress,
      shippingVillage,
      shippingDistrict,
      shippingState,
      shippingPincode,
      paymentMethod,
    } = parsed.data;

    // Load Cart from DB
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                shop: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return { error: "Your cart is empty. Please add agricultural products before checking out." };
    }

    // Verify all products: Active status and Stock sufficiency
    const shopOrderMap = new Map<string, {
      productId: string;
      shopId: string;
      productName: string;
      productPrice: number;
      quantity: number;
      unit: string | null;
      lineTotal: number;
      shopName: string | null;
      productType: string;
    }[]>();

    for (const item of cart.items) {
      const product = item.product;

      if (!product.isActive) {
        return {
          error: `Product "${product.name}" is currently unavailable. Please remove it from your cart.`,
        };
      }

      const shopId = product.shopId;
      if (!shopId) {
        return { error: `Product "${product.name}" is not associated with a shop.` };
      }

      let price = Number(product.price);
      let lineTotal = price * item.quantity;
      let unit = product.unit;

      if (product.productType === "MACHINERY_RENTAL") {
        const specs = (product.specifications as any) || {};
        const hourlyRate = Number(specs.rentalHourlyRate) || 0;
        const dailyRate = Number(specs.rentalDailyRate) || 0;
        const deposit = Number(specs.securityDeposit) || 0;

        let mode: "HOURLY" | "DAILY" = "DAILY";
        try {
          const cookieStore = await cookies();
          const stored = cookieStore.get(`rental_mode_${product.id}`)?.value;
          if (stored === "HOURLY" && hourlyRate > 0) mode = "HOURLY";
          else if (stored === "DAILY" && dailyRate > 0) mode = "DAILY";
          else if (dailyRate > 0) mode = "DAILY";
          else if (hourlyRate > 0) mode = "HOURLY";
        } catch {
          if (dailyRate > 0) mode = "DAILY";
          else if (hourlyRate > 0) mode = "HOURLY";
        }

        const rate = mode === "HOURLY" ? hourlyRate : dailyRate;
        price = rate;
        unit = mode === "HOURLY" ? "hour" : "day";
        lineTotal = rate * item.quantity + deposit;
      } else {
        if (product.stock < item.quantity) {
          return {
            error: `Insufficient stock for "${product.name}". Available: ${product.stock}, in cart: ${item.quantity}. Please update your cart.`,
          };
        }
      }

      if (!shopOrderMap.has(shopId)) {
        shopOrderMap.set(shopId, []);
      }

      shopOrderMap.get(shopId)!.push({
        productId: product.id,
        shopId,
        productName: product.name,
        productPrice: price,
        quantity: item.quantity,
        unit,
        lineTotal,
        shopName: product.shop?.name || null,
        productType: product.productType,
      });
    }

    const deliveryCharge = 0; // Free delivery policy for agricultural supplies

    // CRITICAL: Atomic Database Transaction
    // 1. Create Order per Shop
    // 2. Create OrderItems
    // 3. Deduct stock for each product
    // 4. Clear the cart
    const createdOrders = await prisma.$transaction(async (tx) => {
      const orders = [];

      for (const [shopId, itemsToCreate] of shopOrderMap.entries()) {
        const orderSubtotal = itemsToCreate.reduce((sum, item) => sum + item.lineTotal, 0);
        const orderTotalAmount = orderSubtotal + deliveryCharge;
        const orderNumber = generateOrderNumber();

        // 1. Create Order
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            userId,
            status: "CONFIRMED",
            paymentMethod: paymentMethod as PaymentMethod,
            paymentStatus: paymentMethod === "COD" ? "PENDING" : "PENDING",
            subtotal: orderSubtotal,
            deliveryCharge,
            totalAmount: orderTotalAmount,
            shippingName,
            shippingPhone,
            shippingAddress,
            shippingVillage: shippingVillage || null,
            shippingDistrict: shippingDistrict || null,
            shippingState: shippingState || null,
            shippingPincode: shippingPincode || null,
            items: {
              create: itemsToCreate.map((item) => ({
                productId: item.productId,
                shopId: item.shopId,
                productName: item.productName,
                productPrice: item.productPrice,
                quantity: item.quantity,
                unit: item.unit,
                lineTotal: item.lineTotal,
                shopName: item.shopName,
                status: "CONFIRMED",
              })),
            },
          },
        });

        orders.push({ order: newOrder, shopId });

        // 2. Deduct product stock (only for consumable / purchase items, not rental machinery)
        for (const item of itemsToCreate) {
          if (item.productType !== "MACHINERY_RENTAL") {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            });
          }
        }
      }

      // 3. Clear user's cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // 4. Send Notifications (Farmer & Shop Owners)
      for (const { order: newOrder, shopId } of orders) {
        await notifyOrderConfirmed({
          farmerId: userId,
          orderId: newOrder.id,
          orderNumber: newOrder.orderNumber,
          totalAmount: Number(newOrder.totalAmount),
          tx,
        });

        const shop = await tx.shop.findUnique({
          where: { id: shopId },
          select: { userId: true },
        });
        if (shop?.userId) {
          await notifyShopNewOrder({
            shopOwnerUserId: shop.userId,
            orderId: newOrder.id,
            orderNumber: newOrder.orderNumber,
            totalAmount: Number(newOrder.totalAmount),
            tx,
          });
        }
      }

      return orders.map(o => o.order);
    });

    revalidatePath("/farmer/cart");
    revalidatePath("/farmer/orders");
    revalidatePath("/farmer/marketplace");

    return {
      success: true,
      orderId: createdOrders[0]?.id,
      orderNumber: createdOrders[0]?.orderNumber,
      orderIds: createdOrders.map(o => o.id),
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Order creation transaction error:", error);
    return { error: "An unexpected error occurred while placing your order. Please try again." };
  }
}

export async function getFarmerOrders(): Promise<{ orders: OrderSummaryCard[]; error?: string }> {
  try {
    const session = await requireRole("FARMER");
    const userSession = session.user as SessionUser;
    const userId = userSession.id;

    const rawOrders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          select: {
            productName: true,
            quantity: true,
            shopName: true,
          },
        },
        deliveryAssignment: {
          select: {
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const orders: OrderSummaryCard[] = rawOrders.map((order) => {
      const totalUnits = order.items.reduce((sum, item) => sum + item.quantity, 0);
      const firstShopName = order.items.find(i => i.shopName)?.shopName || null;
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        totalAmount: Number(order.totalAmount),
        itemCount: totalUnits,
        createdAt: order.createdAt.toISOString(),
        firstItemName: order.items[0]?.productName || "Agricultural Item",
        deliveryStatus: order.deliveryAssignment?.status || null,
        shopName: firstShopName,
      };
    });

    return { orders };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error retrieving farmer orders:", error);
    return { orders: [], error: "Unable to retrieve your order history." };
  }
}

export async function getOrderDetail(
  orderId: string
): Promise<{ order: OrderDetail | null; error?: string }> {
  try {
    const session = await requireRole("FARMER");
    const userSession = session.user as SessionUser;
    const userId = userSession.id;

    // Secure Ownership Check
    const rawOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
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

    if (!rawOrder) {
      return { order: null, error: "Order not found or unauthorized access." };
    }

    const isCancellable =
      rawOrder.status === "PENDING" || rawOrder.status === "CONFIRMED";

    const assignment = rawOrder.deliveryAssignment;
    const deliveryInfo = assignment
      ? {
          assignmentId: assignment.id,
          status: assignment.status,
          deliveryPartnerName:
            assignment.deliveryPartner?.user?.name ||
            (assignment.status === "PENDING_ASSIGNMENT" ? "Awaiting Assignment" : "Delivery Partner"),
          deliveryPartnerPhone:
            assignment.deliveryPartner?.phone ||
            assignment.deliveryPartner?.user?.phone ||
            null,
          vehicleType: assignment.deliveryPartner?.vehicleType || null,
          vehicleNumber: assignment.deliveryPartner?.vehicleNumber || null,
          lastKnownLat: assignment.deliveryPartner?.lastKnownLat || null,
          lastKnownLon: assignment.deliveryPartner?.lastKnownLon || null,
          lastLocationUpdatedAt: assignment.deliveryPartner?.lastLocationUpdatedAt?.toISOString() || null,
          deliveryCode: assignment.deliveryCode,
          deliveryWindow: assignment.deliveryWindow || null,
          estimatedDistanceKm: assignment.estimatedDistanceKm || null,
          deliveryExceptionReason: assignment.deliveryExceptionReason || null,
          rescheduleReason: assignment.rescheduleReason || null,
          assignedAt: assignment.assignedAt?.toISOString() || null,
          pickedUpAt: assignment.pickedUpAt?.toISOString() || null,
          outForDeliveryAt: assignment.outForDeliveryAt?.toISOString() || null,
          deliveredAt: assignment.deliveredAt?.toISOString() || null,
        }
      : null;

    const order: OrderDetail = {
      id: rawOrder.id,
      orderNumber: rawOrder.orderNumber,
      status: rawOrder.status,
      paymentMethod: rawOrder.paymentMethod,
      paymentStatus: rawOrder.paymentStatus,
      subtotal: Number(rawOrder.subtotal),
      deliveryCharge: Number(rawOrder.deliveryCharge),
      totalAmount: Number(rawOrder.totalAmount),
      shippingName: rawOrder.shippingName,
      shippingPhone: rawOrder.shippingPhone,
      shippingAddress: rawOrder.shippingAddress,
      shippingVillage: rawOrder.shippingVillage,
      shippingDistrict: rawOrder.shippingDistrict,
      shippingState: rawOrder.shippingState,
      shippingPincode: rawOrder.shippingPincode,
      createdAt: rawOrder.createdAt.toISOString(),
      updatedAt: rawOrder.updatedAt.toISOString(),
      isCancellable,
      deliveryInfo,
      items: rawOrder.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productPrice: Number(item.productPrice),
        quantity: item.quantity,
        unit: item.unit,
        lineTotal: Number(item.lineTotal),
        shopName: item.shopName,
      })),
    };

    return { order };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error retrieving order detail:", error);
    return { order: null, error: "Unable to load order details." };
  }
}

export async function cancelOrder(
  orderId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await requireRole("FARMER");
    const userSession = session.user as SessionUser;
    const userId = userSession.id;

    // Secure Ownership & Eligibility Check
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return { error: "Order not found or unauthorized access." };
    }

    if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
      return {
        error:
          "This order cannot be cancelled because it is already being processed or prepared for delivery.",
      };
    }

    // CRITICAL: Atomic Cancellation Transaction
    // 1. Update Order status to CANCELLED
    // 2. Restore stock for each ordered item
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          paymentStatus: "CANCELLED",
        },
      });

      for (const item of order.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
      }
    });

    revalidatePath("/farmer/orders");
    revalidatePath(`/farmer/orders/${order.id}`);
    revalidatePath("/farmer/marketplace");

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error cancelling order:", error);
    return { error: "Failed to cancel order. Please try again." };
  }
}
