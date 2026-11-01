import { formatUTCDate } from "@/lib/date-utils";
import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-utils";
import { getBookingDetail } from "@/actions/procurement/booking-actions";
import { CancelBookingButton } from "./cancel-button";
import { QRCodeSVG } from "qrcode.react";
import { ProcurementRefreshListener } from "@/components/procurement-refresh-listener";

export default async function BookingDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  await requireRole("FARMER");
  const { bookingId } = await params;
  const { placed } = await searchParams;

  const booking = await getBookingDetail(bookingId);

  if (!booking) {
    notFound();
  }

  const isJustPlaced = placed === "true";
  const formattedDate = formatUTCDate(booking.slot.date, "EEEE, MMMM d, yyyy"); //
    
  

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-gray-500 flex items-center gap-1.5" aria-label="Breadcrumb">
        <Link href="/farmer/dashboard" className="hover:text-green-700">Dashboard</Link>
        <span>&rsaquo;</span>
        <Link href="/farmer/procurement" className="hover:text-green-700">Procurement</Link>
        <span>&rsaquo;</span>
        <Link href="/farmer/procurement/bookings" className="hover:text-green-700">Bookings</Link>
        <span>&rsaquo;</span>
        <span className="text-gray-800 font-bold">{booking.tokenNumber}</span>
      </nav>

      {isJustPlaced && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-green-200 text-green-800 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-sm">Booking Confirmed!</h2>
            <p className="text-xs mt-1">Your slot has been successfully booked. Please arrive at the centre on time.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
        {/* Token Header */}
        <div className="bg-green-700 p-6 text-white text-center relative">
          <p className="text-green-100 text-xs font-bold uppercase tracking-widest mb-2">Procurement Token</p>
          <h1 className="text-4xl font-mono font-bold tracking-tight">{booking.tokenNumber}</h1>
          <div className="absolute top-4 right-4">
             <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/20 text-white uppercase tracking-wider">
               {booking.status}
             </span>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 sm:p-8 space-y-8">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start justify-between">
            <div className="space-y-6 flex-1 w-full">
              <div>
                <h3 className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Centre Details</h3>
                <p className="text-base font-bold text-gray-900">{booking.centre.name}</p>
                <p className="text-sm text-gray-600">
                  {[booking.centre.address, booking.centre.village, booking.centre.district].filter(Boolean).join(", ")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Date</h3>
                  <p className="text-sm font-bold text-gray-900">{formattedDate}</p>
                </div>
                <div>
                  <h3 className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Time Slot</h3>
                  <p className="text-sm font-bold text-gray-900">{booking.slot.startTime} - {booking.slot.endTime}</p>
                </div>
                <div>
                  <h3 className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Crop</h3>
                  <p className="text-sm font-bold text-gray-900">{booking.crop.name}</p>
                </div>
                <div>
                  <h3 className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Quantity</h3>
                  <p className="text-sm font-bold text-gray-900">{Number(booking.expectedQuantity)} quintals</p>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="shrink-0 p-4 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col items-center">
              <QRCodeSVG value={booking.tokenNumber} size={140} level="M" />
              <p className="text-[10px] text-gray-400 font-mono mt-3">Scan at Centre</p>
            </div>
          </div>

          {booking.status === "WAITING" && booking.queuePosition && (
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center shadow-2xs">
              <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-2">Live Queue Status</h3>
              <div className="flex items-center justify-center gap-8">
                <div>
                  <p className="text-3xl font-black text-amber-600">{booking.queuePosition - 1}</p>
                  <p className="text-xs text-amber-700 font-bold uppercase mt-1">Farmers Ahead</p>
                </div>
                <div className="w-px h-12 bg-amber-200"></div>
                <div>
                  <p className="text-3xl font-black text-amber-600">#{booking.queuePosition}</p>
                  <p className="text-xs text-amber-700 font-bold uppercase mt-1">Your Position</p>
                </div>
              </div>
              <p className="text-[11px] text-amber-600/80 mt-4 italic">* Keep your token ready. You will be called soon.</p>
            </div>
          )}
          
          {/* Timeline & Weighing Section */}
          <div className="border-t border-gray-100 pt-8 mt-8">
            <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">Procurement Status</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Timeline */}
              <div className="space-y-5 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                {[
                  { label: "Booking Confirmed", time: booking.bookedAt, active: true, future: false },
                  { label: "Arrived", time: booking.arrivedAt, active: !!booking.arrivedAt, future: false },
                  { label: "Currently Being Served", time: booking.weighingStartedAt, active: !!booking.weighingStartedAt || booking.status === "IN_PROGRESS" || booking.status === "WEIGHING", future: false },
                  { label: "Weighing Completed", time: booking.weighingCompletedAt, active: !!booking.weighingCompletedAt, future: false },
                  { label: "Quality Inspection", time: booking.qualityCompletedAt, active: !!booking.qualityStartedAt || !!booking.qualityCompletedAt, future: !booking.qualityStartedAt && !booking.qualityCompletedAt },
                  { label: booking.status === "REJECTED" ? "Crop Rejected" : (booking.status === "PARTIALLY_ACCEPTED" ? "Partially Accepted" : (booking.status === "ACCEPTED" ? "Procurement Accepted" : "Accepted / Rejected")), time: booking.qualityCompletedAt, active: !!booking.qualityCompletedAt, future: !booking.qualityCompletedAt },
                  { 
                    label: booking.payment?.paymentStatus === "PAID" ? "Payment Completed" : "Payment Pending", 
                    time: booking.payment?.paidAt || booking.payment?.createdAt, 
                    active: !!booking.payment, 
                    future: !booking.payment 
                  },
                ].map((step, idx) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow flex-shrink-0 ${step.active ? "border-green-600" : "border-gray-300"}`}>
                      {step.active && !step.future && <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>}
                    </div>
                    <div className={`w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] px-4 py-2 rounded-xl border shadow-2xs ${step.active ? (step.future ? "border-gray-200 bg-gray-50 opacity-60" : "border-green-200 bg-green-50/50") : "border-gray-100 bg-white opacity-60"}`}>
                      <h4 className={`text-xs font-bold ${step.active && !step.future ? (step.label.includes("Reject") ? "text-red-700" : "text-green-900") : "text-gray-500"}`}>{step.label}</h4>
                      {step.time && <p className="text-[10px] text-gray-500 mt-0.5">{new Date(step.time).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}</p>}
                      {step.future && <p className="text-[10px] text-gray-400 mt-0.5 italic">{idx === 7 ? "Pending in next phase" : "Pending"}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Weighing Result */}
              <div>
                {booking.weighing ? (
                  <div className="bg-emerald-50 rounded-2xl border border-emerald-200 shadow-2xs p-6 h-full flex flex-col justify-center">
                    <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider mb-6 text-center">Weighing Completed</h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-emerald-100 pb-3">
                        <span className="text-emerald-700 text-sm font-medium">Gross Weight</span>
                        <span className="text-emerald-900 font-mono font-bold">{Number(booking.weighing.grossWeight)} KG</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-emerald-100 pb-3">
                        <span className="text-emerald-700 text-sm font-medium">Tare Weight</span>
                        <span className="text-emerald-900 font-mono font-bold">- {Number(booking.weighing.tareWeight)} KG</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-emerald-800 text-base font-black">NET WEIGHT</span>
                        <div className="text-right">
                          <span className="block text-emerald-900 font-mono font-black text-2xl">{Number(booking.weighing.netWeight)} KG</span>
                          <span className="block text-emerald-600 text-xs font-bold mt-1">{(Number(booking.weighing.netWeight) / 100).toFixed(2)} QUINTALS</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 h-full flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                      <span className="text-gray-400 font-black text-xl">?</span>
                    </div>
                    <p className="text-sm font-bold text-gray-700">Weighing Not Started</p>
                    <p className="text-xs text-gray-500 mt-1">Weight results will appear here once processed by the officer.</p>
                  </div>
                )}
              </div>

              {/* Quality Result */}
              {booking.qualityInspection && (
                <div className={`rounded-2xl border shadow-2xs p-6 h-full flex flex-col justify-center md:col-span-2 ${booking.qualityInspection.qualityStatus === 'PASSED' ? 'bg-indigo-50 border-indigo-200' : booking.qualityInspection.qualityStatus === 'PARTIALLY_ACCEPTED' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                  <h3 className={`text-sm font-bold uppercase tracking-wider mb-6 text-center ${booking.qualityInspection.qualityStatus === 'PASSED' ? 'text-indigo-900' : booking.qualityInspection.qualityStatus === 'PARTIALLY_ACCEPTED' ? 'text-amber-900' : 'text-red-900'}`}>Quality Inspection Result</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <span className="block text-xs font-bold text-gray-500 uppercase">Status</span>
                      <span className={`block text-lg font-black mt-1 ${booking.qualityInspection.qualityStatus === 'PASSED' ? 'text-indigo-700' : booking.qualityInspection.qualityStatus === 'PARTIALLY_ACCEPTED' ? 'text-amber-700' : 'text-red-700'}`}>{booking.qualityInspection.qualityStatus.replace('_', ' ')}</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-xs font-bold text-gray-500 uppercase">Grade</span>
                      <span className="block text-lg font-black mt-1 text-gray-900">{booking.qualityInspection.grade}</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-xs font-bold text-gray-500 uppercase">Moisture</span>
                      <span className="block text-lg font-black mt-1 text-gray-900">{Number(booking.qualityInspection.moisturePercentage)}%</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-xs font-bold text-gray-500 uppercase">Net Weight</span>
                      <span className="block text-lg font-black mt-1 text-gray-900">{booking.weighing ? Number(booking.weighing.netWeight) : 0} KG</span>
                    </div>
                  </div>

                  <div className="bg-white/60 rounded-xl p-4 border border-black/5">
                    <div className="flex justify-between items-center border-b border-black/5 pb-2 mb-2">
                      <span className="text-gray-600 text-sm font-medium">Accepted Quantity</span>
                      <span className="text-green-700 font-mono font-bold text-lg">{Number(booking.qualityInspection.acceptedQuantity)} KG</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm font-medium">Rejected Quantity</span>
                      <span className="text-red-700 font-mono font-bold text-lg">{Number(booking.qualityInspection.rejectedQuantity)} KG</span>
                    </div>
                  </div>

                  {booking.qualityInspection.rejectionReason && (
                    <div className="mt-4 p-3 bg-red-100/50 rounded-xl border border-red-200">
                      <span className="block text-xs font-bold text-red-800 uppercase mb-1">Rejection Reason</span>
                      <span className="block text-sm text-red-900">{booking.qualityInspection.rejectionReason}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Result */}
              {booking.payment && (
                <div className={`rounded-2xl border shadow-2xs p-6 h-full flex flex-col justify-center mt-6 md:mt-0 md:col-span-2 ${booking.payment.paymentStatus === 'PAID' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                  <h3 className={`text-sm font-bold uppercase tracking-wider mb-6 text-center ${booking.payment.paymentStatus === 'PAID' ? 'text-green-900' : 'text-blue-900'}`}>Payment Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/60 p-4 rounded-xl text-center border border-black/5">
                      <span className="block text-xs font-bold text-gray-500 uppercase">Rate per KG</span>
                      <span className="block text-xl font-black mt-1 text-gray-900">₹{Number(booking.payment.pricePerKg).toFixed(2)}</span>
                    </div>
                    <div className="bg-white/60 p-4 rounded-xl text-center border border-black/5">
                      <span className="block text-xs font-bold text-gray-500 uppercase">Net Payable</span>
                      <span className={`block text-xl font-black mt-1 ${booking.payment.paymentStatus === 'PAID' ? 'text-green-700' : 'text-gray-900'}`}>₹{Number(booking.payment.netPayableAmount).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-black/5 mb-4">
                    <span className="text-sm font-bold text-gray-700">Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${booking.payment.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{booking.payment.paymentStatus}</span>
                  </div>

                  {booking.payment.paymentStatus === 'PAID' && booking.payment.transactionReference && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Transaction Ref: <span className="font-mono text-gray-900">{booking.payment.transactionReference}</span></p>
                      <Link href={`/farmer/procurement/payments/${booking.payment.id}`} className="inline-block mt-2 px-6 py-2 bg-green-700 text-white font-bold rounded-xl text-sm shadow-xs hover:bg-green-800 transition-colors">
                        View Digital Receipt
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="bg-gray-50 p-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/farmer/procurement/bookings"
            className="text-xs font-bold text-gray-600 hover:text-gray-900"
          >
            &larr; Back to Bookings
          </Link>
          
          {booking.status === "BOOKED" && (
            <CancelBookingButton bookingId={booking.id} />
          )}
        </div>
      </div>
    </div>
  );
}
