"use server";

import { requireRole } from "@/lib/auth-utils";
import { SessionUser } from "@/types/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ShopType } from "@prisma/client";
import { storage } from "@/lib/storage";

export async function createShopProduct(formData: FormData) {
  const session = await requireRole("SHOP_OWNER");
  const user = session.user as SessionUser;

  const shop = await prisma.shop.findUnique({
    where: { userId: user.id },
  });

  if (!shop) {
    throw new Error("No agricultural shop found linked to your account.");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const rawPrice = formData.get("price") as string;
  const rawUnit = formData.get("unit") as string;
  const rawStock = formData.get("stock") as string;
  const categoryId = formData.get("categoryId") as string;

  if (!name || !categoryId) {
    throw new Error("Missing required fields: Product Name and Category are required");
  }

  const isRentalShop = shop.shopType === "MACHINERY_RENTAL";
  let price = 0;
  let unit = rawUnit || "unit";
  let stock = parseInt(rawStock || "1", 10);

  if (isRentalShop) {
    const rentalHourly = formData.get("rentalHourlyRate") as string | null;
    const rentalDaily = formData.get("rentalDailyRate") as string | null;
    const hourlyNum = rentalHourly ? parseFloat(rentalHourly) : 0;
    const dailyNum = rentalDaily ? parseFloat(rentalDaily) : 0;
    if ((!rentalHourly || hourlyNum <= 0) && (!rentalDaily || dailyNum <= 0)) {
      throw new Error("Rental machinery must specify at least an Hourly Rate or Daily Rate.");
    }
    price = dailyNum > 0 ? dailyNum : hourlyNum;
    unit = dailyNum > 0 ? "day" : "hour";
    stock = 1;
  } else {
    if (!rawPrice) {
      throw new Error("Missing required field: Selling Price");
    }
    price = parseFloat(rawPrice);
  }

  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
  const specifications: Record<string, any> = {};

  // Strictly enforce Server-Side specification mappings based on shop type
  if (shop.shopType === "FERTILIZER") {
    specifications.composition = formData.get("composition");
    specifications.activeIngredient = formData.get("activeIngredient");
    specifications.npkRatio = formData.get("npkRatio");
    specifications.cropSuitability = formData.get("cropSuitability");
    specifications.applicationMethod = formData.get("applicationMethod");
    specifications.dosage = formData.get("dosage");
    specifications.packageSize = formData.get("packageSize");
  } else if (shop.shopType === "MACHINERY_RENTAL") {
    specifications.brand = formData.get("brand");
    specifications.model = formData.get("model");
    specifications.manufacturingYear = formData.get("manufacturingYear");
    specifications.engineHp = formData.get("engineHp");
    specifications.fuelType = formData.get("fuelType");
    specifications.capacity = formData.get("capacity");
    specifications.rentalHourlyRate = formData.get("rentalHourlyRate");
    specifications.rentalDailyRate = formData.get("rentalDailyRate");
    specifications.securityDeposit = formData.get("securityDeposit");
    specifications.operatorAvailable = formData.get("operatorAvailable") === "true";
    specifications.deliveryAvailable = formData.get("deliveryAvailable") === "true";
  } else if (shop.shopType === "MACHINERY_SALES") {
    specifications.brand = formData.get("brand");
    specifications.model = formData.get("model");
    specifications.variant = formData.get("variant");
    specifications.manufacturingYear = formData.get("manufacturingYear");
    specifications.engineHp = formData.get("engineHp");
    specifications.fuelType = formData.get("fuelType");
    specifications.capacity = formData.get("capacity");
    specifications.warranty = formData.get("warranty");
    specifications.deliveryAvailable = formData.get("deliveryAvailable") === "true";
    specifications.installationAvailable = formData.get("installationAvailable") === "true";
    specifications.financingAvailable = formData.get("financingAvailable") === "true";
  }

  // Preserve existing fields for backwards compatibility
  const suitableCrops = formData.get("cropSuitability") as string | null;
  const dosage = formData.get("dosage") as string | null;
  const packageSize = formData.get("packageSize") as string | null;

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      description,
      price,
      unit: unit || "unit",
      stock,
      isActive: true,
      categoryId,
      shopId: shop.id,
      productType: shop.shopType,
      specifications,
      suitableCrops,
      dosage,
      packageSize,
    },
  });

  // Handle Image Upload
  
  const file = formData.get("image") as File | null;
  if (file && file.size > 0) {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.type)) {
      throw new Error("Invalid file type. Only JPG, PNG, and WebP images are allowed.");
    }
    
    if (file.name.toLowerCase().endsWith(".svg") || file.name.toLowerCase().endsWith(".html") || file.name.toLowerCase().endsWith(".js") || file.name.toLowerCase().endsWith(".exe")) {
      throw new Error("Invalid file extension.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const imageUrl = await storage.upload(`product-${Date.now()}-${file.name}`, buffer, file.type);
    
    await prisma.productImage.create({
      data: {
        productId: product.id,
        imageUrl,
        sortOrder: 0
      }
    });
  }


  revalidatePath("/shop/products");
  redirect(`/shop/products/${product.id}?success=true`);
}

