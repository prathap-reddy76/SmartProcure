import React from "react";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Prisma } from "@prisma/client";

export default async function AdminReconciliationPage() {
  await requireRole("ADMIN");

  // Push mathematical reconciliation down to the database engine using $queryRaw 
  // to avoid unbounded findMany and massive in-memory iteration.
  const flagged = await prisma.$queryRaw<any[]>`
    SELECT id, 
           "eligibleQuantityKg", 
           "pricePerKg", 
           "deductionAmount", 
           "grossAmount", 
           "netPayableAmount"
    FROM "ProcurementPayment"
    WHERE 
      ABS(("eligibleQuantityKg" * "pricePerKg") - "grossAmount") > 0.01
      OR 
      ABS((("eligibleQuantityKg" * "pricePerKg") - "deductionAmount") - "netPayableAmount") > 0.01
  `;

  // Also count total records to display scaling stats
  const totalCount = await prisma.procurementPayment.count();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payment Reconciliation</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time database-level detection of mathematical inconsistencies.</p>
        </div>
        <Link href="/admin/finance" className="text-sm font-bold text-gray-500 hover:text-gray-900">
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex flex-col justify-center items-center shadow-sm">
          <h3 className="text-emerald-800 font-bold uppercase tracking-wider text-xs">Total Records Reconciled</h3>
          <p className="text-4xl font-black text-emerald-900 mt-2">{totalCount}</p>
        </div>
        <div className={`border p-6 rounded-2xl flex flex-col justify-center items-center shadow-sm ${flagged.length > 0 ? 'bg-rose-50 border-rose-200' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className={`${flagged.length > 0 ? 'text-rose-800' : 'text-gray-500'} font-bold uppercase tracking-wider text-xs`}>Flagged Irregularities</h3>
          <p className={`text-4xl font-black mt-2 ${flagged.length > 0 ? 'text-rose-900' : 'text-gray-900'}`}>{flagged.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h2 className="font-bold text-gray-900">Detected Anomalies</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white border-b border-gray-100 text-gray-500 font-bold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-3">Payment ID</th>
                <th className="px-4 py-3">Expected Gross</th>
                <th className="px-4 py-3">Actual Gross</th>
                <th className="px-4 py-3">Expected Net</th>
                <th className="px-4 py-3">Actual Net</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {flagged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center bg-white">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4 shadow-sm">
                      <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </div>
                    <p className="text-gray-900 font-bold text-lg">All records mathematically reconciled!</p>
                    <p className="text-gray-500 text-sm mt-1">No calculation inconsistencies detected natively at the DB level.</p>
                  </td>
                </tr>
              ) : flagged.map(p => {
                const calcGross = Number(p.eligibleQuantityKg) * Number(p.pricePerKg);
                const calcNet = calcGross - Number(p.deductionAmount);
                return (
                  <tr key={p.id} className="hover:bg-red-50 bg-white">
                    <td className="px-4 py-3 font-mono font-bold text-gray-800">{p.id}</td>
                    <td className="px-4 py-3 font-mono text-gray-600">?{calcGross.toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono text-red-600 font-bold bg-red-100/50">?{Number(p.grossAmount).toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono text-gray-600">?{calcNet.toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono text-red-600 font-bold bg-red-100/50">?{Number(p.netPayableAmount).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/finance/payments/${p.id}`} className="text-indigo-600 font-bold hover:underline bg-indigo-50 px-2 py-1 rounded">
                        Investigate
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
