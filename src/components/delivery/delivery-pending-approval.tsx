"use client";

import React from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TruckIcon, LogoutIcon } from "@/components/ui/icons";

export function DeliveryPendingApproval({
  partnerName,
  partnerEmail,
  isSuspended = false,
}: {
  partnerName: string;
  partnerEmail: string;
  isSuspended?: boolean;
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white border border-gray-200 rounded-3xl shadow-xl max-w-lg w-full p-8 text-center space-y-6">
        {/* Status Icon */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-md ${
            isSuspended
              ? "bg-red-100 text-red-600 shadow-red-500/10"
              : "bg-amber-100 text-amber-700 shadow-amber-500/10"
          }`}
        >
          {isSuspended ? (
            <span className="text-2xl font-black">✕</span>
          ) : (
            <TruckIcon className="w-8 h-8 text-amber-600" />
          )}
        </div>

        {/* Header */}
        <div className="space-y-2">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
              isSuspended
                ? "bg-red-50 text-red-800 border-red-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSuspended ? "bg-red-500" : "bg-amber-500 animate-pulse"
              }`}
            />
            {isSuspended ? "Account Disabled / Suspended" : "Pending Administrative Approval"}
          </div>

          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {isSuspended ? "Access Restricted" : "Approval Under Review"}
          </h1>

          <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
            {isSuspended
              ? `Hello ${partnerName}, your delivery partner account (${partnerEmail}) has been deactivated or suspended by dispatch. Please reach out to administrative support.`
              : `Hello ${partnerName}, your delivery partner account (${partnerEmail}) has been registered and is currently pending review by the SmartProcure logistics administrator.`}
          </p>
        </div>

        {/* Details Box */}
        <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 text-left text-xs space-y-2">
          <div className="flex justify-between py-1 border-b border-gray-200/60">
            <span className="text-gray-500">Partner Account:</span>
            <span className="font-semibold text-gray-900">{partnerName}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-200/60">
            <span className="text-gray-500">Registered Email:</span>
            <span className="font-mono text-gray-900">{partnerEmail}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-200/60">
            <span className="text-gray-500">Authorized Role:</span>
            <span className="font-bold text-blue-700">DELIVERY_PARTNER</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Operational Dispatch:</span>
            <span className={`font-bold ${isSuspended ? "text-red-600" : "text-amber-600"}`}>
              {isSuspended ? "Disabled" : "Awaiting Approval"}
            </span>
          </div>
        </div>

        {/* Notice Info */}
        <div className="text-xs text-gray-500 bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-left">
          <strong className="text-blue-900 block font-semibold mb-0.5">ℹ️ Security & Verification Policy</strong>
          <span>
            Operational delivery assignments, customer addresses, and order dispatch tools remain locked until an administrator verifies partner eligibility and activates the profile.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => router.refresh()}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Check Approval Status
          </button>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/delivery/login" })}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <LogoutIcon className="w-4 h-4 text-gray-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
