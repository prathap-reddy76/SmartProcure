"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const querySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  productType: z.enum(["all", "FERTILIZER", "MACHINERY_RENTAL", "MACHINERY_SALES"]).optional().default("all"),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  availability: z.enum(["all", "in-stock", "out-of-stock"]).optional().default("all"),
  sort: z.enum(["newest", "price_asc", "price_desc", "relevance"]).optional().default("newest"),
  brand: z.string().optional(),
  suitableCrops: z.string().optional(),
  shopId: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
});

export type MarketplaceProductItem = {
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
  specifications: any;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  shop: {
    id: string;
    name: string;
    shopType: string;
    district: string | null;
    state: string | null;
  };
  imageUrl: string;
};

export type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  unit: string | null;
  stock: number;
  suitableCrops: string | null;
  variety: string | null;
  dosage: string | null;
  packageSize: string | null;
  season: string | null;
  productType: string;
  specifications: any;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  shop: {
    id: string;
    name: string;
    shopType: string;
    description: string | null;
    ownerName: string | null;
    phone: string | null;
    address: string | null;
    village: string | null;
    district: string | null;
    state: string | null;
    pincode: string | null;
  };
  images: { id: string; imageUrl: string; altText: string | null }[];
};

export async function getMarketplaceProducts(
  rawParams: Record<string, string | string[] | undefined>
): Promise<{
  products: MarketplaceProductItem[];
  total: number;
  totalPages: number;
  currentPage: number;
}> {
  try {
    const parsed = querySchema.safeParse(rawParams);
    const filters = parsed.success
      ? parsed.data
      : { 
          page: 1, 
          limit: 12, 
          availability: "all" as const,
          productType: "all" as const,
          sort: "newest" as const
        };

    const { search, category, minPrice, maxPrice, availability, productType, sort, brand, suitableCrops, shopId, page, limit } = filters;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };

    // Shop filter
    if (shopId && shopId.trim() !== "") {
      where.shopId = shopId;
    }

    // Category filter
    if (category && category !== "all") {
      where.category = {
        slug: category,
      };
    }

    // Product Type filter
    if (productType && productType !== "all") {
      // @ts-ignore
      where.productType = productType;
    }

    // Availability filter
    if (availability === "in-stock") {
      where.stock = { gt: 0 };
    } else if (availability === "out-of-stock") {
      where.stock = { equals: 0 };
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }
    
    // Deep JSON Brand Filter
    if (brand && brand.trim() !== "") {
      where.specifications = {
        path: ['brand'],
        string_contains: brand.trim()
      };
    }
    
    // Suitable Crops Native Filter
    if (suitableCrops && suitableCrops.trim() !== "") {
      where.suitableCrops = {
        contains: suitableCrops.trim(),
        mode: "insensitive"
      };
    }

    // Search filter
    if (search && search.trim() !== "") {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { suitableCrops: { contains: term, mode: "insensitive" } },
        { variety: { contains: term, mode: "insensitive" } },
        { category: { name: { contains: term, mode: "insensitive" } } },
        { shop: { name: { contains: term, mode: "insensitive" } } },
      ];
    }

    const skip = (page - 1) * limit;
    
    let orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] = [{ stock: "desc" }, { createdAt: "desc" }];
    
    if (sort === "price_asc") {
      orderBy = [{ price: "asc" }, { stock: "desc" }];
    } else if (sort === "price_desc") {
      orderBy = [{ price: "desc" }, { stock: "desc" }];
    } else if (sort === "newest") {
      orderBy = { createdAt: "desc" };
    } else if (sort === "relevance") {
      // Safe fallback since fullTextSearch is not guaranteed
      orderBy = [{ stock: "desc" }, { createdAt: "desc" }];
    }

    const [total, rawProducts] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          shop: {
            select: { id: true, name: true, shopType: true, district: true, state: true },
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

    const defaultPlaceholder =
      "https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=600&q=80";

    const products: MarketplaceProductItem[] = rawProducts.map((p) => ({
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
      specifications: p.specifications,
      category: p.category,
      shop: p.shop,
      imageUrl: p.images[0]?.imageUrl || defaultPlaceholder,
    }));

    return {
      products,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
    };
  } catch (error) {
    console.error("Error retrieving marketplace products:", error);
    return {
      products: [],
      total: 0,
      totalPages: 1,
      currentPage: 1,
    };
  }
}

export async function getProductById(productIdOrSlug: string): Promise<ProductDetail | null> {
  try {
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: productIdOrSlug }, { slug: productIdOrSlug }],
        isActive: true,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        shop: {
          select: {
            id: true,
            name: true,
            shopType: true,
            description: true,
            ownerName: true,
            phone: true,
            address: true,
            village: true,
            district: true,
            state: true,
            pincode: true,
          },
        },
        images: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, imageUrl: true, altText: true },
        },
      },
    });

    if (!product) return null;

    const defaultPlaceholder =
      "https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=600&q=80";

    const images =
      product.images.length > 0
        ? product.images
        : [{ id: "placeholder", imageUrl: defaultPlaceholder, altText: product.name }];

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: Number(product.price),
      unit: product.unit,
      stock: product.stock,
      suitableCrops: product.suitableCrops,
      variety: product.variety,
      dosage: product.dosage,
      packageSize: product.packageSize,
      season: product.season,
      productType: product.productType,
      specifications: product.specifications,
      category: product.category,
      shop: product.shop,
      images,
    };
  } catch (error) {
    console.error("Error retrieving product details:", error);
    return null;
  }
}

