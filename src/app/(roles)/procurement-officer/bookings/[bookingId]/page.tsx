import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatUTCDate, getTodayAsUTCDate } from "@/lib/date-utils";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { OfficerActionsPanel } from "./officer-actions-panel";

import { SessionUser } from "@/types/auth";

export default async function OfficerBookingDetailPage({
  params
}: {
  params: Promise<{ bookingId: string }>
}) {
  const session = await requireRole("PROCUREMENT_OFFICER");
  const user = session.user as SessionUser;
  const { bookingId } = await params;

  const officer = await prisma.user.findUnique({
    where: { id: user.id },
    select: { procurementCentreId: true }
  });
  

  if (!officer?.procurementCentreId) notFound();

  const booking = await prisma.procurementBooking.findUnique({
    where: { id: bookingId },
    include: {
      farmer: { include: { farmerProfile: true } },
      crop: true,
      slot: true,
      weighing: true,
      centre: true,
      qualityInspection: true,
      payment: true,
    }
  });
  

  if (!booking || booking.centreId !== officer.procurementCentreId) {
    notFound();
  }

  const formattedDate = formatUTCDate(booking.slot.date, "EEEE, MMMM d, yyyy");
    
  

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <nav className="text-xs text-gray-500 flex items-center gap-1.5 mb-2">
        <Link href="/procurement-officer/dashboard" className="hover:text-green-700">Dashboard</Link>
        <span>&rsaquo;</span>
        <Link href="/procurement-officer/queue" className="hover:text-green-700">Queue</Link>
        <span>&rsaquo;</span>
        <span className="text-gray-800 font-bold">{booking.tokenNumber}</span>
      </nav>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            Token: <span className="font-mono text-green-700 bg-green-50 px-3 py-1 rounded-lg border border-green-200">{booking.tokenNumber}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Booking #{booking.bookingNumber}</p>
        </div>
        <div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${
            booking.status === "COMPLETED" || booking.status === "WEIGHING_COMPLETED" ? "bg-emerald-100 text-emerald-800"
            : booking.status === "CANCELLED" || booking.status === "NO_SHOW" ? "bg-red-100 text-red-800"
            : booking.status === "WEIGHING" || booking.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800"
            : "bg-amber-100 text-amber-800"
          }`}>
            {booking.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Farmer Details */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Farmer Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-bold text-gray-900">{booking.farmer.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-bold text-gray-900">{booking.farmer.phone || "N/A"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">Location</p>
                <p className="font-bold text-gray-900">
                  {[booking.farmer.farmerProfile?.village, booking.farmer.farmerProfile?.district].filter(Boolean).join(", ") || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Booking Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Crop</p>
                <p className="font-bold text-gray-900">{booking.crop.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Expected Qty</p>
                <p className="font-bold text-gray-900">{Number(booking.expectedQuantity)} Quintals</p>
              </div>
              <div>
                <p className="text-gray-500">Slot Date</p>
                <p className="font-bold text-gray-900">{formattedDate}</p>
              </div>
              <div>
                <p className="text-gray-500">Time Window</p>
                <p className="font-bold text-gray-900">{booking.slot.startTime} - {booking.slot.endTime}</p>
              </div>
            </div>
          </div>

          {/* Weighing Details */}
          {booking.weighing && (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 shadow-2xs p-6">
              <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-4 border-b border-emerald-100 pb-2">Weighing Result</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-emerald-700">Gross Weight</p>
                  <p className="text-xl font-bold text-emerald-900">{Number(booking.weighing.grossWeight)} KG</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-700">Tare Weight</p>
                  <p className="text-xl font-bold text-emerald-900">{Number(booking.weighing.tareWeight)} KG</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-700">Net Weight</p>
                  <p className="text-2xl font-black text-emerald-900">{Number(booking.weighing.netWeight)} KG</p>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1">{(Number(booking.weighing.netWeight) / 100).toFixed(2)} Quintals</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <OfficerActionsPanel 
            bookingId={booking.id} 
            status={booking.status} 
            isUpcoming={new Date(booking.slot.date).getTime() > getTodayAsUTCDate().getTime()}
            payment={
              booking.payment
                ? {
                    ...booking.payment,
                    eligibleQuantityKg: Number(booking.payment.eligibleQuantityKg),
                    pricePerKg: Number(booking.payment.pricePerKg),
                    grossAmount: Number(booking.payment.grossAmount),
                    deductionAmount: Number(booking.payment.deductionAmount),
                    netPayableAmount: Number(booking.payment.netPayableAmount),
                    paidAt: booking.payment.paidAt ? booking.payment.paidAt.toISOString() : null,
                    createdAt: booking.payment.createdAt?.toISOString(),
                    updatedAt: booking.payment.updatedAt?.toISOString(),
                  }
                : null
            } 
            qualityInspection={
              booking.qualityInspection
                ? {
                    ...booking.qualityInspection,
                    moisturePercentage: Number(booking.qualityInspection.moisturePercentage),
                    acceptedQuantity: Number(booking.qualityInspection.acceptedQuantity),
                    rejectedQuantity: Number(booking.qualityInspection.rejectedQuantity),
                    inspectedAt: booking.qualityInspection.inspectedAt.toISOString(),
                    createdAt: booking.qualityInspection.createdAt?.toISOString(),
                    updatedAt: booking.qualityInspection.updatedAt?.toISOString(),
                  }
                : null
            } 
          />
          
          {/* Timestamps */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Audit Timeline</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Booked</span>
                <span className="font-mono text-gray-900">{new Date(booking.bookedAt).toLocaleString()}</span>
              </div>
              {booking.arrivedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Arrived</span>
                  <span className="font-mono text-gray-900">{new Date(booking.arrivedAt).toLocaleString()}</span>
                </div>
              )}
              {booking.weighingStartedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Weighing Started</span>
                  <span className="font-mono text-gray-900">{new Date(booking.weighingStartedAt).toLocaleString()}</span>
                </div>
              )}
              {booking.weighingCompletedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Weighing Completed</span>
                  <span className="font-mono text-gray-900">{new Date(booking.weighingCompletedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
