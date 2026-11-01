import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getAdminOrderDetail } from "@/actions/admin/admin-order-actions";
import { AdminOrderDetailClient } from "./admin-order-detail-client";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  await requireRole("ADMIN");
  const resolvedParams = await params;

  const [orderRes, partnersData] = await Promise.all([
    getAdminOrderDetail(resolvedParams.orderId),
    prisma.deliveryPartner.findMany({
      include: {
        user: { select: { name: true, phone: true, isActive: true } },
        assignments: {
          where: {
            status: { in: ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "IN_TRANSIT"] },
          },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const { order, error } = orderRes;

  if (error || !order) {
    notFound();
  }

  // Serialize Prisma Decimal and Date objects to plain JS values
  const serializeDecimal = (val: any) => (val ? Number(val) : 0);
  const serializeDate = (val: any) => (val ? new Date(val).toISOString() : null);

  const serializedOrder = {
    ...order,
    createdAt: serializeDate(order.createdAt),
    updatedAt: serializeDate(order.updatedAt),
    subtotal: serializeDecimal(order.subtotal),
    deliveryCharge: serializeDecimal(order.deliveryCharge),
    totalAmount: serializeDecimal(order.totalAmount),
    items: order.items.map((item: any) => ({
      ...item,
      createdAt: serializeDate(item.createdAt),
      updatedAt: serializeDate(item.updatedAt),
      productPrice: serializeDecimal(item.productPrice),
      lineTotal: serializeDecimal(item.lineTotal),
    })),
    paymentTransactions: order.paymentTransactions.map((tx: any) => ({
      ...tx,
      createdAt: serializeDate(tx.createdAt),
      updatedAt: serializeDate(tx.updatedAt),
      amount: serializeDecimal(tx.amount),
      refundAmount: tx.refundAmount ? serializeDecimal(tx.refundAmount) : null,
    })),
    deliveryAssignment: order.deliveryAssignment
      ? {
          ...order.deliveryAssignment,
          createdAt: serializeDate(order.deliveryAssignment.createdAt),
          updatedAt: serializeDate(order.deliveryAssignment.updatedAt),
          deliveryPartner: order.deliveryAssignment.deliveryPartner
            ? {
                ...order.deliveryAssignment.deliveryPartner,
                createdAt: serializeDate(order.deliveryAssignment.deliveryPartner.createdAt),
                updatedAt: serializeDate(order.deliveryAssignment.deliveryPartner.updatedAt),
                lastLocationUpdatedAt: serializeDate(
                  order.deliveryAssignment.deliveryPartner.lastLocationUpdatedAt
                ),
              }
            : null,
        }
      : null,
  };

  const serializedPartners = partnersData.map((p) => ({
    id: p.id,
    name: p.user.name || "Delivery Partner",
    phone: p.phone || p.user.phone || null,
    vehicleType: p.vehicleType,
    vehicleNumber: p.vehicleNumber,
    vehicleCapacity: p.vehicleCapacity,
    serviceArea: p.serviceArea || null,
    isAvailable: p.isAvailable,
    isActive: p.isActive,
    userIsActive: p.user.isActive,
    activeDeliveriesCount: p.assignments.length,
    maxActiveDeliveries: p.maxActiveDeliveries || 3,
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link href="/admin/orders" className="text-xs font-bold text-gray-500 hover:text-gray-900">
            &larr; Back to Orders
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            Order <span className="font-mono text-gray-500">#{order.orderNumber}</span>
          </h1>
        </div>
      </div>

      <AdminOrderDetailClient order={serializedOrder} partners={serializedPartners} />
    </div>
  );
}
