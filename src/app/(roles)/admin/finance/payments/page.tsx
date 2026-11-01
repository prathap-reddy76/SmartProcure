import React from "react";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Prisma, PaymentStatus } from "@prisma/client";

export default async function AdminPaymentLedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; farmer?: string; receipt?: string; page?: string }>;
}) {
  await requireRole("ADMIN");
  
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 25;
  const skip = (page - 1) * limit;
  
  const whereClause: Prisma.ProcurementPaymentWhereInput = {};
  
  if (params.status && params.status !== "ALL") {
    whereClause.paymentStatus = params.status as PaymentStatus;
  }
  if (params.receipt) {
    whereClause.OR = [
      { receiptNumber: { contains: params.receipt, mode: "insensitive" } },
      { transactionReference: { contains: params.receipt, mode: "insensitive" } },
      { booking: { tokenNumber: { contains: params.receipt, mode: "insensitive" } } }
    ];
  }
  if (params.farmer) {
    whereClause.farmer = { name: { contains: params.farmer, mode: "insensitive" } };
  }

  const [payments, total] = await Promise.all([
    prisma.procurementPayment.findMany({
      where: whereClause,
      include: {
        farmer: true,
        crop: true,
        centre: true,
        booking: true
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    }),
    prisma.procurementPayment.count({ where: whereClause })
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payment Ledger</h1>
          <p className="text-sm text-gray-500 mt-1">Global audit of all procurement financial transactions.</p>
        </div>
        <Link href="/admin/finance" className="text-sm font-bold text-gray-500 hover:text-gray-900">
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <form className="p-4 border-b border-gray-100 flex flex-wrap gap-4 items-end bg-gray-50">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-gray-600 mb-1">Status</label>
            <select name="status" defaultValue={params.status || "ALL"} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-600 outline-none">
              <option value="ALL">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="PAID">PAID</option>
              <option value="FAILED">FAILED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-gray-600 mb-1">Search Ref / Receipt</label>
            <input type="text" name="receipt" defaultValue={params.receipt || ""} placeholder="RCP-0000..." className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-600 outline-none" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-gray-600 mb-1">Farmer Name</label>
            <input type="text" name="farmer" defaultValue={params.farmer || ""} placeholder="Search farmer..." className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-600 outline-none" />
          </div>
          <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg text-sm hover:bg-indigo-700 h-[38px]">
            Filter
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white border-b border-gray-100 text-gray-500 font-bold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-3">Receipt / Ref</th>
                <th className="px-4 py-3">Farmer</th>
                <th className="px-4 py-3">Centre & Crop</th>
                <th className="px-4 py-3 text-right">Eligible (KG)</th>
                <th className="px-4 py-3 text-right">Net Payable</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No payments found matching criteria.</td></tr>
              ) : payments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-mono font-bold text-gray-900">{p.receiptNumber || "N/A"}</div>
                    <div className="text-[10px] text-gray-500">{p.transactionReference || "No TX Ref"}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-800">{p.farmer.name}</td>
                  <td className="px-4 py-3">
                    <div className="text-gray-900 font-medium">{p.centre.name}</div>
                    <div className="text-gray-500 text-xs">{p.crop.name}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-600">{Number(p.eligibleQuantityKg)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">₹{Number(p.netPayableAmount).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      p.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                      p.paymentStatus === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                      p.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {p.paymentStatus.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/finance/payments/${p.id}`} className="text-indigo-600 hover:text-indigo-900 font-bold text-xs">
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500 bg-gray-50">
            <span>Page {page} of {totalPages} ({total} records)</span>
            <div className="flex gap-2">
              {page > 1 && <Link href={`?page=${page-1}`} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50">Prev</Link>}
              {page < totalPages && <Link href={`?page=${page+1}`} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50">Next</Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
