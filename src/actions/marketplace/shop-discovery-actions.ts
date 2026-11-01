"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type MarketplaceShopItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shopType: string;
  address: string | null;
  village: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  productCount: number;
  createdAt: string;
};

export type ShopStorefrontDetails = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shopType: string;
  address: string | null;
  village: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  productCount: number;
};

export type StorefrontProductItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  unit: string | null;
  stock: number;
  suitableCrops: string | null;
  variety: string | null;
  packageSize: string | null;
  productType: string;
  specifications: Record<string, string | number | boolean | null | undefined> | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  imageUrl: string;
};

const shopQuerySchema = z.object({
  search: z.string().optional(),
  district: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
});

const storefrontProductsQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).optional().default("newest"),
  availability: z.enum(["all", "in-stock"]).optional().default("all"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
});

const DEFAULT_PRODUCT_PLACEHOLDER =
  "https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=600&q=80";

/**
 * Fetch all active shops with search, location filter, and product counts.
 * Uses bounded queries and safe public field projection.
 */
export async function getMarketplaceShops(
  rawParams?: Record<string, string | string[] | undefined>
): Promise<{
  shops: MarketplaceShopItem[];
  total: number;
  totalPages: number;
  currentPage: number;
}> {
  try {
    const parsed = shopQuerySchema.safeParse(rawParams || {});
    const { search, district, page, limit } = parsed.success
      ? parsed.data
      : { page: 1, limit: 12, search: undefined, district: undefined };

    const where: Prisma.ShopWhereInput = {
      isActive: true,
    };

    if (district && district.trim() !== "") {
      where.district = {
        contains: district.trim(),
        mode: "insensitive",
      };
    }

    if (search && search.trim() !== "") {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { address: { contains: term, mode: "insensitive" } },
        { village: { contains: term, mode: "insensitive" } },
        { district: { contains: term, mode: "insensitive" } },
        { state: { contains: term, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, rawShops] = await Promise.all([
      prisma.shop.count({ where }),
      prisma.shop.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          shopType: true,
          address: true,
          village: true,
          district: true,
          state: true,
          pincode: true,
          createdAt: true,
          _count: {
            select: {
              products: {
                where: { isActive: true },
              },
            },
          },
        },
        orderBy: [{ name: "asc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
    ]);

    const shops: MarketplaceShopItem[] = rawShops.map((shop) => ({
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      description: shop.description,
      shopType: shop.shopType,
      address: shop.address,
      village: shop.village,
      district: shop.district,
      state: shop.state,
      pincode: shop.pincode,
      productCount: shop._count.products,
      createdAt: shop.createdAt.toISOString(),
    }));

    return {
      shops,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
    };
  } catch (error) {
    console.error("Error fetching marketplace shops:", error);
    return {
      shops: [],
      total: 0,
      totalPages: 1,
      currentPage: 1,
    };
  }
}

/**
 * Fetch a single active shop storefront details.
 * Prevents exposing sensitive fields (passwords, tokens, user relations).
 */
export async function getShopStorefront(
  shopIdOrSlug: string
): Promise<{ shop: ShopStorefrontDetails | null; error?: string }> {
  try {
    if (!shopIdOrSlug || shopIdOrSlug.trim() === "") {
      return { shop: null, error: "Invalid shop identifier." };
    }

    const shop = await prisma.shop.findFirst({
      where: {
        OR: [{ id: shopIdOrSlug }, { slug: shopIdOrSlug }],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        shopType: true,
        address: true,
        village: true,
        district: true,
        state: true,
        pincode: true,
        phone: true,
        email: true,
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!shop) {
      return { shop: null, error: "Shop not found or currently unavailable." };
    }

    return {
      shop: {
        id: shop.id,
        name: shop.name,
        slug: shop.slug,
        description: shop.description,
        shopType: shop.shopType,
        address: shop.address,
        village: shop.village,
        district: shop.district,
        state: shop.state,
        pincode: shop.pincode,
        phone: shop.phone,
        email: shop.email,
        productCount: shop._count.products,
      },
    };
  } catch (error) {
    console.error("Error retrieving shop storefront:", error);
    return { shop: null, error: "Failed to load shop details." };
  }
}

/**
 * Fetch categories that are available within a specific shop.
 */
export async function getShopCategories(
  shopId: string
): Promise<{ id: string; name: string; slug: string }[]> {
  try {
    const categories = await prisma.category.findMany({
      where: {
        products: {
          some: {
            shopId,
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: "asc" },
    });

    return categories;
  } catch (error) {
    console.error("Error fetching shop categories:", error);
    return [];
  }
}

/**
 * Strictly query products belonging ONLY to the specified shop.
 * Database-level filtering via `where: { shopId, isActive: true }`.
 * Performs Decimal serialization to Number.
 */
export async function getShopStorefrontProducts(
  shopId: string,
  rawParams?: Record<string, string | string[] | undefined>
): Promise<{
  products: StorefrontProductItem[];
  total: number;
  totalPages: number;
  currentPage: number;
  error?: string;
}> {
  try {
    // 1. Verify shop existence and active status
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true, isActive: true },
    });

    if (!shop || !shop.isActive) {
      return {
        products: [],
        total: 0,
        totalPages: 1,
        currentPage: 1,
        error: "Shop does not exist or is inactive.",
      };
    }

    // 2. Parse query parameters
    const parsed = storefrontProductsQuerySchema.safeParse(rawParams || {});
    const { search, category, sort, availability, page, limit } = parsed.success
      ? parsed.data
      : { page: 1, limit: 12, sort: "newest" as const, availability: "all" as const };

    // 3. Database query scoping - MANDATORY shopId constraint
    const where: Prisma.ProductWhereInput = {
      shopId: shop.id,
      isActive: true,
    };

    if (category && category !== "all") {
      where.category = {
        slug: category,
      };
    }

    if (availability === "in-stock") {
      where.stock = { gt: 0 };
    }

    if (search && search.trim() !== "") {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { suitableCrops: { contains: term, mode: "insensitive" } },
        { variety: { contains: term, mode: "insensitive" } },
      ];
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] = [
      { stock: "desc" },
      { createdAt: "desc" },
    ];

    if (sort === "price_asc") {
      orderBy = [{ price: "asc" }, { stock: "desc" }];
    } else if (sort === "price_desc") {
      orderBy = [{ price: "desc" }, { stock: "desc" }];
    } else if (sort === "newest") {
      orderBy = { createdAt: "desc" };
    }

    const skip = (page - 1) * limit;

    const [total, rawProducts] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          images: {
            take: 1,
            orderBy: { sortOrder: "asc" },
            select: { imageUrl: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    // 4. Strict Decimal & Date serialization
    const products: StorefrontProductItem[] = rawProducts.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: Number(p.price),
      unit: p.unit,
      stock: p.stock,
      suitableCrops: p.suitableCrops,
      variety: p.variety,
      packageSize: p.packageSize,
      productType: p.productType,
      specifications: (p.specifications as Record<string, string | number | boolean | null | undefined>) || null,
      category: p.category,
      imageUrl: p.images[0]?.imageUrl || DEFAULT_PRODUCT_PLACEHOLDER,
    }));

    return {
      products,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
    };
  } catch (error) {
    console.error("Error retrieving storefront products:", error);
    return {
      products: [],
      total: 0,
      totalPages: 1,
      currentPage: 1,
      error: "Failed to load products for this shop.",
    };
  }
}
