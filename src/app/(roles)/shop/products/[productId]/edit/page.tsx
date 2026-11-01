import React from "react";
import { requireRole } from "@/lib/auth-utils";
import { SessionUser } from "@/types/auth";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/shop/product-form";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditProductPage(props: {
  params: Promise<{ productId: string }>;
}) {
  const params = await props.params;
  const session = await requireRole("SHOP_OWNER");
  const user = session.user as SessionUser;

  const shop = await prisma.shop.findUnique({
    where: { userId: user.id },
  });

  if (!shop) {
    return <div className="p-8 text-center text-red-500 font-bold">No shop linked to your account.</div>;
  }

  // Authorize product strictly belongs to THIS shop
  const product = await prisma.product.findUnique({
    where: { id: params.productId, shopId: shop.id },
    include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } }
  });

  if (!product) {
    notFound();
  }

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" }
  });

  return (
    <ProductForm shopType={shop.shopType} categories={categories} initialData={{ ...product, price: Number(product.price), createdAt: product.createdAt.toISOString(), updatedAt: product.updatedAt.toISOString() }} />
  );
}
