"use client";

import React, { useState } from "react";
import { signOut } from "next-auth/react";
import { LogoutIcon } from "@/components/ui/icons";
import Link from "next/link";

interface FarmerHeaderProps {
  farmerName?: string;
  farmerEmail?: string;
}

export function FarmerHeader({
  farmerName = "Farmer",
  farmerEmail = "",
}: FarmerHeaderProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({ callbackUrl: "/login", redirect: true });
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Profile Chip */}
      <Link
        href="/farmer/profile"
        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors group"
        title="View Farmer Profile"
      >
        <div className="w-8 h-8 rounded-full bg-green-100 text-green-800 font-bold text-xs flex items-center justify-center border border-green-200 shrink-0">
          {farmerName.charAt(0).toUpperCase()}
        </div>
        <div className="text-left hidden lg:block">
          <p className="text-xs font-semibold text-gray-900 group-hover:text-green-700 leading-tight">
            {farmerName}
          </p>
          <p className="text-[10px] text-gray-500 leading-tight truncate max-w-[130px]">
            {farmerEmail || "Verified Farmer"}
          </p>
        </div>
      </Link>

      <div className="h-5 w-px bg-gray-200" />

      {/* Header Sign Out Button */}
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 active:bg-red-200 border border-red-200/70 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
        aria-label="Sign Out"
        title="Sign out of SmartProcure"
      >
        <LogoutIcon className="w-3.5 h-3.5 text-red-500" />
        <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
      </button>
    </div>
  );
}
