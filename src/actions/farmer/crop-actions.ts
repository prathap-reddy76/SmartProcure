"use server";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { SessionUser } from "@/types/auth";

const cropSchema = z.object({
  cropName: z.string().min(1, "Please enter crop name").max(100),
  variety: z.string().max(100).optional(),
  area: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) > 0), {
      message: "Cultivated area must be a positive number",
    }),
  areaUnit: z.string().default("acres"),
  season: z.string().optional(),
  plantingDate: z.string().optional(),
  harvestDate: z.string().optional(),
});

export type CropData = {
  id: string;
  cropName: string;
  variety: string | null;
  area: number | null;
  areaUnit: string | null;
  season: string | null;
  plantingDate: string | null;
  harvestDate: string | null;
  createdAt: string;
};

export async function getFarmerCrops(): Promise<{
  crops?: CropData[];
  error?: string;
}> {
  try {
    const session = await requireRole("FARMER");
    const userSession = session.user as SessionUser;
    const userId = userSession.id;

    const profile = await prisma.farmerProfile.findUnique({
      where: { userId },
      include: {
        crops: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!profile) {
      return { crops: [] };
    }

    const safeCrops = profile.crops.map((c) => ({
      id: c.id,
      cropName: c.cropName,
      variety: c.variety,
      area: c.area ? Number(c.area) : null,
      areaUnit: c.areaUnit,
      season: c.season,
      plantingDate: c.plantingDate ? c.plantingDate.toISOString().split("T")[0] : null,
      harvestDate: c.harvestDate ? c.harvestDate.toISOString().split("T")[0] : null,
      createdAt: c.createdAt.toISOString(),
    }));

    return { crops: safeCrops };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error fetching farmer crops:", error);
    return { error: "Failed to load crops." };
  }
}

export async function addFarmerCrop(
  _prevState: unknown,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await requireRole("FARMER");
    const userSession = session.user as SessionUser;
    const userId = userSession.id;

    let profile = await prisma.farmerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await prisma.farmerProfile.create({
        data: { userId },
      });
    }

    const rawData = {
      cropName: formData.get("cropName")?.toString().trim() || "",
      variety: formData.get("variety")?.toString().trim() || "",
      area: formData.get("area")?.toString().trim() || "",
      areaUnit: formData.get("areaUnit")?.toString().trim() || "acres",
      season: formData.get("season")?.toString().trim() || "",
      plantingDate: formData.get("plantingDate")?.toString().trim() || "",
      harvestDate: formData.get("harvestDate")?.toString().trim() || "",
    };

    const parsed = cropSchema.safeParse(rawData);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Validation failed" };
    }

    const { cropName, variety, area, areaUnit, season, plantingDate, harvestDate } = parsed.data;

    await prisma.farmerCrop.create({
      data: {
        farmerProfileId: profile.id,
        cropName,
        variety: variety || null,
        area: area ? Number(area) : null,
        areaUnit: areaUnit || "acres",
        season: season || null,
        plantingDate: plantingDate ? new Date(plantingDate) : null,
        harvestDate: harvestDate ? new Date(harvestDate) : null,
      },
    });

    revalidatePath("/farmer/crops");
    revalidatePath("/farmer/dashboard");

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error adding crop:", error);
    return { error: "An unexpected error occurred while adding the crop." };
  }
}

export async function deleteFarmerCrop(
  cropId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await requireRole("FARMER");
    const userSession = session.user as SessionUser;
    const userId = userSession.id;

    const profile = await prisma.farmerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return { error: "Profile not found" };
    }

    // Security check: verify this crop belongs to this farmer's profile
    const crop = await prisma.farmerCrop.findUnique({
      where: { id: cropId },
    });

    if (!crop || crop.farmerProfileId !== profile.id) {
      return { error: "Unauthorized: Crop does not belong to your profile" };
    }

    await prisma.farmerCrop.delete({
      where: { id: cropId },
    });

    revalidatePath("/farmer/crops");
    revalidatePath("/farmer/dashboard");

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error deleting crop:", error);
    return { error: "Failed to delete crop." };
  }
}
