import React from "react";
import { requireRole } from "@/lib/auth-utils";
import { getAdminProductStats, getAdminProducts } from "@/actions/admin/admin-product-actions";
import { AdminProductsClient } from "./admin-products-client";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole("ADMIN");

  const qParams = await searchParams;

  const page = typeof qParams.page === "string" ? parseInt(qParams.page, 10) : 1;
  const search = typeof qParams.search === "string" ? qParams.search : undefined;
  const productType = typeof qParams.productType === "string" ? qParams.productType : undefined;
  const categoryId = typeof qParams.categoryId === "string" ? qParams.categoryId : undefined;
  const shopId = typeof qParams.shopId === "string" ? qParams.shopId : undefined;
  const activeStatus = typeof qParams.activeStatus === "string" ? qParams.activeStatus : undefined;
  const stockStatus = typeof qParams.stockStatus === "string" ? qParams.stockStatus : undefined;
  const sortBy = typeof qParams.sortBy === "string" ? (qParams.sortBy as any) : "newest";

  const [statsRes, productsRes] = await Promise.all([
    getAdminProductStats(),
    getAdminProducts({ page, limit: 20, search, productType, categoryId, shopId, activeStatus, stockStatus, sortBy }),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Product & Inventory Catalog</h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor marketplace items, manage active inventory states, and review shop-owner configurations.
        </p>
      </div>

      <AdminProductsClient 
        initialProducts={productsRes.products || []}
        initialStats={statsRes.stats}
        totalCount={productsRes.totalCount || 0}
        pageCount={productsRes.pageCount || 0}
        currentPage={page}
      />
    </div>
  );
}