export async function uploadProductImage(productId: string, formData: FormData) {
  const session = await requireRole("SHOP_OWNER");
  const user = session.user as SessionUser;

  const shop = await prisma.shop.findUnique({
    where: { userId: user.id },
  });

  if (!shop) throw new Error("No shop found");

  const product = await prisma.product.findUnique({
    where: { id: productId, shopId: shop.id }, // Ensures ownership
  });

  if (!product) throw new Error("Product not found or unauthorized");

  const file = formData.get("file") as File;
  if (!file || file.size === 0) {
      throw new Error("No file provided");
    }
    
    // Strict MIME and extension validation to prevent XSS / malicious uploads
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.type)) {
      throw new Error("Invalid file type. Only JPG, PNG, and WebP images are allowed.");
    }
    
    if (file.name.toLowerCase().endsWith(".svg") || file.name.toLowerCase().endsWith(".html") || file.name.toLowerCase().endsWith(".js")) {
      throw new Error("Invalid file extension.");
    }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Use existing storage abstraction
  const imageUrl = await storage.upload(`product-${Date.now()}-${file.name}`, buffer, file.type);

  // Get max sort order
  const maxOrderImg = await prisma.productImage.findFirst({
    where: { productId },
    orderBy: { sortOrder: 'desc' }
  });

  const sortOrder = maxOrderImg ? maxOrderImg.sortOrder + 1 : 0;

  await prisma.productImage.create({
    data: {
      productId,
      imageUrl,
      sortOrder
    }
  });

  revalidatePath(`/shop/products/${productId}`);
}

export async function deleteProductImage(imageId: string) {
  const session = await requireRole("SHOP_OWNER");
  const user = session.user as SessionUser;

  const shop = await prisma.shop.findUnique({
    where: { userId: user.id },
  });
  if (!shop) throw new Error("No shop found");

  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
    include: { product: true }
  });

  if (!image || image.product.shopId !== shop.id) {
    throw new Error("Image not found or unauthorized");
  }

  // Delete from storage
  await storage.delete(image.imageUrl);

  // Delete from db
  await prisma.productImage.delete({
    where: { id: imageId }
  });

  revalidatePath(`/shop/products/${image.productId}`);
}

export async function setPrimaryProductImage(imageId: string) {
  const session = await requireRole("SHOP_OWNER");
  const user = session.user as SessionUser;

  const shop = await prisma.shop.findUnique({
    where: { userId: user.id },
  });
  if (!shop) throw new Error("No shop found");

  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
    include: { product: true }
  });

  if (!image || image.product.shopId !== shop.id) {
    throw new Error("Image not found or unauthorized");
  }

  // Shift all others up
  await prisma.productImage.updateMany({
    where: { productId: image.productId, id: { not: imageId } },
    data: { sortOrder: { increment: 1 } }
  });

  // Set this one to 0
  await prisma.productImage.update({
    where: { id: imageId },
    data: { sortOrder: 0 }
  });

  revalidatePath(`/shop/products/${image.productId}`);
}

