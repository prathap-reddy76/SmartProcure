import React from "react";
import { requireRole } from "@/lib/auth-utils";
import { getFarmerProcurementPayments } from "@/actions/procurement/payment-actions";
import Link from "next/link";

export default async function FarmerPaymentsPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const session = await requireRole("FARMER");
  if (!session?.user) return <div>Unauthorized</div>;

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  const { payments, pagination } = await getFarmerProcurementPayments(page, 25);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payment History</h1>
        <p className="text-sm text-gray-500 mt-1">Track all your procurement payments and receipts.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Ref / Receipt</th>
                <th className="px-4 py-3">Crop & Centre</th>
                <th className="px-4 py-3 text-right">Quantity (KG)</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500 text-sm">No payment history found.</td></tr>
              ) : payments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-4 text-xs font-medium text-gray-600">
                    {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-mono text-xs font-bold text-gray-900">{p.receiptNumber || "Pending"}</div>
                    <div className="text-[10px] text-gray-500">{p.bookingToken}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900 font-bold">{p.cropName}</div>
                    <div className="text-[10px] text-gray-500">{p.centreName}</div>
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-gray-600 text-xs">
                    {p.eligibleQuantityKg}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="font-mono font-bold text-gray-900">₹{p.netPayableAmount.toFixed(2)}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      p.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                      p.paymentStatus === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                      p.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {p.paymentStatus.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/farmer/procurement/payments/${p.id}`} className="text-xs font-bold text-green-700 hover:text-green-900 bg-green-50 px-3 py-1.5 rounded-lg">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500 bg-gray-50">
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex gap-2">
              {pagination.page > 1 && <Link href={`?page=${pagination.page-1}`} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 font-medium">Previous</Link>}
              {pagination.page < pagination.totalPages && <Link href={`?page=${pagination.page+1}`} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 font-medium">Next</Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
