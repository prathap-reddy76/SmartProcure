"use server";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { Prisma, ShopType } from "@prisma/client";
import { SessionUser } from "@/types/auth";
import { revalidatePath } from "next/cache";

export type AdminProductSummary = {
  id: string;
  name: string;
  productType: ShopType;
  price: number;
  stock: number;
  isActive: boolean;
  shopName: string;
  categoryName: string;
  createdAt: string;
  imageUrl: string | null;
};

export type AdminProductStats = {
  total: number;
  active: number;
  inactive: number;
  outOfStock: number;
  fertilizers: number;
  machineryRentals: number;
  machinerySales: number;
};

interface GetAdminProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  productType?: string;
  categoryId?: string;
  shopId?: string;
  activeStatus?: string;
  stockStatus?: string;
  sortBy?: "newest" | "oldest" | "price_desc" | "price_asc" | "stock_desc" | "stock_asc" | "name";
}

export async function getAdminProductStats(): Promise<{ stats: AdminProductStats | null; error?: string }> {
  try {
    await requireRole("ADMIN");

    const [
      total,
      active,
      inactive,
      outOfStock,
      fertilizers,
      machineryRentals,
      machinerySales
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: false } }),
      prisma.product.count({ where: { stock: { lte: 0 } } }),
      prisma.product.count({ where: { productType: "FERTILIZER" } }),
      prisma.product.count({ where: { productType: "MACHINERY_RENTAL" } }),
      prisma.product.count({ where: { productType: "MACHINERY_SALES" } })
    ]);

    return {
      stats: { total, active, inactive, outOfStock, fertilizers, machineryRentals, machinerySales }
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error fetching admin product stats:", error);
    return { stats: null, error: "Failed to fetch product statistics" };
  }
}

export async function getAdminProducts(params: GetAdminProductsParams) {
  try {
    await requireRole("ADMIN");

    const {
      page = 1,
      limit = 20,
      search,
      productType,
      categoryId,
      shopId,
      activeStatus,
      stockStatus,
      sortBy = "newest",
    } = params;

    const skip = (page - 1) * limit;
    const where: Prisma.ProductWhereInput = {};

    if (productType) where.productType = productType as ShopType;
    if (categoryId) where.categoryId = categoryId;
    if (shopId) where.shopId = shopId;
    
    if (activeStatus === "active") where.isActive = true;
    else if (activeStatus === "inactive") where.isActive = false;

    if (stockStatus === "in_stock") where.stock = { gt: 0 };
    else if (stockStatus === "out_of_stock") where.stock = { lte: 0 };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { shop: { name: { contains: search, mode: "insensitive" } } },
        { category: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    switch (sortBy) {
      case "oldest": orderBy = { createdAt: "asc" }; break;
      case "price_desc": orderBy = { price: "desc" }; break;
      case "price_asc": orderBy = { price: "asc" }; break;
      case "stock_desc": orderBy = { stock: "desc" }; break;
      case "stock_asc": orderBy = { stock: "asc" }; break;
      case "name": orderBy = { name: "asc" }; break;
    }

    const [rawProducts, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          shop: { select: { name: true } },
          category: { select: { name: true } },
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
            select: { imageUrl: true }
          }
        },
      }),
      prisma.product.count({ where }),
    ]);

    const products: AdminProductSummary[] = rawProducts.map((p) => ({
      id: p.id,
      name: p.name,
      productType: p.productType,
      price: Number(p.price),
      stock: p.stock,
      isActive: p.isActive,
      shopName: p.shop.name,
      categoryName: p.category.name,
      createdAt: p.createdAt.toISOString(),
      imageUrl: p.images[0]?.imageUrl || null,
    }));

    return {
      products,
      totalCount,
      pageCount: Math.ceil(totalCount / limit),
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error fetching admin products:", error);
    return { products: [], totalCount: 0, pageCount: 0, error: "Failed to fetch products" };
  }
}

export async function getAdminProductDetail(productId: string) {
  try {
    await requireRole("ADMIN");

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        shop: { select: { id: true, name: true, shopType: true, phone: true } },
        images: { orderBy: { sortOrder: "asc" } },
        _count: {
          select: {
            orderItems: true,
            cartItems: true,
          }
        }
      },
    });

    if (!product) {
      return { product: null, error: "Product not found" };
    }

    return { product };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error fetching product detail:", error);
    return { product: null, error: "Failed to load product details" };
  }
}

export async function toggleAdminProductStatus(productId: string, newStatus: boolean) {
  try {
    const session = await requireRole("ADMIN");
    const userSession = session.user as SessionUser;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isActive: true }
    });

    if (!product) return { error: "Product not found" };

    if (product.isActive === newStatus) {
      return { success: true }; // No change
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.product.update({
        where: { id: productId },
        data: { isActive: newStatus }
      });

      await tx.auditLog.create({
        data: {
          action: newStatus ? "ADMIN_PRODUCT_ACTIVATED" : "ADMIN_PRODUCT_DEACTIVATED",
          actorUserId: userSession.id,
          actorRole: userSession.role,
          entityType: "PRODUCT",
          entityId: productId,
          metadata: { previousStatus: product.isActive, newStatus }
        }
      });
    });

    revalidatePath(`/admin/products`);
    revalidatePath(`/admin/products/${productId}`);

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error toggling product status:", error);
    return { error: "Failed to update product status" };
  }
}
