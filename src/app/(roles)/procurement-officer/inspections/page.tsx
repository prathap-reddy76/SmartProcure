import React from "react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { SessionUser } from "@/types/auth";

export default async function OfficerInspectionsPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
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

  const { date, status } = await searchParams;
  const filterDate = typeof date === 'string' ? new Date(date) : undefined;
  
  const whereClause: import("@prisma/client").Prisma.ProcurementQualityInspectionWhereInput = {
    booking: {
      centreId: officer.procurementCentreId
    }
  };

  if (filterDate) {
    const nextDay = new Date(filterDate);
    nextDay.setDate(nextDay.getDate() + 1);
    whereClause.inspectedAt = {
      gte: filterDate,
      lt: nextDay
    };
  }
  
  if (typeof status === 'string' && status) {
    whereClause.qualityStatus = status as import("@prisma/client").QualityStatus;
  }

  const inspections = await prisma.procurementQualityInspection.findMany({
    where: whereClause,
    include: {
      booking: {
        include: { farmer: true, crop: true, weighing: true }
      },
      officer: true
    },
    orderBy: { inspectedAt: 'desc' },
    take: 100
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-700" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12" />
            </svg>
            Inspection History
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View completed quality inspections for your centre.
          </p>
        </div>
      </div>

      {/* Filters */}
      <form className="flex gap-4 p-4 bg-white rounded-xl border shadow-2xs items-end">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Date</label>
          <input type="date" name="date" defaultValue={typeof date === 'string' ? date : ''} className="px-3 py-1.5 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
          <select name="status" defaultValue={typeof status === 'string' ? status : ''} className="px-3 py-1.5 border rounded-lg text-sm">
            <option value="">All Statuses</option>
            <option value="PASSED">Passed</option>
            <option value="PARTIALLY_ACCEPTED">Partially Accepted</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 text-sm h-[34px]">
          Filter
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase text-xs tracking-wider">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Token</th>
              <th className="px-4 py-3">Farmer</th>
              <th className="px-4 py-3">Crop</th>
              <th className="px-4 py-3 text-right">Net Wt</th>
              <th className="px-4 py-3 text-right">Accepted</th>
              <th className="px-4 py-3 text-right">Rejected</th>
              <th className="px-4 py-3">Grade</th>
              <th className="px-4 py-3">Moisture</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Inspector</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {inspections.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-gray-500">No inspections found.</td>
              </tr>
            ) : (
              inspections.map((insp) => (
                <tr key={insp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(insp.inspectedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-gray-900">{insp.booking.tokenNumber}</td>
                  <td className="px-4 py-3 text-gray-800">{insp.booking.farmer.name}</td>
                  <td className="px-4 py-3 text-gray-600">{insp.booking.crop.name}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-800">{insp.booking.weighing ? Number(insp.booking.weighing.netWeight) : 0} KG</td>
                  <td className="px-4 py-3 text-right font-mono text-green-700 font-bold">{Number(insp.acceptedQuantity)} KG</td>
                  <td className="px-4 py-3 text-right font-mono text-red-700 font-bold">{Number(insp.rejectedQuantity)} KG</td>
                  <td className="px-4 py-3 font-bold text-gray-800">{insp.grade}</td>
                  <td className="px-4 py-3 text-gray-600">{Number(insp.moisturePercentage)}%</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      insp.qualityStatus === 'PASSED' ? 'bg-indigo-100 text-indigo-800' :
                      insp.qualityStatus === 'PARTIALLY_ACCEPTED' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {insp.qualityStatus.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{insp.officer.name}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
