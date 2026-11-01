import React from "react";
import { requireRole } from "@/lib/auth-utils";
import { getAdminOrderStats, getAdminOrders } from "@/actions/admin/admin-order-actions";
import { AdminOrdersClient } from "./admin-orders-client";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole("ADMIN");
  
  const qParams = await searchParams;

  const page = typeof qParams.page === "string" ? parseInt(qParams.page, 10) : 1;
  const search = typeof qParams.search === "string" ? qParams.search : undefined;
  const status = typeof qParams.status === "string" ? qParams.status : undefined;
  const paymentStatus = typeof qParams.paymentStatus === "string" ? qParams.paymentStatus : undefined;
  const deliveryStatus = typeof qParams.deliveryStatus === "string" ? qParams.deliveryStatus : undefined;
  const sortBy = typeof qParams.sortBy === "string" ? (qParams.sortBy as any) : "newest";

  const [statsRes, ordersRes] = await Promise.all([
    getAdminOrderStats(),
    getAdminOrders({ page, limit: 20, search, status, paymentStatus, deliveryStatus, sortBy }),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Order & Fulfillment Control Center</h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor marketplace orders, track fulfillment logistics, and manage delivery exceptions.
        </p>
      </div>

      <AdminOrdersClient 
        initialOrders={ordersRes.orders || []} 
        initialStats={statsRes.stats} 
        totalCount={ordersRes.totalCount || 0}
        pageCount={ordersRes.pageCount || 0}
        currentPage={page}
      />
    </div>
  );
}
