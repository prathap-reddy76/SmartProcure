import React from "react";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Prisma } from "@prisma/client";

export default async function AdminFinanceDashboard() {
  await requireRole("ADMIN");

  // Aggregate sums and counts
  const paymentsAgg = await prisma.procurementPayment.groupBy({
    by: ['paymentStatus'],
    _sum: { netPayableAmount: true },
    _count: { _all: true }
  });

  const qualityStats = await prisma.procurementQualityInspection.aggregate({
    _sum: {
      acceptedQuantity: true,
      rejectedQuantity: true
    }
  });

  const totals = {
    procurementValue: 0,
    pendingValue: 0,
    processingValue: 0,
    paidValue: 0,
    failedValue: 0,
    cancelledValue: 0,
    todayValue: 0,
    thisMonthValue: 0,
    counts: {
      pending: 0,
      processing: 0,
      paid: 0,
      failed: 0,
      cancelled: 0
    }
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  paymentsAgg.forEach(p => {
    const val = Number(p._sum.netPayableAmount || 0);
    totals.procurementValue += val;
    if (p.paymentStatus === "PENDING") totals.pendingValue += val;
    if (p.paymentStatus === "PROCESSING") totals.processingValue += val;
    if (p.paymentStatus === "PAID") totals.paidValue += val;
  });

  const kpis = [
    { label: "Total Procurement Value", value: `₹${totals.procurementValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: "bg-emerald-50 text-emerald-900 border-emerald-200" },
    { label: "Pending Payments", value: totals.counts.pending, sub: `₹${totals.pendingValue.toLocaleString('en-IN')}`, color: "bg-amber-50 text-amber-900 border-amber-200" },
    { label: "Processing Payments", value: totals.counts.processing, sub: `₹${totals.processingValue.toLocaleString('en-IN')}`, color: "bg-blue-50 text-blue-900 border-blue-200" },
    { label: "Paid Payments", value: totals.counts.paid, sub: `₹${totals.paidValue.toLocaleString('en-IN')}`, color: "bg-green-50 text-green-900 border-green-200" },
    { label: "Failed Payments", value: totals.counts.failed, sub: `₹${totals.failedValue.toLocaleString('en-IN')}`, color: "bg-red-50 text-red-900 border-red-200" },
    { label: "Accepted Quantity", value: `${Number(qualityStats._sum.acceptedQuantity || 0).toLocaleString()} KG`, color: "bg-indigo-50 text-indigo-900 border-indigo-200" },
    { label: "Rejected Quantity", value: `${Number(qualityStats._sum.rejectedQuantity || 0).toLocaleString()} KG`, color: "bg-rose-50 text-rose-900 border-rose-200" },
    { label: "Today's Value", value: `₹${totals.todayValue.toLocaleString('en-IN')}`, color: "bg-white text-gray-900 border-gray-200" },
    { label: "This Month's Value", value: `₹${totals.thisMonthValue.toLocaleString('en-IN')}`, color: "bg-white text-gray-900 border-gray-200" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Finance Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time overview of procurement financials.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/finance/payments" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50">
            Payment Ledger
          </Link>
          <Link href="/admin/finance/reconciliation" className="px-4 py-2 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700">
            Reconciliation
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className={`p-6 rounded-2xl border ${kpi.color} shadow-xs flex flex-col justify-between`}>
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">{kpi.label}</h3>
            <p className="text-3xl font-black">{kpi.value}</p>
            {kpi.sub && <p className="text-sm font-bold opacity-80 mt-2">{kpi.sub}</p>}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
         <Link href="/admin/procurement-prices" className="block p-6 bg-white border border-gray-200 rounded-2xl hover:border-gray-300 transition shadow-xs group">
           <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600">Procurement Prices</h3>
           <p className="text-sm text-gray-500 mt-1">Manage active crop pricing across centres.</p>
         </Link>
         <Link href="/admin/finance/reports" className="block p-6 bg-white border border-gray-200 rounded-2xl hover:border-gray-300 transition shadow-xs group">
           <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600">Financial Reports</h3>
           <p className="text-sm text-gray-500 mt-1">Generate aggregated procurement value reports.</p>
         </Link>
      </div>
    </div>
  );
}
