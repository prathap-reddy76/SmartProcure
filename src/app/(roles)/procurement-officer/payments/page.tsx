import React from "react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { SessionUser } from "@/types/auth";
import Link from "next/link";

export default async function OfficerPaymentsPage() {
  const session = await requireRole("PROCUREMENT_OFFICER");
  const user = session.user as SessionUser;

  const officer = await prisma.user.findUnique({
    where: { id: user.id },
    select: { procurementCentreId: true }
  });

  if (!officer?.procurementCentreId) {
    return (
      <div className="bg-red-50 text-red-800 p-6 rounded-2xl border border-red-200">
        No procurement centre assigned.
      </div>
    );
  }

  const payments = await prisma.procurementPayment.findMany({
    where: { centreId: officer.procurementCentreId },
    include: {
      booking: true,
      farmer: true,
      crop: true
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <svg className="w-6 h-6 text-green-700" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 8.25H9m6 3H9m3 6-3-3h1.5a3 3 0 1 0 0-6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Procurement Payments
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and process procurement payments for your centre.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase text-xs tracking-wider">
            <tr>
              <th className="px-4 py-3">Token</th>
              <th className="px-4 py-3">Farmer</th>
              <th className="px-4 py-3">Crop</th>
              <th className="px-4 py-3 text-right">Eligible Wt</th>
              <th className="px-4 py-3 text-right">Price/KG</th>
              <th className="px-4 py-3 text-right">Net Payable</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">No payments found.</td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-gray-900">{p.booking.tokenNumber}</td>
                  <td className="px-4 py-3 text-gray-800">{p.farmer.name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.crop.name}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-800">{Number(p.eligibleQuantityKg)} KG</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-600">₹{Number(p.pricePerKg).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono text-green-700 font-bold">₹{Number(p.netPayableAmount).toFixed(2)}</td>
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
                    <Link href={`/procurement-officer/bookings/${p.bookingId}`} className="text-indigo-600 hover:text-indigo-900 font-bold text-xs">
                      View Booking
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
