"use client";

import React from "react";
import { signOut } from "next-auth/react";

export function AdminSignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-xs font-bold text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
    >
      Sign Out
    </button>
  );
}
