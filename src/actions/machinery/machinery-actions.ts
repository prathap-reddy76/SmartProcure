"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { calculateDistance } from "@/lib/distance";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MachineryCondition, Prisma } from "@prisma/client";
import { requireAnyRole } from "@/lib/auth-utils";
import { storage } from "@/lib/storage";

// -------------------------------------------------------------
// Validation Schemas
// -------------------------------------------------------------

const createMachinerySchema = z
  .object({
    name: z.string().min(2, "Machinery name must be at least 2 characters"),
    categoryId: z.string().min(1, "Please select a category"),
    brand: z.string().optional(),
    modelNumber: z.string().optional(),
    description: z.string().optional(),
    yearOfMake: z.number().int().min(1970).max(new Date().getFullYear() + 1).optional(),
    purchaseYear: z.number().int().min(1970).max(new Date().getFullYear() + 1).optional(),
    condition: z.enum(["NEW", "EXCELLENT", "GOOD", "FAIR"]).optional().default("GOOD"),
    horsepower: z.number().int().positive().optional(),
    fuelType: z.string().optional(),
    location: z.string().min(2, "Location is required"),
    address: z.string().optional(),
    serviceRadiusKm: z.number().nonnegative().optional(),
    availableFrom: z.string().optional(),
    availableUntil: z.string().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),

    supportsHourly: z.boolean().optional().default(false),
    pricePerHour: z.number().positive().optional(),
    supportsDaily: z.boolean().optional().default(true),
    pricePerDay: z.number().positive().optional(),
    supportsPerAcre: z.boolean().optional().default(false),
    pricePerAcre: z.number().positive().optional(),
    rentalUnitType: z.string().optional(),
    customRentalUnitName: z.string().optional(),
    customRentalPrice: z.number().positive().optional(),

    securityDeposit: z.number().nonnegative().optional().default(0),
    deliveryCharge: z.number().nonnegative().optional().default(0),
    imageUrls: z.array(z.string()).max(8, "Maximum 8 images allowed").optional(),
    specifications: z.record(z.string(), z.any()).optional(),
  })
  .refine(
    (data) =>
      (data.supportsHourly && data.pricePerHour && data.pricePerHour > 0) ||
      (data.supportsDaily && data.pricePerDay && data.pricePerDay > 0) ||
      (data.supportsPerAcre && data.pricePerAcre && data.pricePerAcre > 0) ||
      (data.customRentalPrice && data.customRentalPrice > 0),
    {
      message: "At least one rental pricing option with a valid price must be enabled",
      path: ["supportsDaily"],
    }
  );

export type CreateMachineryInput = z.input<typeof createMachinerySchema>;

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Non-request environment fallback
  }
}

async function getEffectiveUserId(testUserId?: string): Promise<string | null> {
  if (process.env.NODE_ENV === "test" && testUserId) {
    return testUserId;
  }
  try {
    const session = await auth();
    return session?.user?.id || null;
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// Server Actions
// -------------------------------------------------------------

/**
 * Upload machinery image with strict MIME, size, and extension validation.
 */
export async function uploadMachineryImage(formData: FormData) {
  try {
    const session = await requireAnyRole(["MACHINERY_OWNER", "ADMIN"]);
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized: Please log in as a machinery owner" };
    }

    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      return { success: false, error: "No file provided" };
    }

    // Size limit 10MB
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: "Image file size exceeds the 10MB limit" };
    }

    // Strict MIME validation
    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimes.includes(file.type)) {
      return {
        success: false,
        error: "Unsupported image format. Only JPG, PNG, and WebP are allowed.",
      };
    }

    // Reject dangerous extensions (SVG, HTML, executables)
    const lower = file.name.toLowerCase();
    const blockedExtensions = [
      ".svg",
      ".html",
      ".htm",
      ".js",
      ".exe",
      ".sh",
      ".bat",
      ".cmd",
      ".php",
      ".msi",
      ".py",
    ];
    if (blockedExtensions.some((ext) => lower.endsWith(ext))) {
      return {
        success: false,
        error: "Invalid file extension. Executables, HTML, and SVG files are rejected.",
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const sanitizedBase = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `machinery-${Date.now()}-${sanitizedBase}`;

    // Upload using storage abstraction
    const url = await storage.upload(fileName, buffer, file.type);
    return { success: true, url };
  } catch (error: unknown) {
    console.error("Error uploading machinery image:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to upload image" };
  }
}

/**
 * Get all active machinery categories
 */
