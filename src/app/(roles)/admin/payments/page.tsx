import React from "react";
import { getAdminPaymentsAction } from "@/actions/admin/admin-payment-actions";
import Link from "next/link";
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

export const metadata = {
  title: "Admin - Payment Management",
};

const formatCurrency = (val: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val);

export default async function AdminPaymentsPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string; provider?: string }>
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const search = params.search || "";
  const status = params.status || "";
  const provider = params.provider || "";

  const result = await getAdminPaymentsAction({
    page,
    search,
    status,
    provider
  });

  const { metrics, transactions, pagination } = result;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Transactions</h1>
          <p className="text-sm text-gray-500">Monitor and manage marketplace payment lifecycle</p>
        </div>
        <Link 
          href="/admin/payments/reconciliation" 
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
        >
          Reconciliation Engine
        </Link>
      </div>
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Net Collected</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(metrics.netCollectedAmount)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Volume</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(metrics.totalSuccessfulAmount)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Refunded</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(metrics.totalRefundedAmount)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Transactions</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-2xl font-bold text-gray-900">{metrics.totalTransactions.toLocaleString('en-IN')}</p>
            <p className="text-sm text-green-600 font-medium mb-1">({metrics.successfulPayments} Paid)</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center">
        <form className="flex-1 flex w-full max-w-md relative">
          <SearchIcon className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          <input 
            type="text" 
            name="search"
            defaultValue={search}
            placeholder="Search TXN ID, Order ID, User..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {status && <input type="hidden" name="status" value={status} />}
          {provider && <input type="hidden" name="provider" value={provider} />}
        </form>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
          <Link href="?" className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${!status ? 'bg-indigo-50 text-indigo-700 font-medium' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
            All
          </Link>
          <Link href="?status=PAID" className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${status === 'PAID' ? 'bg-green-50 text-green-700 font-medium' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
            Paid
          </Link>
          <Link href="?status=FAILED" className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${status === 'FAILED' ? 'bg-red-50 text-red-700 font-medium' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
            Failed
          </Link>
          <Link href="?status=REFUNDED" className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${status === 'REFUNDED' ? 'bg-blue-50 text-blue-700 font-medium' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
            Refunded
          </Link>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-4">Transaction / Date</th>
              <th className="px-4 py-4">User</th>
              <th className="px-4 py-4">Order / Provider</th>
              <th className="px-4 py-4">Amount</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-mono text-xs font-semibold text-gray-900">{tx.id}</div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(tx.createdAt).toLocaleString()}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{tx.user.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{tx.user.email}</div>
                  <div className="text-xs text-indigo-500 mt-0.5">{tx.user.role}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-mono text-xs text-gray-600 truncate max-w-[150px]">{tx.orderId || "N/A"}</div>
                  <div className="text-xs text-gray-400 mt-1">{tx.provider}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{formatCurrency(tx.amount)}</div>
                  {tx.refundAmount > 0 && (
                    <div className="text-xs text-red-500 mt-0.5 font-medium">-{formatCurrency(tx.refundAmount)}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    tx.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    tx.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                    (tx.status === 'REFUNDED' || tx.status === 'PARTIALLY_REFUNDED') ? 'bg-blue-100 text-blue-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {tx.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link 
                    href={`/admin/payments/${tx.id}`}
                    className="text-indigo-600 hover:text-indigo-900 font-medium text-sm"
                  >
                    Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
              <SearchIcon className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">No transactions found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing <span className="font-medium text-gray-900">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium text-gray-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium text-gray-900">{pagination.total}</span> entries
          </span>
          <div className="flex gap-2">
            {pagination.page > 1 && (
              <Link
                href={`?page=${pagination.page - 1}${search ? '&search='+search : ''}${status ? '&status='+status : ''}`}
                className="px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 flex items-center gap-1"
              >
                <ChevronLeftIcon className="w-4 h-4" /> Prev
              </Link>
            )}
            {pagination.page < pagination.totalPages && (
              <Link
                href={`?page=${pagination.page + 1}${search ? '&search='+search : ''}${status ? '&status='+status : ''}`}
                className="px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 flex items-center gap-1"
              >
                Next <ChevronRightIcon className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}