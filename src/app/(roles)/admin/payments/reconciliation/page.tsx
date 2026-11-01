import React from "react";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { ReconciliationClient } from "./reconciliation-client";
import { serializeDecimal } from "@/lib/analytics/core";

export const metadata = {
  title: "Payment Reconciliation | SmartProcure Admin",
};

export default async function AdminReconciliationPage() {
  await requireRole(Role.ADMIN);

  // Fetch recent payments that might need reconciliation (e.g. PAID or REFUNDED or FAILED in last 7 days)
  const recentTransactions = await prisma.paymentTransaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const serialized = recentTransactions.map(t => ({
    id: t.id,
    orderId: t.orderId,
    status: t.status,
    amount: serializeDecimal(t.amount),
    providerPaymentId: t.providerPaymentId,
    createdAt: t.createdAt.toISOString()
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/payments" 
          className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Reconciliation Engine</h1>
          <p className="text-sm text-gray-500">Cross-verify internal database records against payment provider gateways.</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm">
        <strong>Important:</strong> Reconciliation triggers live API requests to payment providers. Please select specific transactions to verify rather than running blindly across the whole database to respect API rate limits.
      </div>

      <ReconciliationClient initialTransactions={serialized} />
    </div>
  );
}
