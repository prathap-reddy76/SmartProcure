import React from "react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { SessionUser } from "@/types/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PrintReceiptButton } from "@/components/procurement/print-receipt-button";

export default async function PaymentReceiptPage({
  params
}: {
  params: Promise<{ paymentId: string }>
}) {
  const session = await requireRole("FARMER");
  const user = session.user as SessionUser;
  const { paymentId } = await params;

  const payment = await prisma.procurementPayment.findUnique({
    where: { id: paymentId, farmerId: user.id },
    include: {
      booking: {
        include: {
          qualityInspection: true,
          weighing: true
        }
      },
      centre: true,
      crop: true,
      farmer: { include: { farmerProfile: true } }
    }
  });

  if (!payment || payment.paymentStatus !== "PAID") return notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Digital Receipt</h1>
          <p className="text-sm text-gray-500 mt-1">Official smart procurement payment record</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/farmer/procurement/bookings/${payment.bookingId}`} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors">
            Back to Booking
          </Link>
          <PrintReceiptButton />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden print:shadow-none print:border-none">
        {/* Receipt Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-green-900 p-8 text-white relative">
          <div className="absolute top-8 right-8 text-white/20">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-3xl font-black tracking-tight mb-1">SMARTPROCURE</h2>
          <p className="text-green-100 font-medium tracking-widest uppercase text-sm mb-8">Official Procurement Receipt</p>
          
          <div className="grid grid-cols-2 gap-8 relative z-10">
            <div>
              <p className="text-green-300 text-xs font-bold uppercase mb-1">Receipt Number</p>
              <p className="font-mono text-xl font-bold">{payment.receiptNumber}</p>
            </div>
            <div>
              <p className="text-green-300 text-xs font-bold uppercase mb-1">Transaction Ref</p>
              <p className="font-mono text-xl font-bold">{payment.transactionReference}</p>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-gray-100">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Farmer Details</h3>
              <p className="font-bold text-gray-900 text-lg">{payment.farmer.name}</p>
              <p className="text-gray-600 text-sm mt-1">{payment.farmer.phone || "No phone recorded"}</p>
              {payment.farmer.farmerProfile?.village && <p className="text-gray-600 text-sm mt-1">{payment.farmer.farmerProfile.village}, {payment.farmer.farmerProfile.district}</p>}
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Procurement Centre</h3>
              <p className="font-bold text-gray-900 text-lg">{payment.centre.name}</p>
              <p className="text-gray-600 text-sm mt-1">Code: <span className="font-mono">{payment.centre.code}</span></p>
              <p className="text-gray-600 text-sm mt-1">{payment.centre.village || payment.centre.address}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-8 border-b border-gray-100">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Crop</p>
              <p className="font-bold text-gray-900">{payment.crop.name}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Token</p>
              <p className="font-mono font-bold text-gray-900">{payment.booking.tokenNumber}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Grade</p>
              <p className="font-bold text-gray-900">{payment.booking.qualityInspection?.grade || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Moisture</p>
              <p className="font-bold text-gray-900">{payment.booking.qualityInspection?.moisturePercentage ? Number(payment.booking.qualityInspection.moisturePercentage) : 0}%</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Quantity & Valuation</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center text-gray-600">
                <span>Net Weight Weighed</span>
                <span className="font-mono">{payment.booking.weighing ? Number(payment.booking.weighing.netWeight) : 0} KG</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Rejected Quantity</span>
                <span className="font-mono text-red-600">{payment.booking.qualityInspection ? Number(payment.booking.qualityInspection.rejectedQuantity) : 0} KG</span>
              </div>
              <div className="flex justify-between items-center font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Eligible Quantity</span>
                <span className="font-mono">{Number(payment.eligibleQuantityKg)} KG</span>
              </div>
              <div className="flex justify-between items-center text-gray-600 pt-2">
                <span>Procurement Price (per KG)</span>
                <span className="font-mono">₹{Number(payment.pricePerKg).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-gray-600 text-sm">
                <span>Gross Amount</span>
                <span className="font-mono font-bold">₹{Number(payment.grossAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600 text-sm">
                <span>Deductions</span>
                <span className="font-mono font-bold text-red-600">- ₹{Number(payment.deductionAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-900 text-xl md:text-2xl">
                <span className="font-black text-gray-900 uppercase">Net Paid</span>
                <span className="font-black font-mono text-emerald-700">₹{Number(payment.netPayableAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <div>
              <p>Payment Method: <strong className="text-gray-900">{payment.paymentMethod?.replace("_", " ")}</strong></p>
              <p>Paid On: <strong className="text-gray-900">{payment.paidAt ? new Date(payment.paidAt).toLocaleString('en-IN') : '-'}</strong></p>
            </div>
            <div className="text-right">
              <p>Generated by SmartProcure Agri-Tech Platform</p>
              <p>Valid as an official electronic receipt.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
