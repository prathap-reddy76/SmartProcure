import { registerTool } from "./tool-registry";
import { prisma as db } from "@/lib/prisma";
import { Type } from "@google/genai";

interface PaymentResult {
  booking: { bookingNumber: string, crop: { name: string } };
  amountProcessed: { toNumber: () => number };
  baseAmount: { toNumber: () => number };
  gradeBonus: { toNumber: () => number };
  transportSubsidy: { toNumber: () => number };
  deductions: { toNumber: () => number };
  paymentDate?: Date;
  updatedAt: Date;
}

registerTool({
  declaration: {
    name: "get_procurement_payments",
    description: "Get recent payments made to the authenticated farmer for government procurement.",
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  },
  execute: async (_input, farmerId) => {
    try {
      const payments = await db.procurementPayment.findMany({
        where: { farmerId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { booking: { include: { crop: true } } }
      });

      if (!payments || payments.length === 0) return { message: "No recent procurement payments found." };

      return payments.map((p: unknown) => {
        const pay = p as PaymentResult;
        return {
          bookingNumber: pay.booking.bookingNumber,
          crop: pay.booking.crop.name,
          status: "COMPLETED", // Assuming these exist if payment record exists
          totalPaid: pay.amountProcessed.toNumber(),
          breakdown: {
            baseAmount: pay.baseAmount.toNumber(),
            gradeBonus: pay.gradeBonus.toNumber(),
            transportSubsidy: pay.transportSubsidy.toNumber(),
            deductions: pay.deductions.toNumber()
          },
          date: pay.paymentDate ? pay.paymentDate.toISOString().split('T')[0] : pay.updatedAt.toISOString().split('T')[0]
        };
      });
    } catch {
      return { error: "An error occurred fetching payment records." };
    }
  }
});
