import React from "react";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { AdminRefundPanel } from "./refund-client";

export const metadata = {
  title: "Transaction Details | SmartProcure Admin",
};

const formatCurrency = (val: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val);

export default async function AdminTransactionDetailPage({
  params
}: {
  params: Promise<{ transactionId: string }>
}) {
  await requireRole(Role.ADMIN);
  const { transactionId } = await params;

  const transaction = await prisma.paymentTransaction.findUnique({
    where: { id: transactionId },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true, role: true }
      },
      order: true
    }
  });

  if (!transaction) return notFound();

  const txAmount = transaction.amount.toNumber();
  const txRefund = transaction.refundAmount ? transaction.refundAmount.toNumber() : 0;
  const maxRefundable = txAmount - txRefund;
  const isEligibleForRefund = (transaction.status === "PAID" || transaction.status === "PARTIALLY_REFUNDED") && maxRefundable > 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/payments" 
          className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaction Details</h1>
          <p className="text-sm text-gray-500 font-mono">{transaction.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Core Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="font-semibold text-gray-800">Financial Summary</h2>
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    transaction.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    transaction.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                    (transaction.status === 'REFUNDED' || transaction.status === 'PARTIALLY_REFUNDED') ? 'bg-blue-100 text-blue-800' :
                    'bg-amber-100 text-amber-800'
              }`}>
                {transaction.status}
              </span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-sm text-gray-500">Gross Amount</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(txAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Refunded</p>
                  <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(txRefund)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Net Captured</p>
                  <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(txAmount - txRefund)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Currency</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{transaction.currency}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Provider Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-semibold text-gray-800">Gateway Information</h2>
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Provider</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-semibold">{transaction.provider}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Method</dt>
                  <dd className="mt-1 text-sm text-gray-900">{transaction.paymentMethod}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Provider Payment ID</dt>
                  <dd className="mt-1 text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded border border-gray-100">{transaction.providerPaymentId || "N/A"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Provider Order ID</dt>
                  <dd className="mt-1 text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded border border-gray-100">{transaction.providerOrderId || "N/A"}</dd>
                </div>
                {transaction.refundId && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Provider Refund ID</dt>
                    <dd className="mt-1 text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded border border-gray-100">{transaction.refundId}</dd>
                  </div>
                )}
                <div className="sm:col-span-2 flex justify-between pt-2">
                  <div>
                    <dt className="text-xs text-gray-500">Created At</dt>
                    <dd className="text-sm text-gray-900">{transaction.createdAt.toLocaleString()}</dd>
                  </div>
                  <div className="text-right">
                    <dt className="text-xs text-gray-500">Paid At</dt>
                    <dd className="text-sm text-gray-900">{transaction.paidAt ? transaction.paidAt.toLocaleString() : "N/A"}</dd>
                  </div>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* User Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-semibold text-gray-800">Customer</h2>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900"><Link href={`/admin/users/${transaction.user.id}`} className="text-indigo-600 hover:underline">{transaction.user.name}</Link></p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="text-sm font-medium text-indigo-600">{transaction.user.role}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-sm text-gray-900">{transaction.user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-sm text-gray-900">{transaction.user.phone || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Linked Order */}
          {transaction.orderId && transaction.order && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="font-semibold text-gray-800">Linked Order</h2>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-medium text-gray-900 font-mono text-sm"><Link href={`/admin/orders/${transaction.order.id}`} className="text-indigo-600 hover:underline">{transaction.order.id}</Link></p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Status</p>
                  <p className="text-sm text-gray-900">{transaction.order.status}</p>
                </div>
              </div>
            </div>
          )}

          {/* Refund Action */}
          {isEligibleForRefund && (
            <AdminRefundPanel transactionId={transaction.id} maxRefundable={maxRefundable} />
          )}
        </div>
      </div>
    </div>
  );
}
