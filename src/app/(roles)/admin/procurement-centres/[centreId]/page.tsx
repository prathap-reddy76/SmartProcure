import { getTodayAsUTCDate } from "@/lib/date-utils";
import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { ProcurementIcon } from "@/components/ui/icons";
import { AdminCentreDetailClient } from "./centre-detail-client";

export default async function AdminCentreDetailPage({
  params
}: {
  params: Promise<{ centreId: string }>
}) {
  await requireRole("ADMIN");
  const { centreId } = await params;

  const centre = await prisma.procurementCentre.findUnique({
    where: { id: centreId },
    include: {
      supportedCrops: {
        include: { crop: true },
        orderBy: { crop: { name: 'asc' } }
      },
      officers: {
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' }
      }
    }
  });

  if (!centre) notFound();

  // Metrics for today
  const today = getTodayAsUTCDate();
  //
  
  const statsRaw = await prisma.procurementBooking.groupBy({
    by: ['status'],
    where: {
      centreId,
      slot: { date: today }
    },
    _count: { id: true }
  });

  let totalBookings = 0;
  let waiting = 0;
  let inProgress = 0;
  let completed = 0;

  statsRaw.forEach(s => {
    totalBookings += s._count.id;
    if (s.status === "WAITING") waiting += s._count.id;
    if (s.status === "IN_PROGRESS" || s.status === "WEIGHING" || s.status === "QUALITY_INSPECTION") inProgress += s._count.id;
    if (s.status === "COMPLETED" || s.status === "ACCEPTED") completed += s._count.id;
  });

  // Capacity planning: Slots from today onwards
  const availableOfficers = await prisma.user.findMany({ where: { role: "PROCUREMENT_OFFICER", isActive: true }, select: { id: true, name: true, email: true } });
  const allCrops = await prisma.crop.findMany({ where: { isActive: true }, select: { id: true, name: true } });
  const prices = await prisma.procurementPrice.findMany({ where: { centreId, isActive: true }, include: { crop: true }, orderBy: { effectiveFrom: 'desc' } });

  const slots = await prisma.procurementSlot.findMany({
    where: {
      centreId,
      date: { gte: today }
    },
    orderBy: [
      { date: 'asc' },
      { startTime: 'asc' }
    ]
  });

  const serializedSlots = slots.map(s => ({
    ...s,
    date: s.date.toISOString(),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-gray-500 flex items-center gap-1.5" aria-label="Breadcrumb">
        <Link href="/admin/finance" className="hover:text-indigo-700">Admin</Link>
        <span>&rsaquo;</span>
        <Link href="/admin/procurement-centres" className="hover:text-indigo-700">Procurement Centres</Link>
        <span>&rsaquo;</span>
        <span className="text-gray-800 font-bold">{centre.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <ProcurementIcon className="w-6 h-6 text-indigo-700" />
            <span>{centre.name} ({centre.code})</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${centre.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>
              {centre.isActive ? "Active" : "Inactive"}
            </span>
            <span>{centre.address}, {centre.village}, {centre.district}</span>
          </p>
        </div>
      </div>

      <AdminCentreDetailClient 
        availableOfficers={availableOfficers}
        allCrops={allCrops}
        prices={prices.map(p => ({...p, pricePerKg: Number(p.pricePerKg), effectiveFrom: p.effectiveFrom.toISOString()}))}
        centreId={centreId} 
        supportedCrops={centre.supportedCrops}
        slots={serializedSlots}
        officers={centre.officers}
        stats={{ totalBookings, waiting, inProgress, completed }}
        coords={{ lat: centre.latitude, lng: centre.longitude }}
      />
    </div>
  );
}
