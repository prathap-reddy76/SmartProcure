"use server";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { SessionUser } from "@/types/auth";
import {
  DeliveryPartnerProfile,
  DeliveryDashboardMetrics,
  AvailableDeliverySummary,
  PartnerDeliverySummary,
  PartnerDeliveryDetail,
  AdminLogisticsMetrics,
  AdminDeliveryItem,
  AdminPartnerItem,
} from "@/types/delivery";
import { DeliveryStatus, DeliveryType, Prisma } from "@prisma/client";
import {
  notifyDeliveryAssigned,
  notifyDeliveryReassigned,
  notifyDeliveryPendingAssignment,
  notifyDeliveryPickedUp,
  notifyDeliveryOutForDelivery,
  notifyDeliveryDelivered,
  notifyDeliveryCancelled,
  notifyDeliveryRescheduled,
  notifyDeliveryException,
  notifyMachineryDeliveryAssigned,
  notifyMachineryDeliveryPickedUp,
  notifyMachineryDeliveryDelivered,
  notifyMachineryReturnRequested,
  notifyMachineryReturnPickedUp,
  notifyMachineryReturnCompleted,
} from "@/lib/notifications";

const DEFAULT_MAX_ACTIVE = 3;

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Non-request environment fallback
  }
}

async function getAuthorizedDeliveryPartner(testPartnerUserId?: string) {
  let partnerUserId: string | null = null;
  if (testPartnerUserId) {
    partnerUserId = testPartnerUserId;
  } else {
    try {
      const session = await auth();
      if (session?.user?.id) {
        partnerUserId = session.user.id;
      }
    } catch {}

    if (!partnerUserId) {
      const session = await requireRole("DELIVERY_PARTNER");
      partnerUserId = (session.user as SessionUser).id;
    }
  }

  const partner = await prisma.deliveryPartner.findUnique({
    where: { userId: partnerUserId },
    include: { user: true },
  });

  if (!partner) {
    throw new Error("No delivery partner profile found linked to your account.");
  }

  return { partner, userId: partnerUserId };
}

async function getAdminUser(testAdminUserId?: string) {
  let adminUserId: string | null = null;
  try {
    const session = await auth();
    if (session?.user?.id) {
      adminUserId = session.user.id;
    }
  } catch {}

  if (!adminUserId && testAdminUserId) {
    adminUserId = testAdminUserId;
  }

  if (!adminUserId) {
    const session = await requireRole("ADMIN");
    adminUserId = (session.user as SessionUser).id;
  }

  const user = await prisma.user.findUnique({
    where: { id: adminUserId },
    select: { id: true, role: true, name: true, email: true },
  });

  if (!user || user.role !== "ADMIN") {
    throw new Error("Admin authorization required.");
  }

  return user;
}

// -------------------------------------------------------------
// Delivery Partner Profile & Dashboard
// -------------------------------------------------------------

