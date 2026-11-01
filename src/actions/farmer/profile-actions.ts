"use server";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { SessionUser } from "@/types/auth";

const profileSchema = z.object({
  name: z.string().min(1, "Please enter your full name"),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^[6-9]\d{9}$/.test(val.replace(/[\s-]/g, "")), {
      message: "Please enter a valid 10-digit Indian phone number",
    }),
  village: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{6}$/.test(val.trim()), {
      message: "Please enter a valid 6-digit PIN code",
    }),
  address: z.string().max(300).optional(),
});

export type ProfileData = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  profileId: string | null;
  village: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  address: string | null;
};

export async function getFarmerProfile(): Promise<{ profile?: ProfileData; error?: string }> {
  try {
    const session = await requireRole("FARMER");
    const userSession = session.user as SessionUser;
    const userId = userSession.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { farmerProfile: true },
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Ensure farmer profile exists
    let farmerProfile = user.farmerProfile;
    if (!farmerProfile) {
      farmerProfile = await prisma.farmerProfile.create({
        data: { userId: user.id },
      });
    }

    return {
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        profileId: farmerProfile.id,
        village: farmerProfile.village,
        district: farmerProfile.district,
        state: farmerProfile.state,
        pincode: farmerProfile.pincode,
        address: farmerProfile.address,
      },
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error fetching farmer profile:", error);
    return { error: "Failed to load profile. Please try again." };
  }
}

export async function updateFarmerProfile(
  _prevState: unknown,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await requireRole("FARMER");
    const userSession = session.user as SessionUser;
    const userId = userSession.id;

    const rawData = {
      name: formData.get("name")?.toString().trim() || "",
      phone: formData.get("phone")?.toString().trim() || "",
      village: formData.get("village")?.toString().trim() || "",
      district: formData.get("district")?.toString().trim() || "",
      state: formData.get("state")?.toString().trim() || "",
      pincode: formData.get("pincode")?.toString().trim() || "",
      address: formData.get("address")?.toString().trim() || "",
    };

    const parsed = profileSchema.safeParse(rawData);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Validation failed" };
    }

    const { name, phone, village, district, state, pincode, address } = parsed.data;

    // Check if phone number is taken by another user
    if (phone) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone,
          NOT: { id: userId },
        },
      });
      if (existingPhone) {
        return { error: "This phone number is already registered to another account." };
      }
    }

    // Update user and farmer profile in transaction
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          name,
          phone: phone || null,
        },
      });

      await tx.farmerProfile.upsert({
        where: { userId },
        create: {
          userId,
          village: village || null,
          district: district || null,
          state: state || null,
          pincode: pincode || null,
          address: address || null,
        },
        update: {
          village: village || null,
          district: district || null,
          state: state || null,
          pincode: pincode || null,
          address: address || null,
        },
      });
    });

    revalidatePath("/farmer/profile");
    revalidatePath("/farmer/dashboard");
    revalidatePath("/farmer/farm");

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error updating farmer profile:", error);
    return { error: "An unexpected error occurred while saving profile." };
  }
}
