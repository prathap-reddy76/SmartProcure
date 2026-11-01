"use client";

import React, { useState } from "react";
import { runReconciliationAction } from "@/actions/admin/admin-reconciliation-actions";
import Link from "next/link";
import { RefreshCwIcon } from "lucide-react";

interface TxData {
  id: string;
  orderId: string | null;
  status: string;
  amount: number;
  providerPaymentId: string | null;
  createdAt: string;
}

export function ReconciliationClient({ initialTransactions }: { initialTransactions: TxData[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isReconciling, setIsReconciling] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const toggleAll = () => {
    if (selectedIds.size === initialTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(initialTransactions.map(t => t.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleReconcile = async () => {
    if (!selectedIds.size) return;
    try {
      setIsReconciling(true);
      const res = await runReconciliationAction(Array.from(selectedIds));
      setResults(res);
    } catch (err) {
      console.error(err);
      alert("Failed to reconcile");
    } finally {
      setIsReconciling(false);
    }
  };

  const getResultFor = (id: string) => results.find(r => r.id === id);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="font-semibold text-gray-800">Pending Reconciliation</h2>
          <p className="text-sm text-gray-500">{selectedIds.size} selected</p>
        </div>
        <button
          onClick={handleReconcile}
          disabled={isReconciling || selectedIds.size === 0}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
            isReconciling || selectedIds.size === 0 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          <RefreshCwIcon className={`w-4 h-4 ${isReconciling ? 'animate-spin' : ''}`} />
          Run Verification
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-center w-12">
                <input 
                  type="checkbox" 
                  checked={selectedIds.size > 0 && selectedIds.size === initialTransactions.length}
                  onChange={toggleAll}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              <th className="px-4 py-3">Transaction</th>
              <th className="px-4 py-3">Internal Status</th>
              <th className="px-4 py-3">Provider Status</th>
              <th className="px-4 py-3">Result</th>
              <th className="px-4 py-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initialTransactions.map((tx) => {
              const res = getResultFor(tx.id);
              return (
                <tr key={tx.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(tx.id)}
                      onChange={() => toggleOne(tx.id)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-gray-900">{tx.id}</div>
                    <div className="text-xs text-gray-500 mt-1 font-mono">{tx.providerPaymentId || "No Provider ID"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-700">
                      {tx.status} / ₹{tx.amount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {res ? (
                      res.providerStatus ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-700">
                          {res.providerStatus} / ₹{res.providerAmount}
                        </span>
                      ) : <span className="text-gray-400 italic">N/A</span>
                    ) : <span className="text-gray-400 italic">Pending check...</span>}
                  </td>
                  <td className="px-4 py-3">
                    {res ? (
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                        res.matchStatus === 'MATCHED' ? 'bg-green-100 text-green-800' :
                        res.matchStatus === 'MISSING_PROVIDER_ID' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {res.matchStatus}
                      </span>
                    ) : <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/payments/${tx.id}`} className="text-indigo-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
