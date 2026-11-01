"use server";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { SessionUser } from "@/types/auth";

const farmSchema = z.object({
  farmName: z.string().min(1, "Please provide a name or identifier for your farm").max(100),
  farmSize: z
    .string()
    .min(1, "Please specify farm size")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Farm size must be a positive number",
    }),
  farmSizeUnit: z.string().default("acres"),
  landType: z.string().min(1, "Please select land type"),
  irrigationType: z.string().min(1, "Please select irrigation type"),
  primaryCrop: z.string().min(1, "Please specify your primary crop").max(100),
  village: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
});

export type FarmData = {
  id: string;
  farmName: string | null;
  farmSize: number | null;
  farmSizeUnit: string | null;
  landType: string | null;
  irrigationType: string | null;
  primaryCrop: string | null;
  village: string | null;
  district: string | null;
  state: string | null;
  updatedAt: string;
};

export async function getFarmDetails(): Promise<{
  farm?: FarmData | null;
  farmerProfile?: {
    village: string | null;
    district: string | null;
    state: string | null;
  };
  error?: string;
}> {
  try {
    const session = await requireRole("FARMER");
    const userSession = session.user as SessionUser;
    const userId = userSession.id;

    const profile = await prisma.farmerProfile.findUnique({
      where: { userId },
      include: { farm: true },
    });

    if (!profile) {
      return { farm: null };
    }

    if (!profile.farm) {
      return {
        farm: null,
        farmerProfile: {
          village: profile.village,
          district: profile.district,
          state: profile.state,
        },
      };
    }

    return {
      farm: {
        id: profile.farm.id,
        farmName: profile.farm.farmName,
        farmSize: profile.farm.farmSize ? Number(profile.farm.farmSize) : null,
        farmSizeUnit: profile.farm.farmSizeUnit || "acres",
        landType: profile.farm.landType,
        irrigationType: profile.farm.irrigationType,
        primaryCrop: profile.farm.primaryCrop,
        village: profile.farm.village || profile.village,
        district: profile.farm.district || profile.district,
        state: profile.farm.state || profile.state,
        updatedAt: profile.farm.updatedAt.toISOString(),
      },
      farmerProfile: {
        village: profile.village,
        district: profile.district,
        state: profile.state,
      },
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error fetching farm details:", error);
    return { error: "Failed to load farm details." };
  }
}

export async function updateFarmDetails(
  _prevState: unknown,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await requireRole("FARMER");
    const userSession = session.user as SessionUser;
    const userId = userSession.id;

    // Get or create farmer profile
    let profile = await prisma.farmerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await prisma.farmerProfile.create({
        data: { userId },
      });
    }

    const rawData = {
      farmName: formData.get("farmName")?.toString().trim() || "",
      farmSize: formData.get("farmSize")?.toString().trim() || "",
      farmSizeUnit: formData.get("farmSizeUnit")?.toString().trim() || "acres",
      landType: formData.get("landType")?.toString().trim() || "",
      irrigationType: formData.get("irrigationType")?.toString().trim() || "",
      primaryCrop: formData.get("primaryCrop")?.toString().trim() || "",
      village: formData.get("village")?.toString().trim() || "",
      district: formData.get("district")?.toString().trim() || "",
      state: formData.get("state")?.toString().trim() || "",
    };

    const parsed = farmSchema.safeParse(rawData);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Validation failed" };
    }

    const {
      farmName,
      farmSize,
      farmSizeUnit,
      landType,
      irrigationType,
      primaryCrop,
      village,
      district,
      state,
    } = parsed.data;

    await prisma.farm.upsert({
      where: { farmerProfileId: profile.id },
      create: {
        farmerProfileId: profile.id,
        farmName,
        farmSize: Number(farmSize),
        farmSizeUnit,
        landType,
        irrigationType,
        primaryCrop,
        village: village || profile.village || null,
        district: district || profile.district || null,
        state: state || profile.state || null,
      },
      update: {
        farmName,
        farmSize: Number(farmSize),
        farmSizeUnit,
        landType,
        irrigationType,
        primaryCrop,
        village: village || profile.village || null,
        district: district || profile.district || null,
        state: state || profile.state || null,
      },
    });

    revalidatePath("/farmer/farm");
    revalidatePath("/farmer/dashboard");

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error updating farm details:", error);
    return { error: "An unexpected error occurred while saving farm details." };
  }
}
