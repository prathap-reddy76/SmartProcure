"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { getFarmerCropsMarketPrices } from "@/actions/market-prices";
import {
  calculateProfileCompleteness,
  calculateDaysSinceSowing,
  generateFarmSuggestions,
  FarmerProfileSummary,
  FarmerDashboardCropItem,
} from "@/lib/farmer/dashboard-utils";

export type {
  ProfileMissingField,
  ProfileCompletenessResult,
  FarmerProfileSummary,
  FarmerDashboardCropItem,
  FarmingSuggestionItem,
} from "@/lib/farmer/dashboard-utils";

export async function getFarmerDashboardData() {
  const session = await requireRole("FARMER");
  const userId = session.user?.id as string;

  // 1. Fetch User & Profile with Farm and Crops
  const [user, profile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, phone: true, email: true },
    }),
    prisma.farmerProfile.findUnique({
      where: { userId },
      include: {
        farm: true,
        crops: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
  ]);

  // 2. Format Crops with calculated daysSinceSowing & askAiQuery
  const crops: FarmerDashboardCropItem[] = (profile?.crops || []).map((c) => {
    const daysSinceSowing = calculateDaysSinceSowing(c.plantingDate);
    const varietyStr = c.variety ? ` (${c.variety})` : "";
    const daysStr = daysSinceSowing !== null ? ` sown ${daysSinceSowing} days ago` : "";
    const askAiQuery = `Advice for my ${c.cropName}${varietyStr}${daysStr}`;

    return {
      id: c.id,
      cropName: c.cropName,
      variety: c.variety,
      area: c.area ? Number(c.area) : null,
      areaUnit: c.areaUnit || "acres",
      season: c.season,
      plantingDate: c.plantingDate ? c.plantingDate.toISOString().split("T")[0] : null,
      daysSinceSowing,
      harvestDate: c.harvestDate ? c.harvestDate.toISOString().split("T")[0] : null,
      askAiQuery,
    };
  });

  // 3. Location and Profile Completeness
  const locationParts = [
    profile?.village || profile?.farm?.village,
    profile?.district || profile?.farm?.district,
    profile?.state || profile?.farm?.state,
  ].filter(Boolean);
  const location = locationParts.join(", ") || "Location not set";

  const completeness = calculateProfileCompleteness({
    name: user?.name,
    phone: user?.phone,
    villageOrDistrict:
      profile?.village ||
      profile?.district ||
      profile?.farm?.village ||
      profile?.farm?.district,
    farmSize: profile?.farm?.farmSize ? Number(profile.farm.farmSize) : null,
    landType: profile?.farm?.landType,
    irrigationType: profile?.farm?.irrigationType,
    cropsCount: crops.length,
  });

  const profileSummary: FarmerProfileSummary = {
    name: user?.name || "Farmer",
    phone: user?.phone || null,
    email: user?.email || null,
    location,
    village: profile?.village || profile?.farm?.village || null,
    district: profile?.district || profile?.farm?.district || null,
    state: profile?.state || profile?.farm?.state || null,
    farmName: profile?.farm?.farmName || null,
    farmSize: profile?.farm?.farmSize ? Number(profile.farm.farmSize) : null,
    farmSizeUnit: profile?.farm?.farmSizeUnit || "acres",
    landType: profile?.farm?.landType || null,
    irrigationType: profile?.farm?.irrigationType || null,
    primaryCrop: profile?.farm?.primaryCrop || (crops[0]?.cropName ?? null),
    cropsCount: crops.length,
    completionPercentage: completeness.percentage,
    missingFields: completeness.missingFields,
  };

  // 4. Generate dynamic farming suggestions
  const suggestions = generateFarmSuggestions({
    crops,
    location: profileSummary.district || profileSummary.village || profileSummary.state,
    missingFields: completeness.missingFields,
  });

  // 5. Orders Data (scoped to authenticated farmer)
  const [activeOrders, activeOrdersCount] = await Promise.all([
    prisma.order.findMany({
      where: {
        userId,
        status: { notIn: ["DELIVERED", "CANCELLED"] },
      },
      include: {
        items: {
          select: {
            id: true,
            productName: true,
            productPrice: true,
            quantity: true,
            lineTotal: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.order.count({
      where: { userId, status: { notIn: ["DELIVERED", "CANCELLED"] } },
    }),
  ]);

  // 6. Procurement Data
  const [activeProcurement, activeProcurementCount] = await Promise.all([
    prisma.procurementBooking.findMany({
      where: {
        farmerId: userId,
        status: { notIn: ["ACCEPTED", "PARTIALLY_ACCEPTED", "REJECTED", "CANCELLED", "NO_SHOW"] },
      },
      include: {
        centre: { select: { name: true } },
        crop: { select: { name: true } },
        slot: { select: { date: true, startTime: true, endTime: true } },
      },
      orderBy: { slot: { date: "asc" } },
      take: 3,
    }),
    prisma.procurementBooking.count({
      where: {
        farmerId: userId,
        status: { notIn: ["ACCEPTED", "PARTIALLY_ACCEPTED", "REJECTED", "CANCELLED", "NO_SHOW"] },
      },
    }),
  ]);

  // 7. Deliveries (from Orders, out for delivery)
  const activeDeliveries = await prisma.order.findMany({
    where: {
      userId,
      status: { in: ["OUT_FOR_DELIVERY", "READY_FOR_DELIVERY"] },
    },
    include: {
      deliveryAssignment: { select: { status: true, assignedAt: true } },
    },
    take: 3,
  });

  // 8. Notifications
  const unreadNotificationsCount = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  // 9. Live Mandi Market Prices for Farmer's Registered Crops
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let marketPrices: any[] = [];
  try {
    const marketRes = await getFarmerCropsMarketPrices(userId);
    if (marketRes.success && marketRes.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      marketPrices = marketRes.data.slice(0, 4).map((p: any) => ({
        id: p.id,
        commodityName: p.commodityName,
        variety: p.variety || null,
        grade: p.grade || null,
        marketName: p.marketName || (p.market?.name ? p.market.name : "APMC Market"),
        minPrice: typeof p.minPrice === "number" ? p.minPrice : Number(p.minPrice) || 0,
        maxPrice: typeof p.maxPrice === "number" ? p.maxPrice : Number(p.maxPrice) || 0,
        modalPrice: typeof p.modalPrice === "number" ? p.modalPrice : Number(p.modalPrice) || 0,
        priceUnit: p.priceUnit || "Quintal",
        priceDate: typeof p.priceDate === "string" ? p.priceDate : new Date(p.priceDate).toISOString(),
        dataSource: p.dataSource,
      }));
    }
  } catch (err) {
    console.error("Error fetching farmer crop market prices for dashboard:", err);
    marketPrices = [];
  }

  // 10. Personalized Recommended Products
  // Priority: products matching registered crops OR past purchased categories
  const cropNames = crops.map((c) => c.cropName);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recommendedProducts: any[] = [];

  if (cropNames.length > 0) {
    recommendedProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        stock: { gt: 0 },
        OR: cropNames.map((name) => ({
          suitableCrops: { contains: name, mode: "insensitive" },
        })),
      },
      include: { category: true, images: true },
      take: 4,
      orderBy: { createdAt: "desc" },
    });
  }

  if (recommendedProducts.length === 0) {
    const pastOrders = await prisma.order.findMany({
      where: { userId },
      select: { items: { select: { product: { select: { categoryId: true } } } } },
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    const categoryIds = new Set<string>();
    pastOrders.forEach((o) => {
      if (o.items && Array.isArray(o.items)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        o.items.forEach((i: any) => {
          if (i.product?.categoryId) categoryIds.add(i.product.categoryId);
        });
      }
    });

    if (categoryIds.size > 0) {
      recommendedProducts = await prisma.product.findMany({
        where: {
          categoryId: { in: Array.from(categoryIds) },
          isActive: true,
          stock: { gt: 0 },
        },
        include: { category: true, images: true },
        take: 4,
        orderBy: { createdAt: "desc" },
      });
    } else {
      recommendedProducts = await prisma.product.findMany({
        where: { isActive: true, stock: { gt: 0 } },
        include: { category: true, images: true },
        take: 4,
        orderBy: { createdAt: "desc" },
      });
    }
  }

  // Serialize all Decimals and Dates safely across the server/client boundary
  return {
    profileSummary,
    crops,
    suggestions,
    marketPrices,
    activeOrders: activeOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      userId: o.userId,
      status: o.status,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      subtotal: o.subtotal.toString(),
      deliveryCharge: o.deliveryCharge.toString(),
      totalAmount: o.totalAmount.toString(),
      shippingName: o.shippingName,
      shippingPhone: o.shippingPhone,
      shippingAddress: o.shippingAddress,
      shippingVillage: o.shippingVillage,
      shippingDistrict: o.shippingDistrict,
      shippingState: o.shippingState,
      shippingPincode: o.shippingPincode,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      itemsCount: o.items?.length || 0,
      items:
        o.items?.map((item) => ({
          id: item.id,
          productName: item.productName,
          productPrice: item.productPrice.toString(),
          quantity: item.quantity,
          lineTotal: item.lineTotal.toString(),
        })) || [],
    })),
    activeOrdersCount,
    activeProcurement: activeProcurement.map((b) => ({
      id: b.id,
      bookingNumber: b.bookingNumber,
      farmerId: b.farmerId,
      centreId: b.centreId,
      cropId: b.cropId,
      slotId: b.slotId,
      expectedQuantity: Number(b.expectedQuantity),
      tokenNumber: b.tokenNumber,
      status: b.status,
      bookedAt: b.bookedAt.toISOString(),
      arrivedAt: b.arrivedAt ? b.arrivedAt.toISOString() : null,
      weighingStartedAt: b.weighingStartedAt ? b.weighingStartedAt.toISOString() : null,
      weighingCompletedAt: b.weighingCompletedAt ? b.weighingCompletedAt.toISOString() : null,
      qualityStartedAt: b.qualityStartedAt ? b.qualityStartedAt.toISOString() : null,
      qualityCompletedAt: b.qualityCompletedAt ? b.qualityCompletedAt.toISOString() : null,
      completedAt: b.completedAt ? b.completedAt.toISOString() : null,
      cancelledAt: b.cancelledAt ? b.cancelledAt.toISOString() : null,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
      centre: {
        name: b.centre.name,
      },
      crop: {
        name: b.crop.name,
      },
      slot: {
        date: b.slot.date.toISOString(),
        startTime: b.slot.startTime,
        endTime: b.slot.endTime,
      },
    })),
    activeProcurementCount,
    activeDeliveries: activeDeliveries.map((d) => ({
      id: d.id,
      orderNumber: d.orderNumber,
      userId: d.userId,
      status: d.status,
      paymentMethod: d.paymentMethod,
      paymentStatus: d.paymentStatus,
      subtotal: d.subtotal.toString(),
      deliveryCharge: d.deliveryCharge.toString(),
      totalAmount: d.totalAmount.toString(),
      shippingName: d.shippingName,
      shippingPhone: d.shippingPhone,
      shippingAddress: d.shippingAddress,
      shippingVillage: d.shippingVillage,
      shippingDistrict: d.shippingDistrict,
      shippingState: d.shippingState,
      shippingPincode: d.shippingPincode,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      deliveryAssignment: d.deliveryAssignment
        ? {
            status: d.deliveryAssignment.status,
            assignedAt: d.deliveryAssignment.assignedAt?.toISOString() || null,
          }
        : null,
    })),
    unreadNotificationsCount,
    recommendedProducts: recommendedProducts.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      productType: p.productType,
      price: p.price.toString(),
      unit: p.unit,
      stock: p.stock,
      isActive: p.isActive,
      suitableCrops: p.suitableCrops,
      variety: p.variety,
      dosage: p.dosage,
      packageSize: p.packageSize,
      season: p.season,
      categoryId: p.categoryId,
      shopId: p.shopId,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      category: p.category
        ? {
            id: p.category.id,
            name: p.category.name,
            slug: p.category.slug,
            description: p.category.description,
            icon: p.category.icon,
            isActive: p.category.isActive,
            createdAt: p.category.createdAt.toISOString(),
            updatedAt: p.category.updatedAt.toISOString(),
          }
        : null,
      images:
        p.images?.map((img: any) => ({
          id: img.id,
          productId: img.productId,
          imageUrl: img.imageUrl,
          sortOrder: img.sortOrder,
          createdAt: img.createdAt.toISOString(),
        })) || [],
    })),
  };
}
