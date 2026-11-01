"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";

export async function createProcurementPrice(data: {
  cropId: string;
  centreId: string;
  pricePerKg: number;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  isActive: boolean;
}) {
  await requireRole("ADMIN");

  if (data.pricePerKg <= 0) return { success: false, error: "Price must be greater than 0" };
  if (data.effectiveTo && data.effectiveFrom > data.effectiveTo) {
    return { success: false, error: "effectiveFrom cannot be after effectiveTo" };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // Conflict resolution:
      // If the new price is active, check if there are other active prices that overlap
      if (data.isActive) {
        const overlapping = await tx.procurementPrice.findMany({
          where: {
            cropId: data.cropId,
            centreId: data.centreId,
            isActive: true,
            OR: [
              { effectiveTo: null }, // Existing is forever
              { effectiveTo: { gte: data.effectiveFrom } } // Existing ends after new starts
            ]
          }
        });
        
        // Detailed overlap checking
        for (const existing of overlapping) {
          if (!data.effectiveTo) {
            // New is forever, existing starts before forever ends -> always overlaps
            throw new Error("Overlapping active price period detected.");
          } else {
            // Both have ends (or existing doesn't)
            if (existing.effectiveFrom <= data.effectiveTo) {
              throw new Error("Overlapping active price period detected.");
            }
          }
        }
      }

      const price = await tx.procurementPrice.create({
        data: {
          cropId: data.cropId,
          centreId: data.centreId,
          pricePerKg: data.pricePerKg,
          effectiveFrom: data.effectiveFrom,
          effectiveTo: data.effectiveTo,
          isActive: data.isActive
        }
      });
      return { success: true, priceId: price.id };
    });
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to create price" };
  }
}

export async function togglePriceStatus(priceId: string, isActive: boolean) {
  await requireRole("ADMIN");
  
  try {
    return await prisma.$transaction(async (tx) => {
      const price = await tx.procurementPrice.findUnique({ where: { id: priceId } });
      if (!price) throw new Error("Not found");

      if (isActive) {
        // Checking overlaps before activating
        const overlapping = await tx.procurementPrice.findMany({
          where: {
            id: { not: price.id },
            cropId: price.cropId,
            centreId: price.centreId,
            isActive: true,
            OR: [
              { effectiveTo: null },
              { effectiveTo: { gte: price.effectiveFrom } }
            ]
          }
        });
        for (const existing of overlapping) {
          if (!price.effectiveTo || existing.effectiveFrom <= price.effectiveTo) {
            throw new Error("Cannot activate: Overlapping active price period detected.");
          }
        }
      }

      await tx.procurementPrice.update({
        where: { id: priceId },
        data: { isActive }
      });
      return { success: true };
    });
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to toggle price status" };
  }
}
