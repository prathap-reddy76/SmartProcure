"use server";

import { prisma } from "@/lib/prisma";

export type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  productCount: number;
};

export async function getMarketplaceCategories(): Promise<CategoryItem[]> {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      productCount: cat._count.products,
    }));
  } catch (error) {
    console.error("Error fetching marketplace categories:", error);
    return [];
  }
}
