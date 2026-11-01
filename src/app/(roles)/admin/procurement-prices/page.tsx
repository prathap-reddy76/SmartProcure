import React from "react";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import PriceForm from "./price-form";
import PriceStatusToggle from "./price-status-toggle";

export default async function AdminProcurementPricesPage() {
  await requireRole("ADMIN");

  const [prices, crops, centres] = await Promise.all([
    prisma.procurementPrice.findMany({
      include: { crop: true, centre: true },
      orderBy: [{ isActive: 'desc' }, { effectiveFrom: 'desc' }]
    }),
    prisma.crop.findMany({ where: { isActive: true } }),
    prisma.procurementCentre.findMany({ where: { isActive: true } })
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Procurement Prices</h1>
          <p className="text-sm text-gray-500 mt-1">Manage MSP and local procurement pricing configurations.</p>
        </div>
        <Link href="/admin/finance" className="text-sm font-bold text-gray-500 hover:text-gray-900">
          &larr; Back to Finance
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
            <h2 className="font-bold text-gray-900 mb-4">Create New Price</h2>
            <PriceForm crops={crops} centres={centres} />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Crop & Centre</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Effective Range</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {prices.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No prices configured.</td></tr>
                  ) : prices.map(price => (
                    <tr key={price.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900">{price.crop.name}</div>
                        <div className="text-xs text-gray-500">{price.centre.name}</div>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-gray-900">
                        ₹{Number(price.pricePerKg).toFixed(2)}/KG
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        <div>From: {new Date(price.effectiveFrom).toLocaleDateString()}</div>
                        {price.effectiveTo && <div>To: {new Date(price.effectiveTo).toLocaleDateString()}</div>}
                        {!price.effectiveTo && <div className="text-gray-400 italic">No end date</div>}
                      </td>
                      <td className="px-4 py-3">
                        <PriceStatusToggle priceId={price.id} isActive={price.isActive} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
