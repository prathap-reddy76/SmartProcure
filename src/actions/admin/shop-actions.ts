"use server";

import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { ShopType } from "@prisma/client";

export async function adminCreateShop(formData: FormData) {
  await requireRole("ADMIN");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const village = formData.get("village") as string;
  const district = formData.get("district") as string;
  const state = formData.get("state") as string;
  const pincode = formData.get("pincode") as string;
  const latRaw = formData.get("latitude") as string;
  const lngRaw = formData.get("longitude") as string;
  const shopTypeStr = formData.get("shopType") as string;

  const ownerEmail = formData.get("ownerEmail") as string;
  const ownerPassword = formData.get("ownerPassword") as string;
  const ownerName = formData.get("ownerName") as string;

  if (!name || !ownerEmail || !ownerPassword || !ownerName || !phone || !shopTypeStr) {
    throw new Error("Missing required fields");
  }

  const shopType = shopTypeStr as ShopType;

  let latitude: number | null = null;
  let longitude: number | null = null;

  if (latRaw || lngRaw) {
    if (!latRaw || !lngRaw) {
      throw new Error("Both latitude and longitude must be provided together.");
    }
    const parsedLat = parseFloat(latRaw);
    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      throw new Error("Invalid latitude. Must be a number between -90 and 90.");
    }
    latitude = parsedLat;

    const parsedLng = parseFloat(lngRaw);
    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      throw new Error("Invalid longitude. Must be a number between -180 and 180.");
    }
    longitude = parsedLng;
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: ownerEmail },
  });

  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }
  
  const existingPhone = await prisma.user.findFirst({
    where: { phone }
  });
  
  if (existingPhone) {
      throw new Error("An account with this phone number already exists.");
  }

  const passwordHash = await bcrypt.hash(ownerPassword, 10);
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

  // Atomic transaction
  await prisma.$transaction(async (tx) => {
    // 1. Create the user
    const user = await tx.user.create({
      data: {
        name: ownerName,
        email: ownerEmail,
        phone,
        passwordHash,
        role: "SHOP_OWNER",
        isActive: true,
      },
    });

    // 2. Create the shop
    await tx.shop.create({
      data: {
        name,
        slug,
        shopType,
        description,
        ownerName,
        phone,
        email: ownerEmail,
        address,
        village,
        district,
        state: pincode ? state || "Andhra Pradesh" : undefined,
        pincode,
        latitude,
        longitude,
        isActive: true,
        userId: user.id,
      },
    });
  });

  revalidatePath("/admin/shops");
  redirect("/admin/shops?success=true");
}

export async function getAdminShops(filters?: { query?: string, shopType?: string, status?: string, district?: string }) {
  await requireRole("ADMIN");
  
  const whereClause: any = {};
  
  if (filters?.query) {
    whereClause.OR = [
      { name: { contains: filters.query, mode: 'insensitive' } },
      { ownerName: { contains: filters.query, mode: 'insensitive' } },
    ];
  }
  if (filters?.shopType) {
    whereClause.shopType = filters.shopType as ShopType;
  }
  if (filters?.status === 'active') whereClause.isActive = true;
  if (filters?.status === 'inactive') whereClause.isActive = false;
  if (filters?.district) whereClause.district = filters.district;
  
  return prisma.shop.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          email: true,
          isActive: true
        }
      },
      _count: {
        select: { products: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}