export async function getMachineryCategories() {
  try {
    const categories = await prisma.machineryCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return { success: true, categories };
  } catch (error) {
    console.error("Error fetching machinery categories:", error);
    return { success: false, categories: [], error: "Failed to fetch categories" };
  }
}

/**
 * Get farmer discovery machinery listings with multi-filter search and distance calculation.
 */
export async function getFarmerMachineryListings(filters: {
  search?: string;
  categoryId?: string;
  rentalMode?: "HOURLY" | "DAILY" | "PER_ACRE";
  minPrice?: number;
  maxPrice?: number;
  minHp?: number;
  maxHp?: number;
  brand?: string;
  condition?: MachineryCondition;
  availableOnly?: boolean;
  userLat?: number;
  userLon?: number;
  sortBy?: "nearest" | "price_asc" | "price_desc" | "newest";
}) {
  try {
    const where: Prisma.MachineryWhereInput = {
      isApproved: true,
      isActive: true,
    };

    if (filters.availableOnly !== false) {
      where.isAvailable = true;
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.condition) {
      where.condition = filters.condition;
    }

    if (filters.brand) {
      where.brand = { contains: filters.brand.trim(), mode: "insensitive" };
    }

    if (filters.minHp !== undefined || filters.maxHp !== undefined) {
      where.horsepower = {};
      if (filters.minHp !== undefined) where.horsepower.gte = filters.minHp;
      if (filters.maxHp !== undefined) where.horsepower.lte = filters.maxHp;
    }

    if (filters.rentalMode === "HOURLY") {
      where.supportsHourly = true;
    } else if (filters.rentalMode === "DAILY") {
      where.supportsDaily = true;
    } else if (filters.rentalMode === "PER_ACRE") {
      where.supportsPerAcre = true;
    }

    if (filters.search) {
      const q = filters.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { modelNumber: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const rawListings = await prisma.machinery.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true } },
        owner: { select: { id: true, name: true, phone: true } },
        images: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Map and serialize Decimals
    let listings = rawListings.map((m) => {
      // Calculate representative base price for sorting/display
      const effectivePrice =
        m.supportsDaily && m.pricePerDay
          ? m.pricePerDay.toNumber()
          : m.supportsHourly && m.pricePerHour
          ? m.pricePerHour.toNumber()
          : m.supportsPerAcre && m.pricePerAcre
          ? m.pricePerAcre.toNumber()
          : 0;

      // Distance calculation
      let distanceKm: number | null = null;
      if (
        filters.userLat !== undefined &&
        filters.userLon !== undefined &&
        m.latitude !== null &&
        m.longitude !== null
      ) {
        distanceKm = calculateDistance(
          filters.userLat,
          filters.userLon,
          m.latitude,
          m.longitude
        );
      }

      return {
        id: m.id,
        name: m.name,
        brand: m.brand,
        modelNumber: m.modelNumber,
        description: m.description,
        yearOfMake: m.yearOfMake,
        condition: m.condition,
        horsepower: m.horsepower,
        fuelType: m.fuelType,
        location: m.location,
        latitude: m.latitude,
        longitude: m.longitude,
        distanceKm,

        supportsHourly: m.supportsHourly,
        pricePerHour: m.pricePerHour?.toNumber() ?? null,
        supportsDaily: m.supportsDaily,
        pricePerDay: m.pricePerDay?.toNumber() ?? null,
        supportsPerAcre: m.supportsPerAcre,
        pricePerAcre: m.pricePerAcre?.toNumber() ?? null,
        effectivePrice,

        securityDeposit: m.securityDeposit.toNumber(),
        deliveryCharge: m.deliveryCharge.toNumber(),
        isAvailable: m.isAvailable,
        isApproved: m.isApproved,
        category: m.category,
        specifications: (m.specifications as Prisma.JsonObject) ?? null,
        ownerName: m.owner.name || "Equipment Owner",
        images: m.images.map((img) => img.url),
        createdAt: m.createdAt.toISOString(),
      };
    });

    // Price range filtering on effective price
    if (filters.minPrice !== undefined) {
      listings = listings.filter((l) => l.effectivePrice >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      listings = listings.filter((l) => l.effectivePrice <= filters.maxPrice!);
    }

    // Client-level sorting
    if (filters.sortBy === "nearest" && filters.userLat !== undefined) {
      listings.sort((a, b) => (a.distanceKm ?? 99999) - (b.distanceKm ?? 99999));
    } else if (filters.sortBy === "price_asc") {
      listings.sort((a, b) => a.effectivePrice - b.effectivePrice);
    } else if (filters.sortBy === "price_desc") {
      listings.sort((a, b) => b.effectivePrice - a.effectivePrice);
    }

    return { success: true, listings };
  } catch (error) {
    console.error("Error fetching farmer machinery listings:", error);
    return { success: false, listings: [], error: "Failed to load machinery" };
  }
}

/**
 * Get detailed machinery record by ID
 */
export async function getMachineryListingById(id: string) {
  try {
    const m = await prisma.machinery.findUnique({
      where: { id },
      include: {
        category: true,
        owner: { select: { id: true, name: true, phone: true } },
        images: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!m) {
      return { success: false, error: "Machinery not found" };
    }

    return {
      success: true,
      machinery: {
        id: m.id,
        ownerId: m.ownerId,
        categoryId: m.categoryId,
        name: m.name,
        brand: m.brand,
        modelNumber: m.modelNumber,
        description: m.description,
        yearOfMake: m.yearOfMake,
        condition: m.condition,
        horsepower: m.horsepower,
        fuelType: m.fuelType,
        location: m.location,
        address: m.address,
        latitude: m.latitude,
        longitude: m.longitude,
        supportsHourly: m.supportsHourly,
        pricePerHour: m.pricePerHour?.toNumber() ?? null,
        supportsDaily: m.supportsDaily,
        pricePerDay: m.pricePerDay?.toNumber() ?? null,
        supportsPerAcre: m.supportsPerAcre,
        pricePerAcre: m.pricePerAcre?.toNumber() ?? null,
        securityDeposit: m.securityDeposit.toNumber(),
        deliveryCharge: m.deliveryCharge.toNumber(),
        isAvailable: m.isAvailable,
        isApproved: m.isApproved,
        isActive: m.isActive,
        category: m.category,
        specifications: (m.specifications as Prisma.JsonObject) ?? null,
        ownerName: m.owner.name || "Equipment Owner",
        owner: {
          id: m.owner.id,
          name: m.owner.name || "Equipment Owner",
          phone: m.owner.phone,
        },
        images: m.images.map((img) => img.url),
        createdAt: m.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Error fetching machinery by ID:", error);
    return { success: false, error: "Failed to load machinery details" };
  }
}

/**
 * Create machinery listing by MACHINERY_OWNER
 */
export async function createMachineryListing(rawInput: CreateMachineryInput, testUserId?: string) {
  try {
    const userId = await getEffectiveUserId(testUserId);
    if (!userId) {
      return { success: false, error: "Unauthorized: Please log in" };
    }

    // Role verification
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== "MACHINERY_OWNER" && user?.role !== "ADMIN") {
      return { success: false, error: "Only machinery owners can create listings" };
    }

    const parsed = createMachinerySchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid input data",
      };
    }

    const data = parsed.data;

    // Harmonize HP and fuelType from specifications if not provided directly
    const hp =
      data.horsepower ||
      (data.specifications?.hp ? Number(data.specifications.hp) : undefined) ||
      (data.specifications?.enginePowerHp ? Number(data.specifications.enginePowerHp) : undefined);

    const fuelType: string | undefined = (typeof data.fuelType === "string" && data.fuelType.trim()) ? data.fuelType.trim() : (typeof data.specifications?.fuelType === "string" && data.specifications.fuelType.trim()) ? data.specifications.fuelType.trim() : undefined;

    const created = await prisma.machinery.create({
      data: {
        ownerId: userId,
        categoryId: data.categoryId,
        name: data.name,
        brand: data.brand,
        modelNumber: data.modelNumber,
        description: data.description,
        yearOfMake: data.yearOfMake,
        condition: data.condition as MachineryCondition,
        horsepower: hp,
        fuelType,
        location: data.location,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        supportsHourly: data.supportsHourly,
        pricePerHour: data.pricePerHour,
        supportsDaily: data.supportsDaily,
        pricePerDay: data.pricePerDay,
        supportsPerAcre: data.supportsPerAcre,
        pricePerAcre: data.pricePerAcre,
        securityDeposit: data.securityDeposit,
        deliveryCharge: data.deliveryCharge,
        isAvailable: true,
        isApproved: true, // Auto-approved for verified owners
        isActive: true,
        specifications: (data.specifications as Prisma.InputJsonValue) ?? {},
        images: {
          create: (data.imageUrls || []).slice(0, 8).map((url, idx) => ({
            url,
            sortOrder: idx,
          })),
        },
      },
    });

    safeRevalidate("/machinery/my-machinery");
    safeRevalidate("/farmer/machinery");

    return { success: true, machineryId: created.id };
  } catch (error) {
    console.error("Error creating machinery listing:", error);
    return { success: false, error: "Failed to create machinery listing" };
  }
}

/**
 * Update machinery listing by MACHINERY_OWNER or ADMIN
 */
export async function updateMachineryListing(
  machineryId: string,
  rawInput: Partial<CreateMachineryInput>,
  testUserId?: string
) {
  try {
    const userId = await getEffectiveUserId(testUserId);
    if (!userId) {
      return { success: false, error: "Unauthorized: Please log in" };
    }

    const machine = await prisma.machinery.findUnique({
      where: { id: machineryId },
      include: { images: true },
    });

    if (!machine) {
      return { success: false, error: "Machinery not found" };
    }

    if (machine.ownerId !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== "ADMIN") {
        return { success: false, error: "Forbidden: You do not own this machine" };
      }
    }

    const hp =
      rawInput.horsepower ??
      (rawInput.specifications?.hp ? Number(rawInput.specifications.hp) : undefined) ??
      (rawInput.specifications?.enginePowerHp ? Number(rawInput.specifications.enginePowerHp) : machine.horsepower);

    const fuelType =
      rawInput.fuelType?.trim() ?? rawInput.specifications?.fuelType ?? machine.fuelType;

    const updated = await prisma.machinery.update({
      where: { id: machineryId },
      data: {
        categoryId: rawInput.categoryId || machine.categoryId,
        name: rawInput.name?.trim() || machine.name,
        brand: rawInput.brand?.trim() ?? machine.brand,
        modelNumber: rawInput.modelNumber?.trim() ?? machine.modelNumber,
        description: rawInput.description?.trim() ?? machine.description,
        yearOfMake: rawInput.yearOfMake ?? machine.yearOfMake,
        condition: (rawInput.condition as MachineryCondition) ?? machine.condition,
        horsepower: hp,
        fuelType,
        location: rawInput.location?.trim() || machine.location,
        address: rawInput.address?.trim() ?? machine.address,
        latitude: rawInput.latitude ?? machine.latitude,
        longitude: rawInput.longitude ?? machine.longitude,
        supportsHourly: rawInput.supportsHourly ?? machine.supportsHourly,
        pricePerHour: rawInput.pricePerHour !== undefined ? rawInput.pricePerHour : machine.pricePerHour,
        supportsDaily: rawInput.supportsDaily ?? machine.supportsDaily,
        pricePerDay: rawInput.pricePerDay !== undefined ? rawInput.pricePerDay : machine.pricePerDay,
        supportsPerAcre: rawInput.supportsPerAcre ?? machine.supportsPerAcre,
        pricePerAcre: rawInput.pricePerAcre !== undefined ? rawInput.pricePerAcre : machine.pricePerAcre,
        securityDeposit: rawInput.securityDeposit !== undefined ? rawInput.securityDeposit : machine.securityDeposit,
        deliveryCharge: rawInput.deliveryCharge !== undefined ? rawInput.deliveryCharge : machine.deliveryCharge,
        specifications: rawInput.specifications !== undefined ? (rawInput.specifications as Prisma.InputJsonValue) : (machine.specifications as Prisma.InputJsonValue),
      },
    });

    if (Array.isArray(rawInput.imageUrls)) {
      await prisma.machineryImage.deleteMany({ where: { machineryId } });
      if (rawInput.imageUrls.length > 0) {
        await prisma.machineryImage.createMany({
          data: rawInput.imageUrls.slice(0, 8).map((url: string, idx: number) => ({
            machineryId,
            url,
            sortOrder: idx,
          })),
        });
      }
    }

    safeRevalidate("/machinery/my-machinery");
    safeRevalidate(`/farmer/machinery/${machineryId}`);
    safeRevalidate("/farmer/machinery");

    return { success: true, machineryId: updated.id };
  } catch (error: unknown) {
    console.error("Error updating machinery listing:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update machinery listing" };
  }
}

/**
 * Delete machinery listing
 */
export async function deleteMachineryListing(machineryId: string, testUserId?: string) {
  try {
    const userId = await getEffectiveUserId(testUserId);
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const machine = await prisma.machinery.findUnique({
      where: { id: machineryId },
    });

    if (!machine) {
      return { success: false, error: "Machinery not found" };
    }

    if (machine.ownerId !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== "ADMIN") {
        return { success: false, error: "Forbidden: You do not own this machine" };
      }
    }

    await prisma.machinery.delete({ where: { id: machineryId } });

    safeRevalidate("/machinery/my-machinery");
    safeRevalidate("/farmer/machinery");

    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting machinery listing:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete machinery listing" };
  }
}

