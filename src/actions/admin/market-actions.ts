"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function adminCreateMarket(formData: FormData) {
  await requireRole("ADMIN");

  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const district = formData.get("district") as string;
  const state = formData.get("state") as string;
  const address = formData.get("address") as string;
  const latRaw = formData.get("latitude") as string;
  const lngRaw = formData.get("longitude") as string;
  const isActiveRaw = formData.get("isActive");

  if (!name) {
    throw new Error("Market name is required.");
  }

  let latitude: number | null = null;
  let longitude: number | null = null;

  if (latRaw) {
    const parsedLat = parseFloat(latRaw);
    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      throw new Error("Invalid latitude. Must be a number between -90 and 90.");
    }
    latitude = parsedLat;
  }

  if (lngRaw) {
    const parsedLng = parseFloat(lngRaw);
    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      throw new Error("Invalid longitude. Must be a number between -180 and 180.");
    }
    longitude = parsedLng;
  }

  await prisma.market.create({
    data: {
      name,
      type: type || null,
      district: district || null,
      state: state || "Andhra Pradesh",
      address: address || null,
      latitude,
      longitude,
      isActive: isActiveRaw === "on",
    },
  });

  revalidatePath("/admin/market-prices");
  redirect("/admin/market-prices?success=true");
}
