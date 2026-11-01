import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-utils";
import { getAdminProductDetail } from "@/actions/admin/admin-product-actions";
import { AdminProductDetailClient } from "./admin-product-detail-client";

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  await requireRole("ADMIN");
  const resolvedParams = await params;

  const { product, error } = await getAdminProductDetail(resolvedParams.productId);

  if (error || !product) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link href="/admin/products" className="text-xs font-bold text-gray-500 hover:text-gray-900">&larr; Back to Catalog</Link>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            Product Detail
          </h1>
        </div>
      </div>

      <AdminProductDetailClient product={product} />
    </div>
  );
}
