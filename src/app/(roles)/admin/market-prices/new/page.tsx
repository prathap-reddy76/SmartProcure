"use client";

import React, { useState } from "react";
import Link from "next/link";
import { adminCreateMarket } from "@/actions/admin/market-actions";

export default function AdminNewMarketPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      await adminCreateMarket(formData);
    } catch (err: any) {
      setError(err.message || "An error occurred during market creation");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Add Market
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Register a new physical or digital market for price tracking.
          </p>
        </div>
        <Link
          href="/admin/market-prices"
          className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          Cancel
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium rounded-r-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-1">
              <label htmlFor="name" className="block text-sm font-bold text-gray-900">Market Name *</label>
              <input type="text" id="name" name="name" required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>

            <div className="space-y-1">
              <label htmlFor="type" className="block text-sm font-bold text-gray-900">Market Type</label>
              <input type="text" id="type" name="type" placeholder="e.g. APMC, Mandi, Wholesale" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>
            
            <div className="space-y-1">
              <label htmlFor="district" className="block text-sm font-bold text-gray-900">District</label>
              <input type="text" id="district" name="district" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>

            <div className="space-y-1">
              <label htmlFor="state" className="block text-sm font-bold text-gray-900">State</label>
              <input type="text" id="state" name="state" defaultValue="Andhra Pradesh" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label htmlFor="address" className="block text-sm font-bold text-gray-900">Address / Location Details</label>
              <textarea id="address" name="address" rows={2} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"></textarea>
            </div>
            
            {/* Geo Coordinates */}
            <div className="md:col-span-2 border-t border-gray-100 mt-2 pt-4">
               <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Location Coordinates</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1">
                   <label htmlFor="latitude" className="block text-sm font-bold text-gray-900">Latitude</label>
                   <input type="number" step="any" min="-90" max="90" id="latitude" name="latitude" placeholder="e.g. 15.8281" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                 </div>
                 <div className="space-y-1">
                   <label htmlFor="longitude" className="block text-sm font-bold text-gray-900">Longitude</label>
                   <input type="number" step="any" min="-180" max="180" id="longitude" name="longitude" placeholder="e.g. 78.0373" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                 </div>
               </div>
            </div>
            
            <div className="md:col-span-2 flex items-center gap-3 pt-2 border-t border-gray-100 mt-2">
              <input type="checkbox" id="isActive" name="isActive" defaultChecked className="w-4 h-4 text-green-600 rounded focus:ring-green-500" />
              <label htmlFor="isActive" className="text-sm font-bold text-gray-900">Active Market</label>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Market"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
