"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export interface AdminCentreFormData {
  name: string;
  code: string;
  description?: string | null;
  address?: string | null;
  village?: string | null;
  mandal?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  contactPhone?: string | null;
  operatingStartTime?: string | null;
  operatingEndTime?: string | null;
  isActive?: boolean;
}

/**
 * Validates coordinates if provided.
 */
function validateCoordinates(latitude?: number | null, longitude?: number | null): string | null {
  if (latitude !== undefined && latitude !== null) {
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      return "Latitude must be a valid number between -90 and 90 degrees.";
    }
  }

  if (longitude !== undefined && longitude !== null) {
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      return "Longitude must be a valid number between -180 and 180 degrees.";
    }
  }

  // If one is provided, both must be valid
  if ((latitude !== null && latitude !== undefined && (longitude === null || longitude === undefined)) ||
      (longitude !== null && longitude !== undefined && (latitude === null || latitude === undefined))) {
    return "Both latitude and longitude must be provided together.";
  }

  return null;
}

/**
 * Retrieve all procurement centres for Admin management.
 */
export async function getAdminProcurementCentres() {
  await requireRole("ADMIN");

  return await prisma.procurementCentre.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          supportedCrops: true,
          slots: true,
          bookings: true,
          officers: true,
        },
      },
    },
  });
}

/**
 * Retrieve a single centre for editing.
 */
export async function getAdminProcurementCentreById(id: string) {
  await requireRole("ADMIN");

  return await prisma.procurementCentre.findUnique({
    where: { id },
  });
}

/**
 * Create a new procurement centre with location data.
 */
