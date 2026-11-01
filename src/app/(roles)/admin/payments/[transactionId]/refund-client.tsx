"use client";

import React, { useState } from "react";
import { adminRefundPaymentAction } from "@/actions/admin/admin-refund-actions";
import { useRouter } from "next/navigation";

interface RefundPanelProps {
  transactionId: string;
  maxRefundable: number;
}

export function AdminRefundPanel({ transactionId, maxRefundable }: RefundPanelProps) {
  const [amount, setAmount] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  if (maxRefundable <= 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
        <p className="text-gray-500 font-medium">This transaction has been fully refunded or is not eligible for refund.</p>
      </div>
    );
  }

  const handleRefund = async () => {
    if (!amount || amount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (amount > maxRefundable) {
      setError(`Amount cannot exceed max refundable (₹${maxRefundable})`);
      return;
    }
    if (!reason.trim()) {
      setError("Please provide a reason for the refund.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      await adminRefundPaymentAction(transactionId, Number(amount), reason);
      alert("Refund processed successfully!");
      setAmount("");
      setReason("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to process refund");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
      <div className="bg-red-50/50 px-4 py-3 border-b border-red-100 flex items-center justify-between">
        <h3 className="font-semibold text-red-800">Process Refund</h3>
        <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">
          Max: ₹{maxRefundable}
        </span>
      </div>
      <div className="p-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount (₹)</label>
          <input 
            type="number" 
            min="1" 
            max={maxRefundable}
            value={amount}
            onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            placeholder={`Max: ${maxRefundable}`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
          <textarea 
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
            rows={2}
            placeholder="Reason for refund..."
          />
        </div>
        <div className="pt-2">
          <button 
            onClick={handleRefund}
            disabled={isLoading}
            className={`w-full py-2.5 rounded-lg text-white font-medium ${isLoading ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {isLoading ? "Processing..." : "Issue Refund"}
          </button>
        </div>
      </div>
    </div>
  );
}
