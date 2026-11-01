"use server";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { SessionUser } from "@/types/auth";
import {
  ShopProfile,
  ShopDashboardMetrics,
  SellerOrderSummary,
  ShopProductItem,
} from "@/types/shop";
import { OrderStatus } from "@prisma/client";

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

export async function getShopProfile(): Promise<ShopProfile | null> {
  const { shop } = await getAuthorizedShopHelper();
  try {
    return {
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      description: shop.description,
      ownerName: shop.ownerName,
      phone: shop.phone,
      email: shop.email,
      address: shop.address,
      village: shop.village,
      district: shop.district,
      state: shop.state,
      pincode: shop.pincode,
      isActive: shop.isActive,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error fetching shop profile:", error);
    return null;
  }
}

export async function getShopDashboardData(): Promise<{
  shop: ShopProfile | null;
  metrics: ShopDashboardMetrics;
  recentOrders: SellerOrderSummary[];
}> {
  const defaultMetrics: ShopDashboardMetrics = {
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    newOrders: 0,
    processingOrders: 0,
    readyOrders: 0,
    deliveredOrders: 0,
  };

  const { shop } = await getAuthorizedShopHelper();
  try {
    // 1. Fetch products for this shop
    const products = await prisma.product.findMany({
      where: { shopId: shop.id },
      select: {
        id: true,
        stock: true,
        isActive: true,
      },
    });

    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.isActive).length;
    const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
    const outOfStockProducts = products.filter((p) => p.stock === 0).length;

    // 2. Fetch orders containing products from this shop
    const relevantOrders = await prisma.order.findMany({
      where: {
        items: {
          some: {
            OR: [
              { shopId: shop.id },
              { product: { shopId: shop.id } },
            ],
          },
        },
      },
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
    });

    let newOrdersCount = 0;
    let processingOrdersCount = 0;
    let readyOrdersCount = 0;
    let deliveredOrdersCount = 0;

    const formattedRecentOrders: SellerOrderSummary[] = [];

    for (const order of relevantOrders) {
      // Determine shop-specific fulfillment status for this order
      const itemStatuses = order.items.map((i) => i.status);
      let shopFulfillmentStatus: OrderStatus = "CONFIRMED";

      if (order.status === "CANCELLED") {
        shopFulfillmentStatus = "CANCELLED";
      } else if (order.status === "DELIVERED") {
        shopFulfillmentStatus = "DELIVERED";
        deliveredOrdersCount++;
      } else if (itemStatuses.every((s) => s === "READY_FOR_DELIVERY")) {
        shopFulfillmentStatus = "READY_FOR_DELIVERY";
        readyOrdersCount++;
      } else if (itemStatuses.some((s) => s === "PROCESSING" || s === "READY_FOR_DELIVERY")) {
        shopFulfillmentStatus = "PROCESSING";
        processingOrdersCount++;
      } else {
        shopFulfillmentStatus = "CONFIRMED";
        newOrdersCount++;
      }

      const shopTotal = order.items.reduce((sum, item) => sum + Number(item.lineTotal), 0);

      if (formattedRecentOrders.length < 5) {
        formattedRecentOrders.push({
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
        });
      }
    }

    const shopProfile: ShopProfile = {
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      description: shop.description,
      ownerName: shop.ownerName,
      phone: shop.phone,
      email: shop.email,
      address: shop.address,
      village: shop.village,
      district: shop.district,
      state: shop.state,
      pincode: shop.pincode,
      isActive: shop.isActive,
    };

    return {
      shop: shopProfile,
      metrics: {
        totalProducts,
        activeProducts,
        lowStockProducts,
        outOfStockProducts,
        newOrders: newOrdersCount,
        processingOrders: processingOrdersCount,
        readyOrders: readyOrdersCount,
        deliveredOrders: deliveredOrdersCount,
      },
      recentOrders: formattedRecentOrders,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error fetching shop dashboard data:", error);
    return {
      shop: null,
      metrics: defaultMetrics,
      recentOrders: [],
    };
  }
}

export async function getShopProducts(params?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: ShopProductItem[], total: number, totalPages: number, currentPage: number }> {
  const { shop } = await getAuthorizedShopHelper();
  try {
    const whereClause: {
      shopId: string;
      categoryId?: string;
      OR?: Array<{ name: { contains: string; mode: "insensitive" } } | { description: { contains: string; mode: "insensitive" } }>;
    } = {
      shopId: shop.id,
    };

    if (params?.category && params.category !== "all") {
      whereClause.categoryId = params.category;
    }

    if (params?.search && params.search.trim()) {
      whereClause.OR = [
        { name: { contains: params.search.trim(), mode: "insensitive" } },
        { description: { contains: params.search.trim(), mode: "insensitive" } },
      ];
    }

    const page = params?.page || 1;
    const limit = params?.limit || 12;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: {
          category: true,
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.product.count({ where: whereClause })
    ]);

    return {
        items: products.map((p) => {
          let stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" = "IN_STOCK";
          if (p.stock === 0) stockStatus = "OUT_OF_STOCK";
          else if (p.stock <= 10) stockStatus = "LOW_STOCK";

          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            price: Number(p.price),
            unit: p.unit,
            stock: p.stock,
            stockStatus,
            isActive: p.isActive,
            categoryId: p.categoryId,
            categoryName: p.category?.name,
            categorySlug: p.category?.slug,
            productType: p.productType,
            suitableCrops: p.suitableCrops,
            variety: p.variety,
            dosage: p.dosage,
            packageSize: p.packageSize,
            primaryImage: p.images[0]?.imageUrl || null,
            season: null,
            imageUrl: p.images[0]?.imageUrl || null,
          };
        }),
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page
      };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error fetching shop products:", error);
    return { items: [], total: 0, totalPages: 0, currentPage: 1 };
  }
}

export async function getShopInventory(params?: { page?: number; limit?: number; }): Promise<{ items: ShopProductItem[], total: number, totalPages: number, currentPage: number }> {
  return getShopProducts(params);
}
