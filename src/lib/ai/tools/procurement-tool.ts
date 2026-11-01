import { registerTool } from "./tool-registry";
import { prisma as db } from "@/lib/prisma";
import { Type } from "@google/genai";

interface BookingResult {
  bookingNumber: string;
  bookingDate?: Date;
  date?: Date;
  status: string;
  centre?: { name: string };
  crop?: { name: string };
  estimatedQuantity?: { toNumber: () => number };
  tokenNumber?: string;
  Weighment?: { status: string; netWeight?: { toNumber: () => number } };
  weighment?: { status: string; netWeight?: { toNumber: () => number } };
  QualityCheck?: { status: string; grade: string; acceptedQuantity?: { toNumber: () => number }; rejectedQuantity?: { toNumber: () => number } };
  qualityCheck?: { status: string; grade: string; acceptedQuantity?: { toNumber: () => number }; rejectedQuantity?: { toNumber: () => number } };
}

registerTool({
  declaration: {
    name: "get_procurement_status",
    description: "Get the current procurement booking, token, queue, and weighing status for the authenticated farmer.",
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  },
  execute: async (_input, farmerId) => {
    try {
      const bookings = await db.procurementBooking.findMany({
        where: { farmerId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          centre: true,
          crop: true,
          Weighment: true,
          QualityCheck: true
        } as unknown as undefined // bypass strict include types safely
      });

      if (!bookings || bookings.length === 0) {
        return { message: "No procurement bookings found for your account." };
      }

      return bookings.map((b: unknown) => {
        const bk = b as BookingResult;
        return {
          bookingNumber: bk.bookingNumber,
          date: bk.bookingDate ? bk.bookingDate.toISOString().split('T')[0] : (bk.date ? bk.date.toISOString().split('T')[0] : "Unknown"),
          status: bk.status,
          centreName: bk.centre?.name || "Unknown",
          crop: bk.crop?.name || "Unknown",
          estimatedQuantity: bk.estimatedQuantity ? bk.estimatedQuantity.toNumber() : 0,
          tokenNumber: bk.tokenNumber || "Not assigned",
          weighing: bk.Weighment ? {
            status: bk.Weighment.status,
            netWeight: bk.Weighment.netWeight?.toNumber()
          } : (bk.weighment ? {
            status: bk.weighment.status,
            netWeight: bk.weighment.netWeight?.toNumber()
          } : "Not started"),
          quality: bk.QualityCheck ? {
            status: bk.QualityCheck.status,
            grade: bk.QualityCheck.grade,
            acceptedQuantity: bk.QualityCheck.acceptedQuantity?.toNumber(),
            rejectedQuantity: bk.QualityCheck.rejectedQuantity?.toNumber()
          } : (bk.qualityCheck ? {
            status: bk.qualityCheck.status,
            grade: bk.qualityCheck.grade,
            acceptedQuantity: bk.qualityCheck.acceptedQuantity?.toNumber(),
            rejectedQuantity: bk.qualityCheck.rejectedQuantity?.toNumber()
          } : "Not started")
        };
      });
    } catch {
      return { error: "An error occurred fetching procurement records." };
    }
  }
});
