import React from "react";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function AdminPaymentDetailsPage({
  params
}: {
  params: Promise<{ paymentId: string }>
}) {
  await requireRole("ADMIN");
  const { paymentId } = await params;

  const payment = await prisma.procurementPayment.findUnique({
    where: { id: paymentId },
    include: {
      farmer: { include: { farmerProfile: true } },
      crop: true,
      centre: true,
      booking: {
        include: {
          weighing: true,
          qualityInspection: true
        }
      },
      audits: {
        include: { user: true },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!payment) return notFound();

  // Reconciliation Check
  const calcGross = Number(payment.eligibleQuantityKg) * Number(payment.pricePerKg);
  const calcNet = calcGross - Number(payment.deductionAmount);
  
  const isGrossMatched = Math.abs(calcGross - Number(payment.grossAmount)) < 0.01;
  const isNetMatched = Math.abs(calcNet - Number(payment.netPayableAmount)) < 0.01;
  const isReconciled = isGrossMatched && isNetMatched;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payment Details</h1>
          <p className="text-sm text-gray-500 mt-1">Financial record ID: <span className="font-mono text-xs">{payment.id}</span></p>
        </div>
        <Link href="/admin/finance/payments" className="text-sm font-bold text-gray-500 hover:text-gray-900">
          &larr; Back to Ledger
        </Link>
      </div>

      {!isReconciled && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center gap-3">
          <svg className="w-6 h-6 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="font-bold text-sm">Reconciliation Issue Detected</h3>
            <p className="text-xs mt-1">The stored amounts do not mathematically align with the price x quantity formulas.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Financial Calculation Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs md:col-span-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 border-b pb-2">Financial Calculation</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div className="bg-gray-50 p-4 rounded-xl">
              <span className="block text-gray-500 text-xs font-bold uppercase mb-1">Eligible Qty</span>
              <span className="font-mono font-bold text-lg">{Number(payment.eligibleQuantityKg)} KG</span>
            </div>
            <div className="flex items-center justify-center text-gray-400 font-black text-xl hidden md:flex">×</div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <span className="block text-gray-500 text-xs font-bold uppercase mb-1">Price/KG</span>
              <span className="font-mono font-bold text-lg">₹{Number(payment.pricePerKg).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-center text-gray-400 font-black text-xl hidden md:flex">=</div>
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 col-span-2 md:col-span-4 flex justify-between items-center">
              <div>
                <span className="block text-indigo-700 text-xs font-bold uppercase mb-1">Gross Amount</span>
                <span className="font-mono font-black text-2xl text-indigo-900">₹{Number(payment.grossAmount).toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="block text-rose-600 text-xs font-bold uppercase mb-1">Deductions</span>
                <span className="font-mono font-black text-lg text-rose-700">- ₹{Number(payment.deductionAmount).toFixed(2)}</span>
              </div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 col-span-2 md:col-span-4 flex justify-between items-center">
              <span className="block text-emerald-800 text-sm font-black uppercase">Net Payable Amount</span>
              <span className="font-mono font-black text-3xl text-emerald-900">₹{Number(payment.netPayableAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* References */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4 text-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2 border-b pb-2">Status & References</h2>
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-500">Status</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
              payment.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
              payment.paymentStatus === 'PENDING' ? 'bg-amber-100 text-amber-800' :
              payment.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>{payment.paymentStatus}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-500">Payment Method</span>
            <span className="font-bold text-gray-900">{payment.paymentMethod?.replace("_", " ") || "-"}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-500">Transaction Ref</span>
            <span className="font-mono font-bold text-gray-900">{payment.transactionReference || "-"}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-500">Receipt No</span>
            <span className="font-mono font-bold text-gray-900">{payment.receiptNumber || "-"}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Paid At</span>
            <span className="text-gray-900 font-mono">{payment.paidAt ? new Date(payment.paidAt).toLocaleString('en-IN') : "-"}</span>
          </div>
        </div>

        {/* Audit Trail */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs text-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 border-b pb-2">Payment Audit Trail</h2>
          <div className="space-y-4">
            {payment.audits.map((audit) => (
              <div key={audit.id} className="relative pl-4 border-l-2 border-gray-200">
                <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-400"></div>
                <p className="text-xs text-gray-400 font-mono">{new Date(audit.createdAt).toLocaleString('en-IN')}</p>
                <p className="font-bold text-gray-900 mt-0.5">{audit.action.replace(/_/g, " ")}</p>
                <p className="text-xs text-gray-600 mt-0.5">By: {audit.user.name} ({audit.user.role})</p>
                {audit.notes && <p className="text-xs text-gray-500 mt-1 italic">&quot;{audit.notes}&quot;</p>}
                {audit.previousStatus && <p className="text-[10px] uppercase font-bold text-gray-400 mt-1">{audit.previousStatus} &rarr; {audit.newStatus}</p>}
              </div>
            ))}
            {payment.audits.length === 0 && (
              <p className="text-gray-500 italic text-center py-4">No audit records found.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