export async function createAdminProcurementCentre(
  data: AdminCentreFormData
): Promise<{ success: boolean; centreId?: string; error?: string }> {
  await requireRole("ADMIN");

  if (!data.name?.trim()) {
    return { success: false, error: "Centre name is required." };
  }

  if (!data.code?.trim()) {
    return { success: false, error: "Centre code is required." };
  }

  const coordError = validateCoordinates(data.latitude, data.longitude);
  if (coordError) {
    return { success: false, error: coordError };
  }

  try {
    const existingCode = await prisma.procurementCentre.findUnique({
      where: { code: data.code.trim().toUpperCase() },
    });
    if (existingCode) {
      return { success: false, error: `Centre code ${data.code} already exists.` };
    }

    const centre = await prisma.procurementCentre.create({
      data: {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        description: data.description?.trim() || null,
        address: data.address?.trim() || null,
        village: data.village?.trim() || null,
        mandal: data.mandal?.trim() || null,
        district: data.district?.trim() || null,
        state: data.state?.trim() || "Andhra Pradesh",
        pincode: data.pincode?.trim() || null,
        latitude: data.latitude !== undefined ? data.latitude : null,
        longitude: data.longitude !== undefined ? data.longitude : null,
        contactPhone: data.contactPhone?.trim() || null,
        operatingStartTime: data.operatingStartTime || "09:00",
        operatingEndTime: data.operatingEndTime || "17:00",
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    revalidatePath("/admin/procurement-centres");
    revalidatePath("/farmer/procurement/centres");

    return { success: true, centreId: centre.id };
  } catch (error: unknown) {
    console.error("Error creating procurement centre:", error);
    const msg = error instanceof Error ? error.message : "Failed to create centre.";
    return { success: false, error: msg };
  }
}

/**
 * Update an existing procurement centre, including coordinates and address.
 */
export async function updateAdminProcurementCentre(
  id: string,
  data: Partial<AdminCentreFormData>
): Promise<{ success: boolean; error?: string }> {
  await requireRole("ADMIN");

  const coordError = validateCoordinates(data.latitude, data.longitude);
  if (coordError) {
    return { success: false, error: coordError };
  }

  try {
    const centre = await prisma.procurementCentre.findUnique({
      where: { id },
    });
    if (!centre) {
      return { success: false, error: "Centre not found." };
    }

    if (data.code && data.code.trim().toUpperCase() !== centre.code) {
      const codeConflict = await prisma.procurementCentre.findUnique({
        where: { code: data.code.trim().toUpperCase() },
      });
      if (codeConflict) {
        return { success: false, error: `Centre code ${data.code} already in use.` };
      }
    }

    await prisma.procurementCentre.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.code !== undefined && { code: data.code.trim().toUpperCase() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
        ...(data.address !== undefined && { address: data.address?.trim() || null }),
        ...(data.village !== undefined && { village: data.village?.trim() || null }),
        ...(data.mandal !== undefined && { mandal: data.mandal?.trim() || null }),
        ...(data.district !== undefined && { district: data.district?.trim() || null }),
        ...(data.state !== undefined && { state: data.state?.trim() || "Andhra Pradesh" }),
        ...(data.pincode !== undefined && { pincode: data.pincode?.trim() || null }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
        ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone?.trim() || null }),
        ...(data.operatingStartTime !== undefined && { operatingStartTime: data.operatingStartTime }),
        ...(data.operatingEndTime !== undefined && { operatingEndTime: data.operatingEndTime }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    revalidatePath("/admin/procurement-centres");
    revalidatePath(`/admin/procurement-centres/${id}`);
    revalidatePath("/farmer/procurement/centres");
    revalidatePath(`/farmer/procurement/centres/${id}`);

    return { success: true };
  } catch (error: unknown) {
    console.error("Error updating procurement centre:", error);
    const msg = error instanceof Error ? error.message : "Failed to update centre.";
    return { success: false, error: msg };
  }
}

/**
 * Toggle centre active status.
 */

export async function toggleAdminProcurementCentreStatusSafe(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const session = await requireRole("ADMIN");

  try {
    if (!isActive) {
      // Check for active dependencies before deactivating
      const activeBookings = await prisma.procurementBooking.count({
        where: {
          centreId: id,
          status: {
            in: ["BOOKED", "ARRIVED", "WAITING", "IN_PROGRESS", "WEIGHING", "QUALITY_INSPECTION"]
          },
          slot: {
            date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
          }
        }
      });

      if (activeBookings > 0) {
        return { 
          success: false, 
          error: `Cannot deactivate centre. There are ${activeBookings} active or upcoming bookings that must be processed or cancelled first.` 
        };
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.procurementCentre.update({
        where: { id },
        data: { isActive },
      });
      
      await tx.auditLog.create({
        data: {
          actorUserId: (session?.user?.id as string),
          actorRole: "ADMIN",
          action: isActive ? "CENTRE_ACTIVATED" : "CENTRE_DEACTIVATED",
          entityType: "ProcurementCentre",
          entityId: id,
          metadata: {}
        }
      });
    });

    revalidatePath("/admin/procurement-centres");
    revalidatePath("/farmer/procurement/centres");

    return { success: true };
  } catch (error: unknown) {
    console.error("Error toggling centre status:", error);
    return { success: false, error: "Failed to update status." };
  }
}

export async function getPaginatedAdminProcurementCentres(page = 1, limit = 25, search = "", statusFilter = "ALL") {
  await requireRole("ADMIN");
  
  const where: any = {};
  
  if (search.trim()) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
      { village: { contains: search, mode: "insensitive" } },
    ];
  }

  if (statusFilter === "ACTIVE") where.isActive = true;
  if (statusFilter === "INACTIVE") where.isActive = false;
  if (statusFilter === "MAPPED") {
    where.latitude = { not: null };
    where.longitude = { not: null };
  }
  if (statusFilter === "UNMAPPED") {
    where.OR = [
      { latitude: null },
      { longitude: null }
    ];
  }

  const skip = (page - 1) * limit;

  const total = await prisma.procurementCentre.count({ where });

  const centres = await prisma.procurementCentre.findMany({
    where,
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    skip,
    take: limit,
    include: {
      _count: {
        select: {
          supportedCrops: true,
          slots: true,
          bookings: true,
          officers: true,
        },
      },
    },
  });

  return {
    centres,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}
