"use client";

import React from "react";
import { PlatformSettingsStatus } from "@/actions/admin/admin-settings-actions";
import { ShieldCheckIcon, ServerIcon, CreditCardIcon, CpuIcon, FolderIcon } from "lucide-react";

export function AdminSettingsClient({ status }: { status: PlatformSettingsStatus }) {

  return (
    <div className="space-y-6">
      
      {/* Information Alert */}
      <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-4 rounded-xl text-sm flex gap-3 shadow-sm">
        <ShieldCheckIcon className="w-5 h-5 text-indigo-600 shrink-0" />
        <div>
          <p className="font-bold mb-1">Strict Configuration Policy Active</p>
          <p>
            To maintain absolute platform security, all sensitive integrations (Database, Payment Gateways, AI, Storage) are rigidly bound to infrastructure Environment Variables. 
            No secrets, API keys, or connection strings are stored in the database or exposed through this control panel.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Infrastructure */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <ServerIcon className="w-5 h-5 text-gray-500" />
            <h3 className="font-bold text-gray-900">Core Infrastructure</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Environment Node</p>
                <p className="text-xs text-gray-500">Current deployment boundary</p>
              </div>
              <span className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-700 rounded uppercase tracking-wider">
                {status.environment}
              </span>
            </div>
            
            <div className="flex justify-between items-center pt-1">
              <div>
                <p className="text-sm font-semibold text-gray-900">Database Engine</p>
                <p className="text-xs text-gray-500">{status.database.provider}</p>
              </div>
              {status.database.status === "Healthy" ? (
                <span className="text-xs font-bold px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Healthy
                </span>
              ) : (
                <span className="text-xs font-bold px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Unavailable
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Payments & Financials */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <CreditCardIcon className="w-5 h-5 text-gray-500" />
            <h3 className="font-bold text-gray-900">Payment Gateway</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Active Provider</p>
                <p className="text-xs text-gray-500 capitalize">{status.payment.provider}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded ${status.payment.isConfigured ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {status.payment.isConfigured ? 'Configured' : 'Missing Keys'}
              </span>
            </div>
            
            <div className="flex justify-between items-center pt-1">
              <div>
                <p className="text-sm font-semibold text-gray-900">Transaction Environment</p>
                <p className="text-xs text-gray-500">Routing rule for monetary settlement</p>
              </div>
              <span className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-700 rounded uppercase tracking-wider">
                {status.payment.environment}
              </span>
            </div>
          </div>
        </div>

        {/* AI Processing */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <CpuIcon className="w-5 h-5 text-gray-500" />
            <h3 className="font-bold text-gray-900">AI Intelligence</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">LLM Provider</p>
                <p className="text-xs text-gray-500 capitalize">{status.ai.provider}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded ${status.ai.isConfigured ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {status.ai.isConfigured ? 'Configured' : 'Missing API Key'}
              </span>
            </div>
            
            <div className="flex justify-between items-center pt-1">
              <div>
                <p className="text-sm font-semibold text-gray-900">Inference Model</p>
                <p className="text-xs text-gray-500">Default reasoning engine</p>
              </div>
              <span className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-700 rounded tracking-wider">
                {status.ai.model}
              </span>
            </div>
          </div>
        </div>

        {/* Storage Architecture */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <FolderIcon className="w-5 h-5 text-gray-500" />
            <h3 className="font-bold text-gray-900">Storage Architecture</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-gray-900">Media Provider</p>
                <p className="text-xs text-gray-500">Asset and image hosting backend</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-700 rounded uppercase tracking-wider">
                  {status.storage.provider}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${status.storage.isConfigured ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {status.storage.isConfigured ? 'Healthy' : 'Unavailable'}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="text-center p-6 text-gray-400 text-sm mt-8 border-t border-gray-100">
        <p>No production-safe mutable database setting was available for mutation testing in the current architecture.</p>
        <p className="text-xs mt-1">Platform architecture defaults to immutable environment configurations for supreme runtime security.</p>
      </div>

    </div>
  );
}