export async function getDeliveryPartnerProfile(
  testPartnerUserId?: string
): Promise<DeliveryPartnerProfile | null> {
  try {
    const { partner } = await getAuthorizedDeliveryPartner(testPartnerUserId);
    return {
      id: partner.id,
      userId: partner.userId,
      name: partner.user.name || "Delivery Partner",
      email: partner.user.email || "",
      phone: partner.phone || partner.user.phone || null,
      vehicleType: partner.vehicleType,
      vehicleNumber: partner.vehicleNumber,
      vehicleCapacity: partner.vehicleCapacity,
      serviceArea: partner.serviceArea,
      maxActiveDeliveries: partner.maxActiveDeliveries || DEFAULT_MAX_ACTIVE,
      isAvailable: partner.isAvailable,
      isActive: partner.isActive,
      lastKnownLat: partner.lastKnownLat,
      lastKnownLon: partner.lastKnownLon,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error fetching delivery partner profile:", error);
    return null;
  }
}

export async function getDeliveryDashboardData(testPartnerUserId?: string): Promise<{
  profile: DeliveryPartnerProfile | null;
  metrics: DeliveryDashboardMetrics;
  recentDeliveries: PartnerDeliverySummary[];
}> {
  const defaultMetrics: DeliveryDashboardMetrics = {
    totalAssignedDeliveries: 0,
    pendingDeliveries: 0,
    pickupsAwaitingCollection: 0,
    inProgressDeliveries: 0,
    completedDeliveries: 0,
    availableDeliveries: 0,
    assignedDeliveries: 0,
    pickedUpDeliveries: 0,
    outForDeliveryCount: 0,
    deliveredCount: 0,
    activeDeliveriesCount: 0,
    maxActiveLimit: DEFAULT_MAX_ACTIVE,
    exceptionCount: 0,
    returnedCount: 0,
  };

  try {
    const { partner } = await getAuthorizedDeliveryPartner(testPartnerUserId);

    // 1. Available deliveries: Orders ready without partner assignment + Machinery rental/returns pending
    const availableOrdersCount = await prisma.order.count({
      where: {
        status: "READY_FOR_DELIVERY",
        deliveryAssignment: null,
      },
    });

    const unassignedAssignmentsCount = await prisma.deliveryAssignment.count({
      where: {
        deliveryPartnerId: null,
        status: { in: ["PENDING_ASSIGNMENT", "RETURN_REQUESTED"] },
      },
    });

    const totalAvailable = availableOrdersCount + unassignedAssignmentsCount;

    // 2. Partner's assignments
    const assignments = await prisma.deliveryAssignment.findMany({
      where: { deliveryPartnerId: partner.id },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: {
                  include: {
                    shop: true,
                  },
                },
              },
            },
          },
        },
        machineryBooking: {
          include: {
            machinery: true,
            farmer: { select: { id: true, name: true, phone: true } },
            owner: { select: { id: true, name: true, phone: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    let assignedCount = 0;
    let pickedUpCount = 0;
    let outForDeliveryCount = 0;
    let deliveredCount = 0;
    let exceptionCount = 0;
    let returnedCount = 0;

    for (const a of assignments) {
      if (a.status === "ASSIGNED") assignedCount++;
      else if (a.status === "PICKED_UP") pickedUpCount++;
      else if (a.status === "OUT_FOR_DELIVERY" || a.status === "IN_TRANSIT") outForDeliveryCount++;
      else if (a.status === "DELIVERED") deliveredCount++;
      else if (a.status === "EXCEPTION") exceptionCount++;
      else if (a.status === "RETURNED") returnedCount++;
    }

    const activeCount = assignedCount + pickedUpCount + outForDeliveryCount;

    const recentDeliveries: PartnerDeliverySummary[] = assignments.slice(0, 20).map((a) => {
      const isMachinery = a.deliveryType === "MACHINERY_RENTAL" || a.deliveryType === "MACHINERY_RETURN";
      const booking = a.machineryBooking;
      const order = a.order;

      const orderNumber = isMachinery
        ? booking?.bookingNumber || "MCH-RENTAL"
        : order?.orderNumber || "ORD-UNKNOWN";

      const customerName = isMachinery
        ? (a.deliveryType === "MACHINERY_RETURN" ? booking?.owner.name || "Owner" : booking?.farmer.name || "Farmer")
        : order?.shippingName || "Customer";

      const customerPhone = isMachinery
        ? (a.deliveryType === "MACHINERY_RETURN" ? booking?.owner.phone || "N/A" : booking?.farmer.phone || "N/A")
        : order?.shippingPhone || "N/A";

      const deliveryAddress = a.dropAddress || (order ? order.shippingAddress : (booking?.deliveryAddress || "Field Address"));
      const deliveryArea = order
        ? [order.shippingVillage, order.shippingDistrict].filter(Boolean).join(", ") || "Local Area"
        : (booking?.machinery.location || "Local Area");

      const totalAmount = isMachinery
        ? Number(booking?.totalAmount || 0)
        : Number(order?.totalAmount || 0);

      const itemsList = order
        ? order.items.map((i) => ({
            name: i.productName,
            quantity: i.quantity,
          }))
        : isMachinery && booking
        ? [{ name: booking.machinery.name, quantity: 1 }]
        : [];

      const itemsSummary = itemsList.map((i) => `${i.name} (x${i.quantity})`).join(", ");

      const firstShop = order?.items[0]?.product?.shop;
      const pickupAddress = a.pickupAddress || (firstShop ? `${firstShop.name}, ${firstShop.address}, ${firstShop.district || ""}` : (isMachinery ? (booking?.machinery.address || booking?.machinery.location || "Machinery Yard") : "Store Pickup"));

      const itemCount = isMachinery ? 1 : (order ? order.items.reduce((acc, i) => acc + i.quantity, 0) : 0);

      return {
        assignmentId: a.id,
        deliveryType: a.deliveryType,
        orderId: a.orderId,
        machineryBookingId: a.machineryBookingId,
        orderNumber,
        status: a.status,
        overallOrderStatus: order?.status || null,
        customerName,
        customerPhone,
        pickupAddress,
        deliveryAddress,
        deliveryArea,
        pincode: order?.shippingPincode || null,
        totalAmount,
        paymentMethod: order?.paymentMethod || "COD",
        paymentStatus: order?.paymentStatus || "PAID",
        deliveryWindow: a.deliveryWindow,
        estimatedDistanceKm: a.estimatedDistanceKm,
        assignedAt: a.assignedAt?.toISOString() || a.createdAt.toISOString(),
        pickedUpAt: a.pickedUpAt?.toISOString() || null,
        outForDeliveryAt: a.outForDeliveryAt?.toISOString() || null,
        deliveredAt: a.deliveredAt?.toISOString() || null,
        itemCount,
        itemsSummary,
        itemsList,
        deliveryExceptionReason: a.deliveryExceptionReason,
      };
    });

    return {
      profile: {
        id: partner.id,
        userId: partner.userId,
        name: partner.user.name || "Delivery Partner",
        email: partner.user.email || "",
        phone: partner.phone || partner.user.phone || null,
        vehicleType: partner.vehicleType,
        vehicleNumber: partner.vehicleNumber,
        vehicleCapacity: partner.vehicleCapacity,
        serviceArea: partner.serviceArea,
        maxActiveDeliveries: partner.maxActiveDeliveries || DEFAULT_MAX_ACTIVE,
        isAvailable: partner.isAvailable,
        isActive: partner.isActive,
        lastKnownLat: partner.lastKnownLat,
        lastKnownLon: partner.lastKnownLon,
      },
      metrics: {
        totalAssignedDeliveries: assignments.length,
        pendingDeliveries: assignedCount,
        pickupsAwaitingCollection: assignedCount,
        inProgressDeliveries: pickedUpCount + outForDeliveryCount,
        completedDeliveries: deliveredCount + returnedCount,
        availableDeliveries: totalAvailable,
        assignedDeliveries: assignedCount,
        pickedUpDeliveries: pickedUpCount,
        outForDeliveryCount,
        deliveredCount,
        activeDeliveriesCount: activeCount,
        maxActiveLimit: partner.maxActiveDeliveries || DEFAULT_MAX_ACTIVE,
        exceptionCount,
        returnedCount,
      },
      recentDeliveries,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error fetching delivery dashboard data:", error);
    return {
      profile: null,
      metrics: defaultMetrics,
      recentDeliveries: [],
    };
  }
}

// -------------------------------------------------------------
// Available Deliveries Query
// -------------------------------------------------------------

export async function getAvailableDeliveries(params?: {
  search?: string;
  type?: string;
  testPartnerUserId?: string;
}): Promise<AvailableDeliverySummary[]> {
  try {
    await getAuthorizedDeliveryPartner(params?.testPartnerUserId);

    const results: AvailableDeliverySummary[] = [];

    // 1. Orders ready for delivery with no assignment
    const orderWhere: {
      status: "READY_FOR_DELIVERY";
      deliveryAssignment: null;
      orderNumber?: { contains: string; mode: "insensitive" };
    } = {
      status: "READY_FOR_DELIVERY",
      deliveryAssignment: null,
    };

    if (params?.search && params.search.trim()) {
      orderWhere.orderNumber = {
        contains: params.search.trim(),
        mode: "insensitive",
      };
    }

    if (!params?.type || params.type === "ALL" || params.type === "ORDER") {
      const orders = await prisma.order.findMany({
        where: orderWhere,
        take: 100,
        include: {
          items: {
            include: {
              product: {
                include: {
                  shop: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      for (const order of orders) {
        const itemsSummary = order.items
          .map((i: { productName: string; quantity: number }) => `${i.productName} (x${i.quantity})`)
          .join(", ");

        const firstShop = order.items[0]?.product?.shop;
        const pickupAddress = firstShop ? `${firstShop.name}, ${firstShop.address}, ${firstShop.district || ""}` : "Store Location";

        results.push({
          id: order.id,
          assignmentId: null,
          deliveryType: "ORDER",
          orderId: order.id,
          machineryBookingId: null,
          orderNumber: order.orderNumber,
          orderDate: order.createdAt.toISOString(),
          itemCount: order.items.reduce((acc: number, i: { quantity: number }) => acc + i.quantity, 0),
          pickupAddress,
          deliveryAddress: order.shippingAddress,
          deliveryArea: [order.shippingVillage, order.shippingDistrict].filter(Boolean).join(", ") || "Local Area",
          district: order.shippingDistrict,
          state: order.shippingState,
          pincode: order.shippingPincode,
          totalAmount: Number(order.totalAmount),
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          itemsSummary,
          deliveryWindow: "09:00 - 18:00",
          estimatedDistanceKm: 5.5,
          estimatedDurationMinutes: 20,
          requiredCapacity: "LIGHT",
        });
      }
    }

    // 2. Unassigned DeliveryAssignments (Orders or Machinery)
    const assignmentWhere: {
      deliveryPartnerId: null;
      status: { in: DeliveryStatus[] };
      deliveryType?: DeliveryType;
    } = {
      deliveryPartnerId: null,
      status: { in: ["PENDING_ASSIGNMENT", "RETURN_REQUESTED"] },
    };

    if (params?.type && params.type !== "ALL") {
      assignmentWhere.deliveryType = params.type as DeliveryType;
    }

    const assignments = await prisma.deliveryAssignment.findMany({
      where: assignmentWhere,
      include: {
        order: {
          include: { items: true },
        },
        machineryBooking: {
          include: {
            machinery: true,
            farmer: { select: { id: true, name: true, phone: true } },
            owner: { select: { id: true, name: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    for (const a of assignments) {
      if (a.deliveryType === "ORDER" && a.order) {
        const itemsSummary = a.order.items
          .map((i: { productName: string; quantity: number }) => `${i.productName} (x${i.quantity})`)
          .join(", ");

        results.push({
          id: a.id,
          assignmentId: a.id,
          deliveryType: "ORDER",
          orderId: a.order.id,
          machineryBookingId: null,
          orderNumber: a.order.orderNumber,
          orderDate: a.order.createdAt.toISOString(),
          itemCount: a.order.items.reduce((acc: number, i: { quantity: number }) => acc + i.quantity, 0),
          pickupAddress: a.pickupAddress || "Seller Location",
          pickupLatitude: a.pickupLatitude,
          pickupLongitude: a.pickupLongitude,
          deliveryAddress: a.dropAddress || a.order.shippingAddress,
          deliveryArea: [a.order.shippingVillage, a.order.shippingDistrict].filter(Boolean).join(", ") || "Local Area",
          district: a.order.shippingDistrict,
          state: a.order.shippingState,
          pincode: a.order.shippingPincode,
          dropLatitude: a.dropLatitude,
          dropLongitude: a.dropLongitude,
          totalAmount: Number(a.order.totalAmount),
          paymentMethod: a.order.paymentMethod,
          paymentStatus: a.order.paymentStatus,
          itemsSummary,
          deliveryWindow: a.deliveryWindow || "09:00 - 18:00",
          estimatedDistanceKm: a.estimatedDistanceKm,
          estimatedDurationMinutes: a.estimatedDurationMinutes,
          requiredCapacity: "LIGHT",
          deliveryNotes: a.deliveryNotes,
        });
      } else if (a.machineryBooking) {
        const booking = a.machineryBooking;
        const isReturn = a.deliveryType === "MACHINERY_RETURN";

        results.push({
          id: a.id,
          assignmentId: a.id,
          deliveryType: a.deliveryType,
          orderId: null,
          machineryBookingId: booking.id,
          orderNumber: booking.bookingNumber,
          orderDate: booking.createdAt.toISOString(),
          itemCount: 1,
          pickupAddress: a.pickupAddress || (isReturn ? booking.deliveryAddress || "Farmer Field" : booking.machinery.address || booking.machinery.location),
          pickupLatitude: a.pickupLatitude || (isReturn ? undefined : booking.machinery.latitude || undefined),
          pickupLongitude: a.pickupLongitude || (isReturn ? undefined : booking.machinery.longitude || undefined),
          deliveryAddress: a.dropAddress || (isReturn ? booking.machinery.address || booking.machinery.location : booking.deliveryAddress || "Farmer Field"),
          deliveryArea: isReturn ? booking.machinery.location : (booking.deliveryAddress || "Local Area"),
          district: null,
          state: null,
          pincode: null,
          dropLatitude: a.dropLatitude,
          dropLongitude: a.dropLongitude,
          totalAmount: Number(booking.totalAmount),
          paymentMethod: "ONLINE",
          paymentStatus: "PAID",
          itemsSummary: `${booking.machinery.name} (${booking.machinery.horsepower ? booking.machinery.horsepower + " HP" : "Machinery"})`,
          deliveryWindow: a.deliveryWindow || "Flexible",
          estimatedDistanceKm: a.estimatedDistanceKm,
          estimatedDurationMinutes: a.estimatedDurationMinutes,
          requiredCapacity: "HEAVY",
          deliveryNotes: a.deliveryNotes,
        });
      }
    }

    return results;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error fetching available deliveries:", error);
    return [];
  }
}

// -------------------------------------------------------------
// Partner's Deliveries List
// -------------------------------------------------------------

export async function getPartnerDeliveries(params?: {
  status?: string;
  search?: string;
  testPartnerUserId?: string;
}, testUserId?: string): Promise<PartnerDeliverySummary[]> {
  try {
    const { partner } = await getAuthorizedDeliveryPartner(params?.testPartnerUserId);

    const whereClause: {
      deliveryPartnerId: string;
      status?: DeliveryStatus;
    } = {
      deliveryPartnerId: partner.id,
    };

    if (params?.status && params.status !== "ALL") {
      whereClause.status = params.status as DeliveryStatus;
    }

    const assignments = await prisma.deliveryAssignment.findMany({
      where: whereClause,
      include: {
        order: {
          include: { items: true },
        },
        machineryBooking: {
          include: {
            machinery: true,
            farmer: { select: { id: true, name: true, phone: true } },
            owner: { select: { id: true, name: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return assignments.map((a) => {
      const isMachinery = a.deliveryType === "MACHINERY_RENTAL" || a.deliveryType === "MACHINERY_RETURN";
      const booking = a.machineryBooking;
      const order = a.order;

      const orderNumber = isMachinery
        ? booking?.bookingNumber || "MCH-RENTAL"
        : order?.orderNumber || "ORD-UNKNOWN";

      const customerName = isMachinery
        ? booking?.farmer.name || "Farmer"
        : order?.shippingName || "Customer";

      const customerPhone = isMachinery
        ? booking?.farmer.phone || "N/A"
        : order?.shippingPhone || "N/A";

      const deliveryAddress = a.dropAddress || (order ? order.shippingAddress : (booking?.deliveryAddress || "Field Address"));
      const deliveryArea = order
        ? [order.shippingVillage, order.shippingDistrict].filter(Boolean).join(", ") || "Local Area"
        : (booking?.machinery.location || "Local Area");

      const totalAmount = isMachinery
        ? Number(booking?.totalAmount || 0)
        : Number(order?.totalAmount || 0);

      const itemCount = isMachinery ? 1 : (order ? order.items.reduce((acc: number, i: { quantity: number }) => acc + i.quantity, 0) : 0);

      return {
        assignmentId: a.id,
        deliveryType: a.deliveryType,
        orderId: a.orderId,
        machineryBookingId: a.machineryBookingId,
        orderNumber,
        status: a.status,
        overallOrderStatus: order?.status || null,
        customerName,
        customerPhone,
        pickupAddress: a.pickupAddress,
        deliveryAddress,
        deliveryArea,
        pincode: order?.shippingPincode || null,
        totalAmount,
        paymentMethod: order?.paymentMethod || "COD",
        paymentStatus: order?.paymentStatus || "PAID",
        deliveryWindow: a.deliveryWindow,
        estimatedDistanceKm: a.estimatedDistanceKm,
        assignedAt: a.assignedAt?.toISOString() || a.createdAt.toISOString(),
        pickedUpAt: a.pickedUpAt?.toISOString() || null,
        outForDeliveryAt: a.outForDeliveryAt?.toISOString() || null,
        deliveredAt: a.deliveredAt?.toISOString() || null,
        itemCount,
        deliveryExceptionReason: a.deliveryExceptionReason,
      };
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error fetching partner deliveries:", error);
    return [];
  }
}

// -------------------------------------------------------------
// Partner Delivery Detail
// -------------------------------------------------------------

export async function getPartnerDeliveryDetail(
  identifier: string,
  testPartnerUserId?: string
): Promise<PartnerDeliveryDetail | null> {
  try {
    const { partner } = await getAuthorizedDeliveryPartner(testPartnerUserId);

    // Identifier can be assignmentId, orderId, or machineryBookingId
    const assignment = await prisma.deliveryAssignment.findFirst({
      where: {
        OR: [
          { id: identifier },
          { orderId: identifier },
          { machineryBookingId: identifier },
        ],
      },
      include: {
        order: {
          include: {
            items: true,
          },
        },
        machineryBooking: {
          include: {
            machinery: true,
            farmer: { select: { id: true, name: true, phone: true } },
            owner: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });

    if (!assignment || assignment.deliveryPartnerId !== partner.id) {
      return null;
    }

    const isMachinery = aIsMachinery(assignment.deliveryType);
    const booking = assignment.machineryBooking;
    const order = assignment.order;

    const orderNumber = isMachinery
      ? booking?.bookingNumber || "MCH-RENTAL"
      : order?.orderNumber || "ORD-UNKNOWN";

    const customerName = isMachinery
      ? (assignment.deliveryType === "MACHINERY_RETURN" ? booking?.owner.name || "Owner" : booking?.farmer.name || "Farmer")
      : order?.shippingName || "Customer";

    const customerPhone = isMachinery
      ? (assignment.deliveryType === "MACHINERY_RETURN" ? booking?.owner.phone || "N/A" : booking?.farmer.phone || "N/A")
      : order?.shippingPhone || "N/A";

    const shippingAddress = assignment.dropAddress || (order ? order.shippingAddress : (booking?.deliveryAddress || "Field Address"));

    const items = order
      ? order.items.map((i) => ({
          id: i.id,
          productName: i.productName,
          quantity: i.quantity,
          unit: i.unit,
          shopName: i.shopName,
          lineTotal: Number(i.lineTotal),
        }))
      : booking
      ? [
          {
            id: booking.id,
            productName: `${booking.machinery.name} (${booking.rentalMode})`,
            quantity: booking.quantity.toNumber(),
            unit: booking.rentalMode.toLowerCase(),
            shopName: booking.owner.name,
            lineTotal: Number(booking.totalAmount),
          },
        ]
      : [];

    const canConfirmPickup = assignment.status === "ASSIGNED";
    const canMarkOutForDelivery = assignment.status === "PICKED_UP";
    const canMarkDelivered = assignment.status === "OUT_FOR_DELIVERY" || assignment.status === "IN_TRANSIT";
    const canReportException = assignment.status === "ASSIGNED" || assignment.status === "PICKED_UP" || assignment.status === "OUT_FOR_DELIVERY" || assignment.status === "IN_TRANSIT";
    const canReschedule = assignment.status !== "DELIVERED" && assignment.status !== "RETURNED" && assignment.status !== "CANCELLED";

    return {
      assignmentId: assignment.id,
      deliveryType: assignment.deliveryType,
      orderId: assignment.orderId,
      machineryBookingId: assignment.machineryBookingId,
      orderNumber,
      deliveryStatus: assignment.status,
      overallOrderStatus: order?.status || null,
      customerName,
      customerPhone,
      pickupAddress: assignment.pickupAddress,
      pickupLatitude: assignment.pickupLatitude,
      pickupLongitude: assignment.pickupLongitude,
      shippingAddress,
      shippingVillage: order?.shippingVillage || null,
      shippingDistrict: order?.shippingDistrict || null,
      shippingState: order?.shippingState || null,
      shippingPincode: order?.shippingPincode || null,
      dropLatitude: assignment.dropLatitude,
      dropLongitude: assignment.dropLongitude,
      totalAmount: isMachinery ? Number(booking?.totalAmount || 0) : Number(order?.totalAmount || 0),
      paymentMethod: order?.paymentMethod || "ONLINE",
      paymentStatus: order?.paymentStatus || "PAID",
      deliveryCode: assignment.deliveryCode,
      deliveryWindow: assignment.deliveryWindow,
      scheduledPickupAt: assignment.scheduledPickupAt?.toISOString() || null,
      scheduledDeliveryAt: assignment.scheduledDeliveryAt?.toISOString() || null,
      estimatedDistanceKm: assignment.estimatedDistanceKm,
      estimatedDurationMinutes: assignment.estimatedDurationMinutes,
      deliveryNotes: assignment.deliveryNotes,
      recipientName: assignment.recipientName,
      proofImageUrl: assignment.proofImageUrl,
      deliveryExceptionReason: assignment.deliveryExceptionReason,
      rescheduleReason: assignment.rescheduleReason,
      assignedAt: assignment.assignedAt?.toISOString() || assignment.createdAt.toISOString(),
      pickedUpAt: assignment.pickedUpAt?.toISOString() || null,
      outForDeliveryAt: assignment.outForDeliveryAt?.toISOString() || null,
      deliveredAt: assignment.deliveredAt?.toISOString() || null,
      items,
      canConfirmPickup,
      canMarkOutForDelivery,
      canMarkDelivered,
      canReportException,
      canReschedule,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error fetching delivery detail:", error);
    return null;
  }
}

function aIsMachinery(type: DeliveryType): boolean {
  return type === "MACHINERY_RENTAL" || type === "MACHINERY_RETURN";
}

// -------------------------------------------------------------
// Accept Delivery Action (Concurrency-Safe)
// -------------------------------------------------------------

export async function acceptDelivery(
  identifier: string,
  testPartnerUserId?: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { partner } = await getAuthorizedDeliveryPartner(testPartnerUserId);

    if (!partner.isActive) {
      return { error: "Your delivery partner account is currently suspended. Please contact dispatch." };
    }

    if (!partner.isAvailable) {
      return { error: "You are currently set to Unavailable. Please toggle your status to Available in your profile before accepting deliveries." };
    }

    const maxLimit = partner.maxActiveDeliveries || DEFAULT_MAX_ACTIVE;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Atomic Active Deliveries Limit Check
      const activeCount = await tx.deliveryAssignment.count({
        where: {
          deliveryPartnerId: partner.id,
          status: { in: ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "IN_TRANSIT"] },
        },
      });

      if (activeCount >= maxLimit) {
        throw new Error(
          `You already have the maximum number of active deliveries (${maxLimit}). Please complete current deliveries before taking more.`
        );
      }

      // 2. Check if an assignment already exists by ID or orderId or machineryBookingId
      const existingAssignment = await tx.deliveryAssignment.findFirst({
        where: {
          OR: [
            { id: identifier },
            { orderId: identifier },
            { machineryBookingId: identifier },
          ],
        },
        include: {
          order: true,
          machineryBooking: { include: { machinery: true } },
        },
      });

      const deliveryCode = Math.floor(100000 + Math.random() * 900000).toString();

      if (existingAssignment) {
        if (existingAssignment.deliveryPartnerId) {
          throw new Error("This delivery has already been assigned to another partner.");
        }

        if (
          existingAssignment.status !== "PENDING_ASSIGNMENT" &&
          existingAssignment.status !== "RETURN_REQUESTED"
        ) {
          throw new Error("This delivery is no longer available for assignment.");
        }

        // Vehicle Capacity Check if machinery
        if (existingAssignment.deliveryType === "MACHINERY_RENTAL" || existingAssignment.deliveryType === "MACHINERY_RETURN") {
          if (partner.vehicleCapacity && partner.vehicleCapacity === "TWO_WHEELER") {
            throw new Error("This machinery delivery requires a Medium or Heavy vehicle.");
          }
        }

        await tx.deliveryAssignment.update({
          where: { id: existingAssignment.id },
          data: {
            deliveryPartnerId: partner.id,
            status: "ASSIGNED",
            deliveryCode,
            assignedAt: new Date(),
          },
        });

        // Notifications
        if (existingAssignment.deliveryType === "ORDER" && existingAssignment.order) {
          await notifyDeliveryAssigned({
            partnerUserId: partner.userId,
            farmerId: existingAssignment.order.userId,
            orderId: existingAssignment.order.id,
            orderNumber: existingAssignment.order.orderNumber,
            tx,
          });
        } else if (existingAssignment.machineryBooking) {
          await notifyMachineryDeliveryAssigned({
            partnerUserId: partner.userId,
            farmerId: existingAssignment.machineryBooking.farmerId,
            ownerId: existingAssignment.machineryBooking.ownerId,
            bookingId: existingAssignment.machineryBooking.id,
            assignmentId: existingAssignment.id,
            bookingNumber: existingAssignment.machineryBooking.bookingNumber,
            machineName: existingAssignment.machineryBooking.machinery.name,
            tx,
          });
        }

        return { success: true };
      }

      // 3. Fallback: Order ready for delivery without assignment
      const order = await tx.order.findUnique({
        where: { id: identifier },
        include: {
          deliveryAssignment: true,
          items: { include: { product: { include: { shop: true } } } },
        },
      });

      if (!order) {
        throw new Error("Delivery or order not found.");
      }

      if (order.status !== "READY_FOR_DELIVERY") {
        throw new Error("This order is no longer ready for delivery or has already progressed.");
      }

      if (order.deliveryAssignment) {
        throw new Error("This delivery has already been assigned.");
      }

      const firstShop = order.items[0]?.product?.shop;
      const pickupAddress = firstShop
        ? `${firstShop.name}, ${firstShop.address}, ${firstShop.district || ""}`
        : "Seller Store";

      await tx.deliveryAssignment.create({
        data: {
          orderId: order.id,
          deliveryPartnerId: partner.id,
          deliveryType: "ORDER",
          status: "ASSIGNED",
          deliveryCode,
          pickupAddress,
          dropAddress: order.shippingAddress,
          deliveryWindow: "09:00 - 18:00",
          assignedAt: new Date(),
        },
      });

      await notifyDeliveryAssigned({
        partnerUserId: partner.userId,
        farmerId: order.userId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        tx,
      });

      return { success: true };
    });

    safeRevalidate("/delivery/dashboard");
    safeRevalidate("/delivery/available");
    safeRevalidate("/delivery/orders");
    safeRevalidate(`/delivery/orders/${identifier}`);
    safeRevalidate(`/farmer/orders/${identifier}`);

    return result;
  } catch (error: unknown) {
    console.error("Error accepting delivery:", error);
    const msg = error instanceof Error ? error.message : "Failed to accept delivery.";
    return { error: msg };
  }
}

// -------------------------------------------------------------
// Confirm Pickup Action
// -------------------------------------------------------------

export async function confirmPickup(
  identifier: string,
  testPartnerUserId?: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { partner } = await getAuthorizedDeliveryPartner(testPartnerUserId);

    await prisma.$transaction(async (tx) => {
      const assignment = await tx.deliveryAssignment.findFirst({
        where: {
          OR: [
            { id: identifier },
            { orderId: identifier },
            { machineryBookingId: identifier },
          ],
        },
        include: {
          order: true,
          machineryBooking: { include: { machinery: true } },
        },
      });

      if (!assignment || assignment.deliveryPartnerId !== partner.id) {
        throw new Error("You do not have permission to manage this delivery.");
      }

      if (assignment.status !== "ASSIGNED") {
        throw new Error("Only newly assigned deliveries can be marked as picked up.");
      }

      await tx.deliveryAssignment.update({
        where: { id: assignment.id },
        data: {
          status: "PICKED_UP",
          pickedUpAt: new Date(),
        },
      });

      if (assignment.deliveryType === "ORDER" && assignment.order) {
        const orderWithShop = await tx.order.findUnique({
          where: { id: assignment.order.id },
          include: { items: { include: { shop: true, product: { include: { shop: true } } } } },
        });
        const firstItem = orderWithShop?.items[0];
        const shopOwnerId = firstItem?.shop?.userId || firstItem?.product?.shop?.userId || undefined;

        await notifyDeliveryPickedUp({
          farmerId: assignment.order.userId,
          shopOwnerId,
          orderId: assignment.order.id,
          orderNumber: assignment.order.orderNumber,
          tx,
        });
      } else if (assignment.machineryBooking) {
        if (assignment.deliveryType === "MACHINERY_RETURN") {
          await notifyMachineryReturnPickedUp({
            ownerId: assignment.machineryBooking.ownerId,
            farmerId: assignment.machineryBooking.farmerId,
            bookingId: assignment.machineryBooking.id,
            assignmentId: assignment.id,
            bookingNumber: assignment.machineryBooking.bookingNumber,
            machineName: assignment.machineryBooking.machinery.name,
            tx,
          });
        } else {
          await notifyMachineryDeliveryPickedUp({
            farmerId: assignment.machineryBooking.farmerId,
            ownerId: assignment.machineryBooking.ownerId,
            bookingId: assignment.machineryBooking.id,
            assignmentId: assignment.id,
            bookingNumber: assignment.machineryBooking.bookingNumber,
            machineName: assignment.machineryBooking.machinery.name,
            tx,
          });
        }
      }
    });

    safeRevalidate("/delivery/dashboard");
    safeRevalidate("/delivery/orders");
    safeRevalidate(`/delivery/orders/${identifier}`);

    return { success: true };
  } catch (error: unknown) {
    console.error("Error confirming pickup:", error);
    const msg = error instanceof Error ? error.message : "Failed to confirm pickup.";
    return { error: msg };
  }
}

// -------------------------------------------------------------
// Mark Out For Delivery / In Transit
// -------------------------------------------------------------

export async function markOutForDelivery(
  identifier: string,
  testPartnerUserId?: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { partner } = await getAuthorizedDeliveryPartner(testPartnerUserId);

    await prisma.$transaction(async (tx) => {
      const assignment = await tx.deliveryAssignment.findFirst({
        where: {
          OR: [
            { id: identifier },
            { orderId: identifier },
            { machineryBookingId: identifier },
          ],
        },
        include: {
          order: true,
          machineryBooking: { include: { machinery: true } },
        },
      });

      if (!assignment || assignment.deliveryPartnerId !== partner.id) {
        throw new Error("You do not have permission to manage this delivery.");
      }

      if (assignment.status !== "PICKED_UP") {
        throw new Error("Packages or machinery must be confirmed as picked up first.");
      }

      const newStatus = assignment.deliveryType === "MACHINERY_RETURN" ? "IN_TRANSIT" : "OUT_FOR_DELIVERY";

      await tx.deliveryAssignment.update({
        where: { id: assignment.id },
        data: {
          status: newStatus,
          outForDeliveryAt: new Date(),
        },
      });

      if (assignment.deliveryType === "ORDER" && assignment.order) {
        await tx.order.update({
          where: { id: assignment.order.id },
          data: { status: "OUT_FOR_DELIVERY" },
        });

        await notifyDeliveryOutForDelivery({
          farmerId: assignment.order.userId,
          orderId: assignment.order.id,
          orderNumber: assignment.order.orderNumber,
          tx,
        });
      }
    });

    safeRevalidate("/delivery/dashboard");
    safeRevalidate("/delivery/orders");
    safeRevalidate(`/delivery/orders/${identifier}`);

    return { success: true };
  } catch (error: unknown) {
    console.error("Error marking out for delivery:", error);
    const msg = error instanceof Error ? error.message : "Failed to mark out for delivery.";
    return { error: msg };
  }
}

// -------------------------------------------------------------
// Mark Delivered / Completed
// -------------------------------------------------------------

export async function markDelivered(
  identifier: string,
  enteredCode?: string,
  options?: {
    recipientName?: string;
    proofImageUrl?: string;
  },
  testPartnerUserId?: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { partner } = await getAuthorizedDeliveryPartner(testPartnerUserId);

    await prisma.$transaction(async (tx) => {
      const assignment = await tx.deliveryAssignment.findFirst({
        where: {
          OR: [
            { id: identifier },
            { orderId: identifier },
            { machineryBookingId: identifier },
          ],
        },
        include: {
          order: true,
          machineryBooking: { include: { machinery: true } },
        },
      });

      if (!assignment || assignment.deliveryPartnerId !== partner.id) {
        throw new Error("You do not have permission to complete this delivery.");
      }

      if (
        assignment.status !== "OUT_FOR_DELIVERY" &&
        assignment.status !== "IN_TRANSIT"
      ) {
        throw new Error("Only shipments currently in transit or out for delivery can be completed.");
      }

      // OTP Verification if deliveryCode is set
      if (assignment.deliveryCode && enteredCode) {
        if (assignment.deliveryCode.trim() !== enteredCode.trim()) {
          throw new Error("Invalid delivery confirmation code. Please enter the correct 6-digit OTP.");
        }
      }

      const isReturn = assignment.deliveryType === "MACHINERY_RETURN";
      const finalStatus: DeliveryStatus = isReturn ? "RETURNED" : "DELIVERED";

      await tx.deliveryAssignment.update({ where: { id: assignment.id }, data: { status: finalStatus, deliveredAt: new Date(), recipientName: options?.recipientName || null, proofImageUrl: options?.proofImageUrl || null } });
        await tx.auditLog.create({ data: { actorUserId: partner.userId, actorRole: "DELIVERY_PARTNER", action: finalStatus === "RETURNED" ? "DELIVERY_RETURNED" : "DELIVERY_COMPLETED", entityType: "DeliveryAssignment", entityId: assignment.id, metadata: { recipientName: options?.recipientName || null } } });

      if (assignment.deliveryType === "ORDER" && assignment.order) {
        await tx.order.update({
          where: { id: assignment.order.id },
          data: {
            status: "DELIVERED",
            // Requirement: Do not mark COD as PAID merely because delivery OTP is correct. Keep payment status separate.
          },
        });

        await tx.orderItem.updateMany({
          where: { orderId: assignment.order.id },
          data: { status: "DELIVERED" },
        });

        const orderWithShop = await tx.order.findUnique({
          where: { id: assignment.order.id },
          include: { items: { include: { shop: true, product: { include: { shop: true } } } } },
        });
        const firstItem = orderWithShop?.items[0];
        const shopOwnerId = firstItem?.shop?.userId || firstItem?.product?.shop?.userId || undefined;

        await notifyDeliveryDelivered({
          farmerId: assignment.order.userId,
          shopOwnerId,
          orderId: assignment.order.id,
          orderNumber: assignment.order.orderNumber,
          tx,
        });
      } else if (assignment.machineryBooking) {
        const booking = assignment.machineryBooking;
        if (isReturn) {
          // Completed return
          await tx.machineryBooking.update({
            where: { id: booking.id },
            data: { status: "COMPLETED" },
          });

          await notifyMachineryReturnCompleted({
            ownerId: booking.ownerId,
            farmerId: booking.farmerId,
            bookingId: booking.id,
            assignmentId: assignment.id,
            bookingNumber: booking.bookingNumber,
            machineName: booking.machinery.name,
            tx,
          });
        } else {
          // Outbound delivery delivered -> Mark booking ACTIVE or READY
          await tx.machineryBooking.update({
            where: { id: booking.id },
            data: { status: "ACTIVE" },
          });

          await notifyMachineryDeliveryDelivered({
            farmerId: booking.farmerId,
            ownerId: booking.ownerId,
            bookingId: booking.id,
            assignmentId: assignment.id,
            bookingNumber: booking.bookingNumber,
            machineName: booking.machinery.name,
            tx,
          });
        }
      }
    });

    safeRevalidate("/delivery/dashboard");
    safeRevalidate("/delivery/orders");
    safeRevalidate(`/delivery/orders/${identifier}`);

    return { success: true };
  } catch (error: unknown) {
    console.error("Error marking delivered:", error);
    const msg = error instanceof Error ? error.message : "Failed to confirm delivery.";
    return { error: msg };
  }
}

// -------------------------------------------------------------
// Delivery Exceptions & Rescheduling
// -------------------------------------------------------------

export async function recordDeliveryException(
  assignmentId: string,
  reason: string,
  testPartnerUserId?: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { partner } = await getAuthorizedDeliveryPartner(testPartnerUserId);

    if (!reason || reason.trim().length < 3) {
      return { error: "Please provide a valid reason for the delivery exception." };
    }

    await prisma.$transaction(async (tx) => {
      const assignment = await tx.deliveryAssignment.findUnique({
        where: { id: assignmentId },
        include: {
          order: true,
          machineryBooking: true,
        },
      });

      if (!assignment || assignment.deliveryPartnerId !== partner.id) {
        throw new Error("You do not have permission to modify this delivery.");
      }

      await tx.deliveryAssignment.update({
        where: { id: assignment.id }, data: { status: "EXCEPTION", deliveryExceptionReason: reason.trim() } });
        await tx.auditLog.create({ data: { actorUserId: partner.userId, actorRole: "DELIVERY_PARTNER", action: "DELIVERY_EXCEPTION", entityType: "DeliveryAssignment", entityId: assignmentId, metadata: { reason: reason.trim() } } });

      const orderNumber = assignment.order?.orderNumber || assignment.machineryBooking?.bookingNumber || "DELIVERY";
      const farmerId = assignment.order?.userId || assignment.machineryBooking?.farmerId || null;

      await notifyDeliveryException({
        partnerUserId: partner.userId,
        farmerId,
        assignmentId: assignment.id,
        orderNumber,
        reason: reason.trim(),
        tx,
      });
    });

    safeRevalidate("/delivery/dashboard");
    safeRevalidate("/delivery/orders");
    safeRevalidate(`/delivery/orders/${assignmentId}`);

    return { success: true };
  } catch (error: unknown) {
    console.error("Error recording delivery exception:", error);
    const msg = error instanceof Error ? error.message : "Failed to record exception.";
    return { error: msg };
  }
}

export async function rescheduleDelivery(assignmentId: string, newWindow: string, newDate?: string, reason?: string, testPartnerUserId?: string): Promise<{ success?: boolean; error?: string }> {
  try {
    if (!newWindow || !newWindow.trim()) {
      return { error: "Delivery window is required." };
    }

    await prisma.$transaction(async (tx) => {
      const assignment = await tx.deliveryAssignment.findUnique({
        where: { id: assignmentId },
        include: {
          order: true,
          machineryBooking: true,
          deliveryPartner: { select: { userId: true } },
        },
      });

      if (!assignment) {
        throw new Error("Delivery assignment not found.");
      }

      const updateData: {
        deliveryWindow: string;
        rescheduleReason: string | null;
        scheduledDeliveryAt?: Date;
        status?: DeliveryStatus;
      } = {
        deliveryWindow: newWindow.trim(),
        rescheduleReason: reason ? reason.trim() : null,
      };

      if (newDate) {
        updateData.scheduledDeliveryAt = new Date(newDate);
      }

      // If status was in EXCEPTION, reset it back to ASSIGNED (or OUT_FOR_DELIVERY)
      if (assignment.status === "EXCEPTION") {
        updateData.status = "ASSIGNED";
      }

      await tx.deliveryAssignment.update({
        where: { id: assignment.id },
        data: updateData,
      });

      const orderNumber = assignment.order?.orderNumber || assignment.machineryBooking?.bookingNumber || "DELIVERY";
      const farmerId = assignment.order?.userId || assignment.machineryBooking?.farmerId || null;

      await notifyDeliveryRescheduled({
        partnerUserId: assignment.deliveryPartner?.userId || null,
        farmerId,
        assignmentId: assignment.id,
        orderNumber,
        newWindow: newWindow.trim(),
        tx,
      });
    });

    safeRevalidate("/delivery/dashboard");
    safeRevalidate("/delivery/orders");
    safeRevalidate(`/delivery/orders/${assignmentId}`);

    return { success: true };
  } catch (error: unknown) {
    console.error("Error rescheduling delivery:", error);
    const msg = error instanceof Error ? error.message : "Failed to reschedule delivery.";
    return { error: msg };
  }
}

// -------------------------------------------------------------
// Machinery Logistics Dispatch & Return Actions
// -------------------------------------------------------------

export async function requestMachineryDelivery(bookingId: string, deliveryWindow?: string, notes?: string, testUserId?: string): Promise<{ success?: boolean; assignmentId?: string; error?: string }> {
  try {
    const booking = await prisma.machineryBooking.findUnique({
      where: { id: bookingId },
      include: {
        machinery: true,
        deliveryAssignments: true,
      },
    });

    if (!booking) {
      return { error: "Machinery booking not found." };
    }

    // Check if an outbound delivery already exists
    const existing = booking.deliveryAssignments.find(
      (a) => a.deliveryType === "MACHINERY_RENTAL" && a.status !== "CANCELLED"
    );

    if (existing) {
      return { success: true, assignmentId: existing.id };
    }

    const pickupAddress = booking.machinery.address || booking.machinery.location || "Owner Yard";
    const dropAddress = booking.deliveryAddress || "Farmer Farm";

    const assignment = await prisma.deliveryAssignment.create({
      data: {
        machineryBookingId: booking.id,
        deliveryType: "MACHINERY_RENTAL",
        status: "PENDING_ASSIGNMENT",
        pickupAddress,
        pickupLatitude: booking.machinery.latitude,
        pickupLongitude: booking.machinery.longitude,
        dropAddress,
        deliveryWindow: deliveryWindow || "09:00 - 14:00",
        deliveryNotes: notes || null,
        estimatedDistanceKm: 12.0,
        estimatedDurationMinutes: 35,
      },
    });

    safeRevalidate(`/farmer/machinery/bookings/${bookingId}`);
    safeRevalidate("/delivery/available");

    return { success: true, assignmentId: assignment.id };
  } catch (error: unknown) {
    console.error("Error requesting machinery delivery:", error);
    const msg = error instanceof Error ? error.message : "Failed to request machinery delivery.";
    return { error: msg };
  }
}

export async function requestMachineryReturn(bookingId: string, returnWindow?: string, notes?: string, testUserId?: string): Promise<{ success?: boolean; assignmentId?: string; error?: string }> {
  try {
    const booking = await prisma.machineryBooking.findUnique({
      where: { id: bookingId },
      include: {
        machinery: true,
        deliveryAssignments: true,
      },
    });

    if (!booking) {
      return { error: "Machinery booking not found." };
    }

    if (booking.status !== "ACTIVE" && booking.status !== "READY" && booking.status !== "CONFIRMED") {
      return { error: `Cannot request return for booking in '${booking.status}' status.` };
    }

    // Check if an active return request already exists
    const existingReturn = booking.deliveryAssignments.find(
      (a) => a.deliveryType === "MACHINERY_RETURN" && a.status !== "CANCELLED" && a.status !== "RETURNED"
    );

    if (existingReturn) {
      return { success: true, assignmentId: existingReturn.id };
    }

    const pickupAddress = booking.deliveryAddress || "Farmer Farm";
    const dropAddress = booking.machinery.address || booking.machinery.location || "Owner Yard";

    const assignment = await prisma.deliveryAssignment.create({
      data: {
        machineryBookingId: booking.id,
        deliveryType: "MACHINERY_RETURN",
        status: "RETURN_REQUESTED",
        pickupAddress,
        dropAddress,
        dropLatitude: booking.machinery.latitude,
        dropLongitude: booking.machinery.longitude,
        deliveryWindow: returnWindow || "14:00 - 18:00",
        deliveryNotes: notes || "Farmer equipment return",
        estimatedDistanceKm: 12.0,
        estimatedDurationMinutes: 35,
      },
    });

    await notifyMachineryReturnRequested({
      ownerId: booking.ownerId,
      farmerId: booking.farmerId,
      bookingId: booking.id,
      assignmentId: assignment.id,
      bookingNumber: booking.bookingNumber,
      machineName: booking.machinery.name,
    });

    safeRevalidate(`/farmer/machinery/bookings/${bookingId}`);
    safeRevalidate("/delivery/available");

    return { success: true, assignmentId: assignment.id };
  } catch (error: unknown) {
    console.error("Error requesting machinery return:", error);
    const msg = error instanceof Error ? error.message : "Failed to request machinery return.";
    return { error: msg };
  }
}

// -------------------------------------------------------------
// Admin Logistics Control & Fleet Actions
// -------------------------------------------------------------

export async function getAdminLogisticsData(
  filters?: {
    type?: string;
    status?: string;
    partnerId?: string;
    search?: string;
    page?: number;
  },
  testAdminUserId?: string
): Promise<{
  metrics: AdminLogisticsMetrics;
  deliveries: AdminDeliveryItem[];
  partners: AdminPartnerItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  try {
    await getAdminUser(testAdminUserId);

    const page = filters?.page || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    const where: Prisma.DeliveryAssignmentWhereInput = {};

    if (filters?.type && filters.type !== "ALL") {
      where.deliveryType = filters.type as DeliveryType;
    }
    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status as DeliveryStatus;
    }
    if (filters?.partnerId && filters.partnerId !== "ALL") {
      where.deliveryPartnerId = filters.partnerId;
    }
    if (filters?.search) {
      where.OR = [
        { id: { contains: filters.search, mode: "insensitive" } },
        { orderId: { contains: filters.search, mode: "insensitive" } },
        { order: { orderNumber: { contains: filters.search, mode: "insensitive" } } },
        { order: { user: { name: { contains: filters.search, mode: "insensitive" } } } },
        { machineryBooking: { bookingNumber: { contains: filters.search, mode: "insensitive" } } },
      ];
    }

    // Ensure all READY_FOR_DELIVERY orders have a DeliveryAssignment record so they appear in logistics
    try {
      const unassignedReadyOrders = await prisma.order.findMany({
        where: {
          status: "READY_FOR_DELIVERY",
          deliveryAssignment: null,
        },
        include: {
          items: {
            take: 1,
            include: {
              shop: true,
              product: { include: { shop: true } },
            },
          },
        },
      });

      if (unassignedReadyOrders.length > 0) {
        for (const ord of unassignedReadyOrders) {
          const firstShop = ord.items[0]?.shop || ord.items[0]?.product?.shop;
          const pickupAddress = firstShop
            ? [firstShop.name, firstShop.address, firstShop.village, firstShop.district, firstShop.state].filter(Boolean).join(", ")
            : "Seller Store";
          const dropAddress = [
            ord.shippingAddress,
            ord.shippingVillage,
            ord.shippingDistrict,
            ord.shippingState,
            ord.shippingPincode ? `PIN: ${ord.shippingPincode}` : null,
          ].filter(Boolean).join(", ");

          await prisma.deliveryAssignment.upsert({
            where: { orderId: ord.id },
            create: {
              orderId: ord.id,
              deliveryType: "ORDER",
              status: "PENDING_ASSIGNMENT",
              pickupAddress,
              pickupLatitude: firstShop?.latitude || null,
              pickupLongitude: firstShop?.longitude || null,
              dropAddress,
              recipientName: ord.shippingName,
              deliveryWindow: "09:00 - 18:00",
            },
            update: {},
          });
        }
      }
    } catch {
      // Non-blocking sync
    }

    const [totalDeliveriesForPagination, assignments] = await Promise.all([
      prisma.deliveryAssignment.count({ where }),
      prisma.deliveryAssignment.findMany({
        where,
        skip,
        take: limit,
        include: {
          order: {
            include: {
              items: {
                take: 1,
                include: {
                  shop: true,
                  product: { include: { shop: true } },
                },
              },
            },
          },
          machineryBooking: {
            include: {
              machinery: true,
              farmer: { select: { name: true, phone: true } },
              owner: { select: { name: true, phone: true } },
            },
          },
          deliveryPartner: {
            include: {
              user: { select: { name: true, phone: true, isActive: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const totalPages = Math.ceil(totalDeliveriesForPagination / limit);

    // 2. Fetch all partners with their live active loads
    const partnersData = await prisma.deliveryPartner.findMany({
      include: {
        user: { select: { name: true, phone: true, isActive: true } },
        assignments: {
          where: {
            status: { in: ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "IN_TRANSIT"] },
          },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const partners: AdminPartnerItem[] = partnersData.map((p) => ({
      id: p.id,
      name: p.user.name || "Delivery Partner",
      phone: p.phone || p.user.phone || null,
      vehicleType: p.vehicleType,
      vehicleNumber: p.vehicleNumber,
      vehicleCapacity: p.vehicleCapacity,
      serviceArea: p.serviceArea || null,
      isAvailable: p.isAvailable,
      isActive: p.isActive,
      userIsActive: p.user.isActive,
      activeDeliveriesCount: p.assignments.length,
      maxActiveDeliveries: p.maxActiveDeliveries || DEFAULT_MAX_ACTIVE,
    }));

    // 3. Transform deliveries
    const deliveries: AdminDeliveryItem[] = assignments.map((a) => {
      const isMachinery = a.deliveryType === "MACHINERY_RENTAL" || a.deliveryType === "MACHINERY_RETURN";
      const identifier = isMachinery
        ? a.machineryBooking?.bookingNumber || "MCH-RENTAL"
        : a.order?.orderNumber || "ORD-UNKNOWN";

      const recipientName = isMachinery
        ? (a.deliveryType === "MACHINERY_RETURN" ? a.machineryBooking?.owner.name || "Owner" : a.machineryBooking?.farmer.name || "Farmer")
        : a.order?.shippingName || "Customer";

      const recipientPhone = isMachinery
        ? (a.deliveryType === "MACHINERY_RETURN" ? a.machineryBooking?.owner.phone || "N/A" : a.machineryBooking?.farmer.phone || "N/A")
        : a.order?.shippingPhone || "N/A";

      const totalAmount = isMachinery
        ? Number(a.machineryBooking?.totalAmount || 0)
        : Number(a.order?.totalAmount || 0);

      const shopName =
        a.order?.items?.[0]?.shop?.name ||
        a.order?.items?.[0]?.product?.shop?.name ||
        null;

      return {
        id: a.id,
        deliveryType: a.deliveryType,
        status: a.status,
        orderId: a.orderId,
        orderStatus: a.order?.status || null,
        orderDate: a.order?.createdAt ? a.order.createdAt.toISOString() : a.createdAt.toISOString(),
        shopName,
        machineryBookingId: a.machineryBookingId,
        identifier,
        recipientName,
        recipientPhone,
        pickupAddress: a.pickupAddress || "Pickup Point",
        dropAddress: a.dropAddress || "Delivery Address",
        deliveryWindow: a.deliveryWindow,
        partnerId: a.deliveryPartnerId,
        partnerName: a.deliveryPartner?.user.name || null,
        partnerPhone: a.deliveryPartner?.phone || a.deliveryPartner?.user.phone || null,
        totalAmount,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
        estimatedDistanceKm: a.estimatedDistanceKm,
        deliveryExceptionReason: a.deliveryExceptionReason,
      };
    });

    // 4. Metrics
    const allAssignments = await prisma.deliveryAssignment.findMany({
      select: { status: true },
    });

    let pendingCount = 0;
    let activeInTransit = 0;
    let deliveredCount = 0;
    let exceptionsCount = 0;

    for (const a of allAssignments) {
      if (a.status === "PENDING_ASSIGNMENT" || a.status === "RETURN_REQUESTED") pendingCount++;
      else if (a.status === "ASSIGNED" || a.status === "PICKED_UP" || a.status === "OUT_FOR_DELIVERY" || a.status === "IN_TRANSIT") activeInTransit++;
      else if (a.status === "DELIVERED" || a.status === "RETURNED") deliveredCount++;
      else if (a.status === "EXCEPTION") exceptionsCount++;
    }

    const activePartnersCount = await prisma.deliveryPartner.count({ where: { isActive: true, isAvailable: true } });

    return {
      metrics: {
        totalDeliveries: totalDeliveriesForPagination,
        pendingAssignment: pendingCount || 0,
        activeInTransit: activeInTransit || 0,
        deliveredCount: deliveredCount || 0,
        exceptionsCount: exceptionsCount || 0,
        activePartnersCount: activePartnersCount || 0,
      },
      deliveries,
      partners,
      pagination: {
        page: filters?.page || 1,
        limit: 50,
        total: totalDeliveriesForPagination,
        totalPages: Math.ceil(totalDeliveriesForPagination / 50)
      }
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error fetching admin logistics data:", error);
    return {
      metrics: { totalDeliveries: 0, pendingAssignment: 0, activeInTransit: 0, deliveredCount: 0, exceptionsCount: 0, activePartnersCount: 0 }, deliveries: [], partners: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
    };
  }
}

export type ManualAssignOptions = {
  isOverride?: boolean;
  overrideReason?: string;
  reassignReason?: string;
};

export async function assignDelivery(
  assignmentId: string,
  partnerId: string,
  optionsOrAdminUserId?: ManualAssignOptions | string,
  maybeAdminUserId?: string
): Promise<{ success: boolean; error?: string; message?: string; isReassignment?: boolean }> {
  const options: ManualAssignOptions =
    typeof optionsOrAdminUserId === "object" && optionsOrAdminUserId !== null
      ? optionsOrAdminUserId
      : {};
  const testAdminUserId =
    typeof optionsOrAdminUserId === "string"
      ? optionsOrAdminUserId
      : maybeAdminUserId;

  try {
    const adminUser = await getAdminUser(testAdminUserId);

    return await prisma.$transaction(async (tx) => {
      // 1. Fetch assignment record (by assignmentId or orderId)
      let assignment = await tx.deliveryAssignment.findFirst({
        where: {
          OR: [{ id: assignmentId }, { orderId: assignmentId }],
        },
        include: {
          order: {
            include: {
              items: {
                take: 1,
                include: {
                  shop: true,
                  product: { include: { shop: true } },
                },
              },
            },
          },
          machineryBooking: { include: { machinery: true } },
          deliveryPartner: { include: { user: true } },
        },
      });

      // If assignment record doesn't exist yet, create on-demand if assignmentId matches an orderId
      if (!assignment) {
        const order = await tx.order.findUnique({
          where: { id: assignmentId },
          include: {
            items: {
              take: 1,
              include: {
                shop: true,
                product: { include: { shop: true } },
              },
            },
          },
        });

        if (order) {
          const firstShop = order.items[0]?.shop || order.items[0]?.product?.shop;
          const pickupAddress = firstShop
            ? [firstShop.name, firstShop.address, firstShop.village, firstShop.district, firstShop.state].filter(Boolean).join(", ")
            : "Seller Store";
          const dropAddress = [
            order.shippingAddress,
            order.shippingVillage,
            order.shippingDistrict,
            order.shippingState,
            order.shippingPincode ? `PIN: ${order.shippingPincode}` : null,
          ].filter(Boolean).join(", ");

          assignment = await tx.deliveryAssignment.create({
            data: {
              orderId: order.id,
              deliveryType: "ORDER",
              status: "PENDING_ASSIGNMENT",
              pickupAddress,
              pickupLatitude: firstShop?.latitude || null,
              pickupLongitude: firstShop?.longitude || null,
              dropAddress,
              recipientName: order.shippingName,
              deliveryWindow: "09:00 - 18:00",
            },
            include: {
              order: {
                include: {
                  items: {
                    take: 1,
                    include: {
                      shop: true,
                      product: { include: { shop: true } },
                    },
                  },
                },
              },
              machineryBooking: { include: { machinery: true } },
              deliveryPartner: { include: { user: true } },
            },
          });
        }
      }

      if (!assignment) {
        return { success: false, error: "Delivery assignment or order not found." };
      }

      // Check terminal states: cannot reassign delivered or cancelled shipments
      if (
        assignment.status === "DELIVERED" ||
        assignment.status === "RETURNED" ||
        assignment.status === "CANCELLED"
      ) {
        return {
          success: false,
          error: `Cannot assign or reassign a delivery that is already ${assignment.status.toLowerCase().replace(/_/g, " ")}.`,
        };
      }

      // Check if already assigned to this exact partner
      if (assignment.deliveryPartnerId === partnerId) {
        return {
          success: false,
          error: "This delivery is already assigned to the selected partner.",
        };
      }

      // 2. Query target partner with current active workload
      const partner = await tx.deliveryPartner.findUnique({
        where: { id: partnerId },
        include: {
          user: true,
          assignments: {
            where: {
              status: { in: ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "IN_TRANSIT"] },
            },
            select: { id: true },
          },
        },
      });

      if (!partner) {
        return { success: false, error: "Delivery partner not found." };
      }

      // STRICT CHECK: Suspended or Inactive accounts can NEVER receive assignments (even with override)
      if (!partner.isActive || !partner.user.isActive) {
        return {
          success: false,
          error: "Suspended or inactive delivery partners cannot receive assignments under any circumstances.",
        };
      }

      // Role check
      if (partner.user.role !== "DELIVERY_PARTNER") {
        return {
          success: false,
          error: "Selected user does not have the DELIVERY_PARTNER role.",
        };
      }

      const isOverride = Boolean(options.isOverride);

      // Availability check: must be online unless explicit admin override
      if (!partner.isAvailable && !isOverride) {
        return {
          success: false,
          error: "Selected partner is currently off-duty or unavailable. Enable Admin Override if this is an operational exception.",
        };
      }

      // Capacity check: active deliveries must be less than limit unless explicit admin override
      const maxLimit = partner.maxActiveDeliveries || DEFAULT_MAX_ACTIVE;
      if (partner.assignments.length >= maxLimit && !isOverride) {
        return {
          success: false,
          error: `Selected partner has reached active delivery capacity (${maxLimit}). Enable Admin Override if this is an operational exception.`,
        };
      }

      const isReassignment = Boolean(assignment.deliveryPartnerId);
      const previousPartner = assignment.deliveryPartner;
      const deliveryCode =
        assignment.deliveryCode ||
        Math.floor(100000 + Math.random() * 900000).toString();

      // 3. Update assignment: preserve existing status progress if already picked up / in transit
      const nextStatus =
        assignment.status === "PENDING_ASSIGNMENT" ? "ASSIGNED" : assignment.status;

      await tx.deliveryAssignment.update({
        where: { id: assignment.id },
        data: {
          deliveryPartnerId: partner.id,
          status: nextStatus,
          deliveryCode,
          assignedAt: new Date(),
        },
      });

      // 4. Immutable Audit Log
      const auditAction = isReassignment
        ? isOverride
          ? "DELIVERY_REASSIGNED_OVERRIDE"
          : "DELIVERY_REASSIGNED"
        : isOverride
        ? "DELIVERY_ASSIGNED_OVERRIDE"
        : "DELIVERY_ASSIGNED";

      const orderNumber =
        assignment.order?.orderNumber ||
        assignment.machineryBooking?.bookingNumber ||
        "RUN";

      try {
        await tx.auditLog.create({
          data: {
            actorUserId: adminUser.id,
            actorRole: "ADMIN",
            action: auditAction,
            entityType: "DeliveryAssignment",
            entityId: assignment.id,
            metadata: {
              assignmentId: assignment.id,
              orderId: assignment.orderId,
              machineryBookingId: assignment.machineryBookingId,
              orderNumber,
              isReassignment,
              previousPartnerId: previousPartner?.id || null,
              previousPartnerName: previousPartner?.user?.name || null,
              newPartnerId: partner.id,
              newPartnerName: partner.user.name,
              isOverride,
              overrideReason: isOverride ? options.overrideReason || "Admin manual operational override" : null,
              reassignReason: isReassignment ? options.reassignReason || null : null,
              partnerDutyStatus: partner.isAvailable ? "ON_DUTY" : "OFF_DUTY",
              partnerActiveLoad: partner.assignments.length,
              timestamp: new Date().toISOString(),
            },
          },
        });
      } catch {
        // Non-blocking audit log
      }

      // 5. Notifications
      const firstItem = assignment.order?.items?.[0];
      const shopOwnerId =
        firstItem?.shop?.userId ||
        firstItem?.product?.shop?.userId ||
        undefined;

      if (isReassignment) {
        await notifyDeliveryReassigned({
          newPartnerUserId: partner.userId,
          previousPartnerUserId: previousPartner?.userId,
          farmerId: assignment.order?.userId,
          shopOwnerId,
          orderId: assignment.order?.id || assignment.id,
          orderNumber,
          tx,
        });
      } else {
        if (assignment.deliveryType === "ORDER" && assignment.order) {
          await notifyDeliveryAssigned({
            partnerUserId: partner.userId,
            farmerId: assignment.order.userId,
            shopOwnerId,
            orderId: assignment.order.id,
            orderNumber: assignment.order.orderNumber,
            tx,
          });
        } else if (assignment.machineryBooking) {
          await notifyMachineryDeliveryAssigned({
            partnerUserId: partner.userId,
            farmerId: assignment.machineryBooking.farmerId,
            ownerId: assignment.machineryBooking.ownerId,
            bookingId: assignment.machineryBooking.id,
            assignmentId: assignment.id,
            bookingNumber: assignment.machineryBooking.bookingNumber,
            machineName: assignment.machineryBooking.machinery.name,
            tx,
          });
        }
      }

      return {
        success: true,
        isReassignment,
        message: isReassignment
          ? `Delivery #${orderNumber} successfully reassigned to ${partner.user.name || "partner"}.`
          : `Delivery #${orderNumber} successfully assigned to ${partner.user.name || "partner"}.`,
      };
    });
  } catch (error: unknown) {
    if (isRedirectError(error)) throw error;
    console.error("Error assigning delivery:", error);
    const msg = error instanceof Error ? error.message : "Failed to assign delivery.";
    return { success: false, error: msg };
  } finally {
    safeRevalidate("/admin/logistics");
    safeRevalidate("/delivery/dashboard");
    safeRevalidate("/delivery/available");
    safeRevalidate("/delivery/orders");
  }
}

export async function manualAssignDelivery(params: {
  assignmentId: string;
  partnerId: string;
  isOverride?: boolean;
  overrideReason?: string;
  reassignReason?: string;
  testAdminUserId?: string;
}): Promise<{ success: boolean; error?: string; message?: string; isReassignment?: boolean }> {
  return assignDelivery(
    params.assignmentId,
    params.partnerId,
    {
      isOverride: params.isOverride,
      overrideReason: params.overrideReason,
      reassignReason: params.reassignReason,
    },
    params.testAdminUserId
  );
}

export async function reassignDelivery(
  assignmentId: string,
  newPartnerId: string,
  reason?: string,
  options?: {
    isOverride?: boolean;
    overrideReason?: string;
  },
  testAdminUserId?: string
): Promise<{ success: boolean; error?: string; message?: string; isReassignment?: boolean }> {
  return assignDelivery(
    assignmentId,
    newPartnerId,
    {
      isOverride: options?.isOverride,
      overrideReason: options?.overrideReason,
      reassignReason: reason,
    },
    testAdminUserId
  );
}

export async function cancelDeliveryAssignment(
  assignmentId: string,
  reason?: string,
  testAdminUserId?: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    await getAdminUser(testAdminUserId);

    await prisma.$transaction(async (tx) => {
      const assignment = await tx.deliveryAssignment.findUnique({
        where: { id: assignmentId },
        include: {
          order: true,
          machineryBooking: true,
          deliveryPartner: { select: { userId: true } },
        },
      });

      if (!assignment) {
        throw new Error("Delivery assignment not found.");
      }

      await tx.deliveryAssignment.update({
        where: { id: assignmentId },
        data: {
          status: "CANCELLED",
          deliveryExceptionReason: reason || "Cancelled by admin",
        },
      });

      const orderNumber = assignment.order?.orderNumber || assignment.machineryBooking?.bookingNumber || "DELIVERY";
      const farmerId = assignment.order?.userId || assignment.machineryBooking?.farmerId || null;

      await notifyDeliveryCancelled({
        partnerUserId: assignment.deliveryPartner?.userId || null,
        farmerId,
        assignmentId: assignment.id,
        orderNumber,
        reason,
        tx,
      });
    });

    safeRevalidate("/admin/logistics");
    safeRevalidate("/delivery/dashboard");

    return { success: true };
  } catch (error: unknown) {
    console.error("Error cancelling delivery assignment:", error);
    const msg = error instanceof Error ? error.message : "Failed to cancel delivery.";
    return { error: msg };
  }
}

// -------------------------------------------------------------
// Partner Location & Status
// -------------------------------------------------------------

export async function toggleAvailability(
  testPartnerUserId?: string
): Promise<{ success?: boolean; isAvailable?: boolean; error?: string }> {
  try {
    const { partner } = await getAuthorizedDeliveryPartner(testPartnerUserId);

    if (!partner.isActive || !partner.user.isActive) {
      return {
        error: "Unapproved or inactive delivery partners cannot change duty status.",
        isAvailable: false,
      };
    }

    const updated = await prisma.deliveryPartner.update({
      where: { id: partner.id },
      data: { isAvailable: !partner.isAvailable },
    });

    // Auto-retry assignment for pending orders when partner becomes available
    if (updated.isAvailable && updated.isActive) {
      try {
        const pending = await prisma.deliveryAssignment.findFirst({
          where: {
            status: "PENDING_ASSIGNMENT",
            deliveryPartnerId: null,
            orderId: { not: null },
          },
          orderBy: { createdAt: "asc" },
        });
        if (pending?.orderId) {
          await autoAssignOrderDelivery(pending.orderId);
        }
      } catch {
        // Non-blocking auto-retry
      }
    }

    safeRevalidate("/delivery/dashboard");
    safeRevalidate("/delivery/profile");

    return { success: true, isAvailable: updated.isAvailable };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error toggling availability:", error);
    return { error: "Failed to update availability status." };
  }
}

export async function updatePartnerLocation(
  lat: number,
  lon: number,
  testPartnerUserId?: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { partner } = await getAuthorizedDeliveryPartner(testPartnerUserId);

    // 1. Strict GPS Coordinate Validation
    if (lat < -90 || lat > 90) return { error: "Invalid latitude" };
    if (lon < -180 || lon > 180) return { error: "Invalid longitude" };

    // 2. Throttle Update (Minimum 10s between DB writes)
    if (partner.lastLocationUpdatedAt) {
      const msSinceLastUpdate = Date.now() - partner.lastLocationUpdatedAt.getTime();
      if (msSinceLastUpdate < 10000) {
        // Silently accept but don't hit DB to avoid aggressive writes
        return { success: true };
      }
    }

    // 3. Active Delivery Requirement
    // To conserve resources, we only track partners who actually have active assignments
    const activeAssignments = await prisma.deliveryAssignment.count({
      where: {
        deliveryPartnerId: partner.id,
        status: {
          in: ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"]
        }
      }
    });

    if (activeAssignments === 0) {
      return { success: true }; // Just skip GPS logging if they have nothing to deliver right now
    }

    await prisma.deliveryPartner.update({
      where: { id: partner.id },
      data: {
        lastKnownLat: lat,
        lastKnownLon: lon,
        lastLocationUpdatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error updating location:", error);
    return { error: "Failed to update location." };
  }
}




// -------------------------------------------------------------
// Automatic Delivery Partner Assignment
// -------------------------------------------------------------

export interface AutoAssignResult {
  success: boolean;
  assigned: boolean;
  assignmentId?: string;
  partnerId?: string;
  partnerName?: string;
  partnerPhone?: string | null;
  status: DeliveryStatus;
  message: string;
}

export async function autoAssignOrderDelivery(
  orderId: string,
  externalTx?: Prisma.TransactionClient
): Promise<AutoAssignResult> {
  const runner = async (tx: Prisma.TransactionClient): Promise<AutoAssignResult> => {
    // 0. Row-level concurrency lock on the Order record
    // In PostgreSQL, SELECT ... FOR UPDATE serializes concurrent assignment transactions on the same order.
    try {
      await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE`;
    } catch {
      // Non-Postgres or unsupporting transaction contexts fall through safely
    }

    // 1. Fetch Order with items, shop relations, and existing delivery assignment
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            shop: true,
            product: { include: { shop: true } },
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

    if (!order) {
      return {
        success: false,
        assigned: false,
        status: "PENDING_ASSIGNMENT",
        message: "Order not found.",
      };
    }

    // 2. Duplicate Assignment Check:
    // If this order already has an active assignment with an assigned partner, preserve it.
    if (
      order.deliveryAssignment &&
      order.deliveryAssignment.deliveryPartnerId &&
      order.deliveryAssignment.status !== "PENDING_ASSIGNMENT"
    ) {
      return {
        success: true,
        assigned: true,
        assignmentId: order.deliveryAssignment.id,
        partnerId: order.deliveryAssignment.deliveryPartnerId,
        partnerName: order.deliveryAssignment.deliveryPartner?.user?.name || "Delivery Partner",
        partnerPhone:
          order.deliveryAssignment.deliveryPartner?.phone ||
          order.deliveryAssignment.deliveryPartner?.user?.phone ||
          null,
        status: order.deliveryAssignment.status,
        message: "Order already has an assigned delivery partner.",
      };
    }

    // 3. Formulate Pickup and Delivery Location Snapshots
    const firstItem = order.items[0];
    const shop = firstItem?.shop || firstItem?.product?.shop;
    const pickupAddress = shop
      ? [shop.name, shop.address, shop.village, shop.district, shop.state]
          .filter(Boolean)
          .join(", ")
      : "Seller Store";
    const pickupLatitude = shop?.latitude || null;
    const pickupLongitude = shop?.longitude || null;

    const dropAddress = [
      order.shippingAddress,
      order.shippingVillage,
      order.shippingDistrict,
      order.shippingState,
      order.shippingPincode ? `PIN: ${order.shippingPincode}` : null,
    ]
      .filter(Boolean)
      .join(", ");

    const deliveryCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Query Eligible Delivery Partners:
    // - Role: DELIVERY_PARTNER
    // - isActive: true on DeliveryPartner and User (Approved & Active)
    // - isAvailable: true on DeliveryPartner (Available)
    const eligiblePartners = await tx.deliveryPartner.findMany({
      where: {
        isActive: true,
        isAvailable: true,
        user: {
          role: "DELIVERY_PARTNER",
          isActive: true,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        assignments: {
          where: {
            status: { in: ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "IN_TRANSIT"] },
          },
          select: { id: true, assignedAt: true },
          orderBy: { assignedAt: "desc" },
        },
      },
    });

    // Capacity Check: Active workload must be less than maxActiveDeliveries limit
    const availablePartners = eligiblePartners.filter(
      (p) => p.assignments.length < (p.maxActiveDeliveries || DEFAULT_MAX_ACTIVE)
    );

    // 5. Handle NO AVAILABLE DELIVERY PARTNER
    if (availablePartners.length === 0) {
      const pendingAssignment = await tx.deliveryAssignment.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          deliveryType: "ORDER",
          status: "PENDING_ASSIGNMENT",
          deliveryPartnerId: null,
          deliveryCode,
          pickupAddress,
          pickupLatitude,
          pickupLongitude,
          dropAddress,
          recipientName: order.shippingName,
          deliveryWindow: "09:00 - 18:00",
          assignedAt: null,
        },
        update: {
          status: "PENDING_ASSIGNMENT",
          pickupAddress,
          pickupLatitude,
          pickupLongitude,
          dropAddress,
          recipientName: order.shippingName,
        },
      });
      const assignmentId = pendingAssignment.id;

      // Notify shop owner and admin of pending logistics assignment
      const shopOwnerId = shop?.userId || firstItem?.shop?.userId || null;
      const adminUser = await tx.user.findFirst({
        where: { role: "ADMIN", isActive: true },
        select: { id: true },
      });

      await notifyDeliveryPendingAssignment({
        shopOwnerId: shopOwnerId || undefined,
        adminUserId: adminUser?.id,
        orderId: order.id,
        orderNumber: order.orderNumber,
        tx,
      });

      return {
        success: true,
        assigned: false,
        assignmentId,
        status: "PENDING_ASSIGNMENT",
        message: "Order packed. Delivery partner assignment pending (no partner currently available).",
      };
    }

    // 6. Selection Strategy (Proximity & Load Balancing)
    // - Proximity: If reliable pickup and partner coordinates exist, prefer nearest partner
    // - Fallback: Match serviceArea with shipping district, least active workload, oldest last-assignment time, earliest createdAt
    const hasShopCoords =
      pickupLatitude !== null &&
      pickupLongitude !== null &&
      typeof pickupLatitude === "number" &&
      typeof pickupLongitude === "number";

    const district = order.shippingDistrict?.toLowerCase().trim();

    availablePartners.sort((a, b) => {
      const aHasCoords =
        a.lastKnownLat !== null &&
        a.lastKnownLon !== null &&
        typeof a.lastKnownLat === "number" &&
        typeof a.lastKnownLon === "number";
      const bHasCoords =
        b.lastKnownLat !== null &&
        b.lastKnownLon !== null &&
        typeof b.lastKnownLat === "number" &&
        typeof b.lastKnownLon === "number";

      // Criteria 1: Proximity when reliable GPS coordinates exist
      if (hasShopCoords && aHasCoords && bHasCoords) {
        const distA = calculateHaversineDistanceKm(
          pickupLatitude,
          pickupLongitude,
          a.lastKnownLat!,
          a.lastKnownLon!
        );
        const distB = calculateHaversineDistanceKm(
          pickupLatitude,
          pickupLongitude,
          b.lastKnownLat!,
          b.lastKnownLon!
        );
        if (Math.abs(distA - distB) > 0.05) {
          return distA - distB;
        }
      } else if (hasShopCoords && aHasCoords && !bHasCoords) {
        return -1;
      } else if (hasShopCoords && !aHasCoords && bHasCoords) {
        return 1;
      }

      // Criteria 2: Matching serviceArea with delivery district
      if (district) {
        const aMatch = a.serviceArea?.toLowerCase().includes(district) ? 1 : 0;
        const bMatch = b.serviceArea?.toLowerCase().includes(district) ? 1 : 0;
        if (aMatch !== bMatch) {
          return bMatch - aMatch;
        }
      }

      // Criteria 3: Least active assignments (Load balancing)
      if (a.assignments.length !== b.assignments.length) {
        return a.assignments.length - b.assignments.length;
      }

      // Criteria 4: Oldest last-assignment time (Fairness / Round-robin)
      const aLastAssigned = a.assignments[0]?.assignedAt
        ? new Date(a.assignments[0].assignedAt).getTime()
        : 0;
      const bLastAssigned = b.assignments[0]?.assignedAt
        ? new Date(b.assignments[0].assignedAt).getTime()
        : 0;
      if (aLastAssigned !== bLastAssigned) {
        return aLastAssigned - bLastAssigned;
      }

      // Criteria 5: Deterministic tie-breaker
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const selectedPartner = availablePartners[0];

    // 7. Create or Update DeliveryAssignment idempotently
    const assignment = await tx.deliveryAssignment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        deliveryType: "ORDER",
        status: "ASSIGNED",
        deliveryPartnerId: selectedPartner.id,
        deliveryCode,
        pickupAddress,
        pickupLatitude,
        pickupLongitude,
        dropAddress,
        recipientName: order.shippingName,
        deliveryWindow: "09:00 - 18:00",
        assignedAt: new Date(),
      },
      update: {
        deliveryPartnerId: selectedPartner.id,
        status: "ASSIGNED",
        deliveryCode: order.deliveryAssignment?.deliveryCode || deliveryCode,
        pickupAddress,
        pickupLatitude,
        pickupLongitude,
        dropAddress,
        recipientName: order.shippingName,
        assignedAt: new Date(),
      },
    });

    // 8. Audit Log
    try {
      await tx.auditLog.create({
        data: {
          actorUserId: selectedPartner.userId,
          actorRole: "DELIVERY_PARTNER",
          action: "AUTOMATIC_DELIVERY_ASSIGNED",
          entityType: "DeliveryAssignment",
          entityId: assignment.id,
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            deliveryPartnerId: selectedPartner.id,
            partnerName: selectedPartner.user.name,
            strategy: "LEAST_LOADED_BALANCED",
          },
        },
      });
    } catch {
      // Audit log non-blocking
    }

    // 9. Dispatch Centralized Notifications (Delivery Partner, Farmer, & Shop Owner)
    const shopOwnerId = shop?.userId || firstItem?.shop?.userId || undefined;
    await notifyDeliveryAssigned({
      partnerUserId: selectedPartner.userId,
      farmerId: order.userId,
      shopOwnerId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      tx,
    });

    return {
      success: true,
      assigned: true,
      assignmentId: assignment.id,
      partnerId: selectedPartner.id,
      partnerName: selectedPartner.user.name || "Delivery Partner",
      partnerPhone: selectedPartner.phone || selectedPartner.user.phone || null,
      status: "ASSIGNED",
      message: `Delivery partner ${selectedPartner.user.name || "assigned"} automatically assigned.`,
    };
  };

  if (externalTx) {
    return runner(externalTx);
  } else {
    return prisma.$transaction(async (tx) => {
      const res = await runner(tx);
      safeRevalidate("/delivery/dashboard");
      safeRevalidate("/delivery/available");
      safeRevalidate("/delivery/orders");
      safeRevalidate(`/delivery/orders/${orderId}`);
      safeRevalidate(`/farmer/orders/${orderId}`);
      safeRevalidate(`/shop/orders/${orderId}`);
      return res;
    });
  }
}

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates
 */
function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// -------------------------------------------------------------
// Admin / System Retry for Pending Delivery Assignments
// -------------------------------------------------------------

export async function retryPendingDeliveryAssignments(
  testAdminUserId?: string
): Promise<{
  success: boolean;
  totalPending: number;
  assignedCount: number;
  message: string;
}> {
  try {
    await getAdminUser(testAdminUserId);

    const pendingAssignments = await prisma.deliveryAssignment.findMany({
      where: {
        status: "PENDING_ASSIGNMENT",
        deliveryPartnerId: null,
        orderId: { not: null },
      },
      select: { id: true, orderId: true },
      orderBy: { createdAt: "asc" },
    });

    if (pendingAssignments.length === 0) {
      return {
        success: true,
        totalPending: 0,
        assignedCount: 0,
        message: "No pending delivery assignments found.",
      };
    }

    let assignedCount = 0;
    for (const pa of pendingAssignments) {
      if (!pa.orderId) continue;
      const res = await autoAssignOrderDelivery(pa.orderId);
      if (res.assigned) {
        assignedCount++;
      }
    }

    safeRevalidate("/admin/logistics");
    safeRevalidate("/delivery/dashboard");
    safeRevalidate("/delivery/available");

    return {
      success: true,
      totalPending: pendingAssignments.length,
      assignedCount,
      message: `Processed ${pendingAssignments.length} pending delivery assignment(s). Successfully assigned ${assignedCount}.`,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error retrying pending delivery assignments:", error);
    return {
      success: false,
      totalPending: 0,
      assignedCount: 0,
      message: "Failed to retry pending delivery assignments.",
    };
  }
}

export async function retryOrderDeliveryAssignment(
  orderId: string,
  testAdminUserId?: string
): Promise<AutoAssignResult> {
  await getAdminUser(testAdminUserId);
  return autoAssignOrderDelivery(orderId);
}
