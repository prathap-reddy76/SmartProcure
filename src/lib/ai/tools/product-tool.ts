import { registerTool } from "./tool-registry";
import { prisma as db } from "@/lib/prisma";
import { Type } from "@google/genai";

interface ProductResult {
  name: string;
  price: { toNumber: () => number };
  originalPrice?: { toNumber: () => number };
  shop: { name: string };
}

registerTool({
  declaration: {
    name: "search_products",
    description: "Search for agricultural supplies, seeds, fertilizers, or tools available in the marketplace.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "Search query for product name or category (e.g., 'fertilizer', 'tractor', 'urea')."
        }
      },
      required: ["query"]
    }
  },
  execute: async (input: Record<string, unknown>, _farmerId) => {
    const query = input.query as string;
    try {
      if (!query) return { error: "Search query is required." };

      const products = await db.product.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { name: { contains: query, mode: 'insensitive' } } }
          ],
          isActive: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { shop: { select: { name: true } } }
      });

      if (!products || products.length === 0) {
        return { message: `No products found matching '${query}'.` };
      }

      return products.map((p: unknown) => {
        const prod = p as ProductResult;
        return {
          name: prod.name,
          price: prod.price.toNumber(),
          originalPrice: prod.originalPrice ? prod.originalPrice.toNumber() : undefined,
          shopName: prod.shop?.name || "Unknown Shop"
        };
      });
    } catch {
      return { error: "An error occurred while searching for products." };
    }
  }
});