export async function updateShopProduct(productId: string, formData: FormData) {
  const session = await requireRole("SHOP_OWNER");
  const user = session.user as SessionUser;

  const shop = await prisma.shop.findUnique({
    where: { userId: user.id },
  });

  if (!shop) {
    throw new Error("No agricultural shop found linked to your account.");
  }

  const existingProduct = await prisma.product.findUnique({
    where: { id: productId, shopId: shop.id }
  });

  if (!existingProduct) {
    throw new Error("Product not found or unauthorized");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const rawPrice = formData.get("price") as string;
  const rawUnit = formData.get("unit") as string;
  const rawStock = formData.get("stock") as string;
  const categoryId = formData.get("categoryId") as string;
  const isActive = formData.get("isActive") === "true";

  if (!name || !categoryId) {
    throw new Error("Missing required fields: Product Name and Category are required");
  }

  const isRentalShop = shop.shopType === "MACHINERY_RENTAL";
  let price = 0;
  let unit = rawUnit || "unit";
  let stock = parseInt(rawStock || "1", 10);

  if (isRentalShop) {
    const rentalHourly = formData.get("rentalHourlyRate") as string | null;
    const rentalDaily = formData.get("rentalDailyRate") as string | null;
    const hourlyNum = rentalHourly ? parseFloat(rentalHourly) : 0;
    const dailyNum = rentalDaily ? parseFloat(rentalDaily) : 0;
    if ((!rentalHourly || hourlyNum <= 0) && (!rentalDaily || dailyNum <= 0)) {
      throw new Error("Rental machinery must specify at least an Hourly Rate or Daily Rate.");
    }
    price = dailyNum > 0 ? dailyNum : hourlyNum;
    unit = dailyNum > 0 ? "day" : "hour";
    stock = 1;
  } else {
    if (!rawPrice) {
      throw new Error("Missing required field: Selling Price");
    }
    price = parseFloat(rawPrice);
  }

  const specifications: Record<string, any> = {};

  if (shop.shopType === "FERTILIZER") {
    specifications.composition = formData.get("composition");
    specifications.activeIngredient = formData.get("activeIngredient");
    specifications.npkRatio = formData.get("npkRatio");
    specifications.cropSuitability = formData.get("cropSuitability");
    specifications.applicationMethod = formData.get("applicationMethod");
    specifications.dosage = formData.get("dosage");
    specifications.packageSize = formData.get("packageSize");
  } else if (shop.shopType === "MACHINERY_RENTAL") {
    specifications.brand = formData.get("brand");
    specifications.model = formData.get("model");
    specifications.manufacturingYear = formData.get("manufacturingYear");
    specifications.engineHp = formData.get("engineHp");
    specifications.fuelType = formData.get("fuelType");
    specifications.capacity = formData.get("capacity");
    specifications.rentalHourlyRate = formData.get("rentalHourlyRate");
    specifications.rentalDailyRate = formData.get("rentalDailyRate");
    specifications.securityDeposit = formData.get("securityDeposit");
    specifications.operatorAvailable = formData.get("operatorAvailable") === "true";
    specifications.deliveryAvailable = formData.get("deliveryAvailable") === "true";
  } else if (shop.shopType === "MACHINERY_SALES") {
    specifications.brand = formData.get("brand");
    specifications.model = formData.get("model");
    specifications.variant = formData.get("variant");
    specifications.manufacturingYear = formData.get("manufacturingYear");
    specifications.engineHp = formData.get("engineHp");
    specifications.fuelType = formData.get("fuelType");
    specifications.capacity = formData.get("capacity");
    specifications.warranty = formData.get("warranty");
    specifications.deliveryAvailable = formData.get("deliveryAvailable") === "true";
    specifications.installationAvailable = formData.get("installationAvailable") === "true";
    specifications.financingAvailable = formData.get("financingAvailable") === "true";
  }

  const suitableCrops = formData.get("cropSuitability") as string | null;
  const dosage = formData.get("dosage") as string | null;
  const packageSize = formData.get("packageSize") as string | null;

  await prisma.product.update({
    where: { id: productId },
    data: {
      name,
      description,
      price,
      unit: unit || "unit",
      stock,
      isActive,
      categoryId,
      specifications,
      suitableCrops,
      dosage,
      packageSize,
    },
  });

  revalidatePath("/shop/products");
  revalidatePath(`/shop/products/${productId}`);
  redirect(`/shop/products/${productId}?success=true`);
}
