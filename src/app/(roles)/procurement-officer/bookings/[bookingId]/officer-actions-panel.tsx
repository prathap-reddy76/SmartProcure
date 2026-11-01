"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { registerArrival } from "@/actions/procurement/queue-actions";
import { startWeighing, submitWeighing } from "@/actions/procurement/weighing-actions";
import { createProcurementPayment, processProcurementPayment } from "@/actions/procurement/payment-actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function OfficerActionsPanel({ bookingId, status, payment, qualityInspection, isUpcoming }: { bookingId: string, status: string, payment?: any, qualityInspection?: any, isUpcoming?: boolean }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [grossWeight, setGrossWeight] = useState<string>("");
  const [tareWeight, setTareWeight] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleRegisterArrival = async () => {
    setIsLoading(true);
    setError(null);
    const res = await registerArrival(bookingId);
    if (res.success) {
      router.refresh();
    } else {
      setError('error' in res ? res.error : "Failed to register arrival.");
    }
    setIsLoading(false);
  };

  const handleStartWeighing = async () => {
    setIsLoading(true);
    setError(null);
    const res = await startWeighing(bookingId);
    if (res.success) {
      router.refresh();
    } else {
      setError('error' in res ? res.error : "Failed to start weighing.");
    }
    setIsLoading(false);
  };

  const handleSubmitWeighing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const gross = parseFloat(grossWeight);
    const tare = parseFloat(tareWeight);

    const res = await submitWeighing(bookingId, gross, tare);
    if (res.success) {
      router.refresh();
    } else {
      setError('error' in res ? res.error : "Failed to submit weighing.");
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Operational Actions</h2>

      {isUpcoming ? (
        <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm font-bold text-blue-900">Scheduled for a future date</p>
          <p className="text-xs text-blue-800">Operational actions will become available when the booking reaches the active stage.</p>
        </div>
      ) : (
        <>
      
      {error && (
        <div className="p-3 mb-4 bg-red-50 text-red-800 text-sm font-bold rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {status === "BOOKED" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Farmer is scheduled but has not arrived.</p>
          <button
            onClick={handleRegisterArrival}
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors"
          >
            {isLoading ? "Processing..." : "Register Arrival"}
          </button>
        </div>
      )}

      {(status === "ARRIVED" || status === "WAITING") && (
        <div className="space-y-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm font-bold text-amber-800">Farmer is waiting in queue.</p>
          <p className="text-xs text-amber-700">Use the &apos;Call Next&apos; action from the queue dashboard to start processing.</p>
        </div>
      )}

      {status === "IN_PROGRESS" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Farmer has been called. Ready for weighing.</p>
          <button
            onClick={handleStartWeighing}
            disabled={isLoading}
            className="w-full py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl shadow-xs transition-colors"
          >
            {isLoading ? "Processing..." : "Start Weighing"}
          </button>
        </div>
      )}

      {status === "WEIGHING" && (
        <form onSubmit={handleSubmitWeighing} className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-2">
             <p className="text-sm font-bold text-blue-900">Weighing in Progress</p>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Gross Weight (KG)</label>
            <input
              type="number"
              step="0.01"
              value={grossWeight}
              onChange={(e) => setGrossWeight(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
              placeholder="e.g. 2500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Tare Weight (KG)</label>
            <input
              type="number"
              step="0.01"
              value={tareWeight}
              onChange={(e) => setTareWeight(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
              placeholder="e.g. 150"
            />
          </div>
          
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !grossWeight || !tareWeight}
              className="w-full py-3 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-colors"
            >
              {isLoading ? "Saving..." : "Submit Weighing"}
            </button>
          </div>
        </form>
      )}

      {status === "WEIGHING_COMPLETED" && (
        <div className="space-y-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <p className="text-sm font-bold text-emerald-800">Weighing Completed successfully.</p>
          <button
            onClick={async () => {
              setIsLoading(true); setError(null);
              const { startQualityInspection } = await import("@/actions/procurement/quality-actions");
              const res = await startQualityInspection(bookingId);
              if (res.success) router.refresh();
              else setError('error' in res && res.error ? String(res.error) : "Failed to start quality inspection.");
              setIsLoading(false);
            }}
            disabled={isLoading}
            className="w-full py-2.5 mt-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition-colors"
          >
            {isLoading ? "Starting..." : "Start Quality Inspection"}
          </button>
        </div>
      )}

      {status === "QUALITY_INSPECTION" && (
        <QualityInspectionForm bookingId={bookingId} />
      )}

      {(status === "CANCELLED" || status === "NO_SHOW" || status === "REJECTED") && (
        <div className="space-y-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-bold text-red-800">This booking is {status}.</p>
          <p className="text-xs text-red-700">No further operational actions are permitted.</p>
        </div>
      )}
      
      {(status === "ACCEPTED" || status === "PARTIALLY_ACCEPTED") && !payment && (
        <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm font-bold text-blue-900">Quality Approved</p>
          <p className="text-xs text-blue-800">Generate a procurement payment for {qualityInspection ? Number(qualityInspection.acceptedQuantity) : 0} KG.</p>
          <button
            onClick={async () => {
              setIsLoading(true);
              setError(null);
              const res = await createProcurementPayment(bookingId);
              if (res.success) router.refresh();
              else setError('error' in res && res.error ? String(res.error) : "Failed to create payment.");
              setIsLoading(false);
            }}
            disabled={isLoading}
            className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-sm"
          >
            {isLoading ? "Processing..." : "Generate Payment"}
          </button>
        </div>
      )}

      {payment && payment.paymentStatus === "PENDING" && (
        <div className="space-y-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm font-bold text-amber-900">Payment Pending</p>
          <p className="text-xs text-amber-800">Net Payable: ₹{Number(payment.netPayableAmount).toFixed(2)}</p>
          <button
            onClick={async () => {
              setIsLoading(true);
              setError(null);
              const res = await processProcurementPayment(payment.id, "BANK_TRANSFER");
              if (res.success) router.refresh();
              else setError('error' in res && res.error ? String(res.error) : "Failed to process payment.");
              setIsLoading(false);
            }}
            disabled={isLoading}
            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm"
          >
            {isLoading ? "Processing..." : "Mark as Paid (Bank Transfer)"}
          </button>
        </div>
      )}

      {(status === "COMPLETED" || (payment && payment.paymentStatus === "PAID")) && (
        <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm font-bold text-green-900">Procurement Processed: COMPLETED</p>
          <p className="text-xs text-green-800">Payment has been successfully processed.</p>
        </div>
      )}
      </>
      )}
    </div>
  );
}

function QualityInspectionForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [moisture, setMoisture] = useState<string>("");
  const [grade, setGrade] = useState<string>("");
  const [accepted, setAccepted] = useState<string>("");
  const [rejected, setRejected] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const m = parseFloat(moisture);
    const a = parseFloat(accepted);
    const r = parseFloat(rejected);

    const { completeQualityInspection } = await import("@/actions/procurement/quality-actions");
    const res = await completeQualityInspection(bookingId, m, grade, a, r, reason, notes);
    
    if (res.success) {
      router.refresh();
    } else {
      setError('error' in res && res.error ? String(res.error) : "Failed to complete quality inspection.");
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl mb-4 text-center">
         <p className="text-sm font-bold text-indigo-900 uppercase tracking-wider">Quality Inspection</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-800 text-sm font-bold rounded-xl border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Moisture (%)</label>
          <input
            type="number" step="0.01" value={moisture} onChange={e => setMoisture(e.target.value)}
            required min="0" max="100"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. 13.5"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Grade</label>
          <select 
            value={grade} onChange={e => setGrade(e.target.value)} required
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select...</option>
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Accepted (KG)</label>
          <input
            type="number" step="0.01" value={accepted} onChange={e => setAccepted(e.target.value)}
            required min="0"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Rejected (KG)</label>
          <input
            type="number" step="0.01" value={rejected} onChange={e => setRejected(e.target.value)}
            required min="0"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {Number(rejected) > 0 && (
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Rejection Reason</label>
          <select 
            value={reason} onChange={e => setReason(e.target.value)} required
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select reason...</option>
            <option value="Excess moisture">Excess moisture</option>
            <option value="Poor quality">Poor quality</option>
            <option value="Damaged crop">Damaged crop</option>
            <option value="Foreign matter">Foreign matter</option>
            <option value="Pest/insect damage">Pest/insect damage</option>
            <option value="Grade below procurement requirement">Grade below procurement requirement</option>
            <option value="Other">Other</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">Inspector Notes</label>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
        ></textarea>
      </div>

      <button
        type="submit"
        disabled={isLoading || !moisture || !grade || !accepted || !rejected}
        className="w-full py-3 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-colors"
      >
        {isLoading ? "Saving..." : "Complete Quality Inspection"}
      </button>
    </form>
  );
}