/**
 * Toggle machinery availability
 */
export async function toggleMachineryAvailability(machineryId: string, testUserId?: string) {
  try {
    const userId = await getEffectiveUserId(testUserId);
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const machine = await prisma.machinery.findUnique({
      where: { id: machineryId },
    });

    if (!machine) {
      return { success: false, error: "Machinery not found" };
    }

    if (machine.ownerId !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== "ADMIN") {
        return { success: false, error: "Forbidden: You do not own this machine" };
      }
    }

    const updated = await prisma.machinery.update({
      where: { id: machineryId },
      data: { isAvailable: !machine.isAvailable },
    });

    safeRevalidate("/machinery/my-machinery");
    safeRevalidate("/farmer/machinery");

    return { success: true, isAvailable: updated.isAvailable };
  } catch (error) {
    console.error("Error toggling machinery availability:", error);
    return { success: false, error: "Failed to update availability" };
  }
}

/**
 * Get owner's own machinery listings
 */
export async function getOwnerMachineryListings(testUserId?: string) {
  try {
    const userId = await getEffectiveUserId(testUserId);
    if (!userId) {
      return { success: false, listings: [], error: "Unauthorized" };
    }

    const listings = await prisma.machinery.findMany({
      where: { ownerId: userId },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      listings: listings.map((m) => ({
        id: m.id,
        name: m.name,
        brand: m.brand,
        modelNumber: m.modelNumber,
        categoryName: m.category.name,
        location: m.location,
        supportsHourly: m.supportsHourly,
        pricePerHour: m.pricePerHour?.toNumber() ?? null,
        supportsDaily: m.supportsDaily,
        pricePerDay: m.pricePerDay?.toNumber() ?? null,
        supportsPerAcre: m.supportsPerAcre,
        pricePerAcre: m.pricePerAcre?.toNumber() ?? null,
        securityDeposit: m.securityDeposit.toNumber(),
        deliveryCharge: m.deliveryCharge.toNumber(),
        isAvailable: m.isAvailable,
        isApproved: m.isApproved,
        specifications: (m.specifications as Prisma.JsonObject) ?? null,
        bookingsCount: m._count.bookings,
        images: m.images.map((img) => img.url),
        createdAt: m.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Error fetching owner machinery listings:", error);
    return { success: false, listings: [], error: "Failed to load listings" };
  }
}

/**
 * Admin action: get all machinery listings across the platform
 */
export async function getAdminMachineryListings() {
  try {
    const userId = await getEffectiveUserId();
    if (!userId) {
      return { success: false, listings: [], error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return { success: false, listings: [], error: "Admin role required" };
    }

    const listings = await prisma.machinery.findMany({
      include: {
        category: true,
        owner: { select: { id: true, name: true, email: true, phone: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      listings: listings.map((m) => ({
        id: m.id,
        name: m.name,
        brand: m.brand,
        modelNumber: m.modelNumber,
        categoryName: m.category.name,
        ownerName: m.owner.name || "Owner",
        ownerEmail: m.owner.email,
        ownerPhone: m.owner.phone,
        location: m.location,
        pricePerDay: m.pricePerDay?.toNumber() ?? null,
        pricePerHour: m.pricePerHour?.toNumber() ?? null,
        pricePerAcre: m.pricePerAcre?.toNumber() ?? null,
        isAvailable: m.isAvailable,
        isApproved: m.isApproved,
        isActive: m.isActive,
        specifications: (m.specifications as Prisma.JsonObject) ?? null,
        bookingsCount: m._count.bookings,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Error fetching admin machinery listings:", error);
    return { success: false, listings: [], error: "Failed to load admin listings" };
  }
}

/**
 * Admin action: approve or reject machinery listing
 */
export async function adminApproveMachinery(
  machineryId: string,
  isApproved: boolean,
  testUserId?: string
) {
  try {
    const userId = await getEffectiveUserId(testUserId);
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return { success: false, error: "Admin role required" };
    }

    const updated = await prisma.machinery.update({
      where: { id: machineryId },
      data: { isApproved },
    });

    safeRevalidate("/admin/machinery");
    safeRevalidate("/farmer/machinery");

    return { success: true, isApproved: updated.isApproved };
  } catch (error) {
    console.error("Error toggling admin machinery approval:", error);
    return { success: false, error: "Failed to update approval" };
  }
}
