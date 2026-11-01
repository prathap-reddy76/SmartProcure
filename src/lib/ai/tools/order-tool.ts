import { registerTool } from "./tool-registry";
import { prisma as db } from "@/lib/prisma";
import { Type } from "@google/genai";

interface OrderResult {
  orderNumber: string;
  status: string;
  createdAt: Date;
  totalAmount: { toNumber: () => number };
  paymentStatus: string;
  items: Array<{
    product: { name: string };
    quantity: number;
    price: { toNumber: () => number };
  }>;
}

registerTool({
  declaration: {
    name: "get_orders",
    description: "Get the latest marketplace orders placed by the authenticated farmer.",
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  },
  execute: async (_input, farmerId) => {
    try {
      const orders = await db.order.findMany({
        where: { userId: farmerId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          items: {
            include: { product: { select: { name: true } } }
          }
        }
      });

      if (!orders || orders.length === 0) {
        return { message: "You have not placed any recent marketplace orders." };
      }

      return orders.map((o: unknown) => {
        const order = o as OrderResult;
        return {
          orderNumber: order.orderNumber,
          status: order.status,
          date: order.createdAt.toISOString().split('T')[0],
          totalAmount: order.totalAmount.toNumber(),
          paymentStatus: order.paymentStatus,
          items: order.items.map(i => ({
            productName: i.product.name,
            quantity: i.quantity,
            price: i.price.toNumber()
          }))
        };
      });
    } catch {
      return { error: "An error occurred fetching order records." };
    }
  }
});
