import React from "react";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminFinancialReportsPage() {
  await requireRole("ADMIN");

  // Fetch group by for simple aggregated reports (in a real app, this would use prisma groupBy or raw SQL)
  // Optimize group by using raw SQL to prevent massive memory footprints
  const cropStats: any[] = await prisma.$queryRaw`
    SELECT c."name" as "name", SUM(p."eligibleQuantityKg") as "quantity", SUM(p."netPayableAmount") as "value"
    FROM "ProcurementPayment" p
    JOIN "Crop" c ON p."cropId" = c.id
    GROUP BY c."name"
  `;

  const centreStats: any[] = await prisma.$queryRaw`
    SELECT cent."name" as "name", SUM(p."eligibleQuantityKg") as "quantity", SUM(p."netPayableAmount") as "value"
    FROM "ProcurementPayment" p
    JOIN "ProcurementCentre" cent ON p."centreId" = cent.id
    GROUP BY cent."name"
  `;

  // Map to format for UI
  const cropMap = new Map();
  cropStats.forEach((row: any) => {
    cropMap.set(row.name, { quantity: Number(row.quantity || 0), value: Number(row.value || 0) });
  });

  const centreMap = new Map();
  centreStats.forEach((row: any) => {
    centreMap.set(row.name, { quantity: Number(row.quantity || 0), value: Number(row.value || 0) });
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Financial Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Aggregated data across crops and centres.</p>
        </div>
        <Link href="/admin/finance" className="text-sm font-bold text-gray-500 hover:text-gray-900">
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-900">Crop-wise Summary</h2>
          </div>
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white border-b border-gray-100 text-gray-500 font-bold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-3">Crop</th>
                <th className="px-4 py-3 text-right">Procured (KG)</th>
                <th className="px-4 py-3 text-right">Value (,1)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {Array.from(cropMap.entries()).map(([name, data]) => (
                <tr key={name} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-900">{name}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-600">{data.quantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">{data.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
              {cropMap.size === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">No data available</td></tr>}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
