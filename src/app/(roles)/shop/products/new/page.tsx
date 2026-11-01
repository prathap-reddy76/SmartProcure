import React from "react";
import { requireRole } from "@/lib/auth-utils";
import { SessionUser } from "@/types/auth";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/shop/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const session = await requireRole("SHOP_OWNER");
  const user = session.user as SessionUser;

  // 1. Authenticate user -> 2. Verify SHOP_OWNER -> 3. Resolve authorized shop
  const shop = await prisma.shop.findUnique({
    where: { userId: user.id },
  });

  if (!shop) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        No shop linked to your account.
      </div>
    );
  }

  // 11. CATEGORY HANDLING - Retrieve valid categories
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" }
  });

  // 4. Read shopType from database and pass it downward safely (No trusting client)
  return (
    <ProductForm shopType={shop.shopType} categories={categories} />
  );
}
