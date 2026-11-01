"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createProcurementPrice } from "@/actions/admin/price-actions";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function PriceForm({ crops, centres }: { crops: { id: string, name: string }[], centres: { id: string, name: string }[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Synchronously capture form element before any asynchronous calls
    const formElement = e.currentTarget;
    const formData = new FormData(formElement);
    const effectiveTo = formData.get("effectiveTo") as string;
    const pricePerKgRaw = formData.get("pricePerKg") as string;
    const effectiveFromRaw = formData.get("effectiveFrom") as string;
    const cropId = formData.get("cropId") as string;
    const centreId = formData.get("centreId") as string;

    if (!cropId || !centreId) {
      setError("Please select both a crop and a procurement centre.");
      setIsLoading(false);
      return;
    }

    const pricePerKg = parseFloat(pricePerKgRaw);
    if (isNaN(pricePerKg) || pricePerKg <= 0) {
      setError("Price per KG must be a valid number greater than 0.");
      setIsLoading(false);
      return;
    }

    if (!effectiveFromRaw) {
      setError("Please specify the Effective From date.");
      setIsLoading(false);
      return;
    }

    const effectiveFrom = new Date(effectiveFromRaw);
    const effectiveToDate = effectiveTo ? new Date(effectiveTo) : null;

    if (effectiveToDate && effectiveFrom > effectiveToDate) {
      setError("Effective From date cannot be after Effective To date.");
      setIsLoading(false);
      return;
    }

    const data = {
      cropId,
      centreId,
      pricePerKg,
      effectiveFrom,
      effectiveTo: effectiveToDate,
      isActive: formData.get("isActive") === "true",
    };

    try {
      const res = await createProcurementPrice(data);
      if (res.success) {
        if (formElement) {
          formElement.reset();
        } else if (formRef.current) {
          formRef.current.reset();
        }
        setSuccess("Procurement price created successfully!");
        router.refresh();
      } else {
        setError("error" in res && res.error ? String(res.error) : "Failed to create price");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred while creating the price.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 text-sm">
      {error && (
        <div className="p-3 bg-red-50 text-red-800 rounded-xl text-xs font-medium border border-red-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 text-green-800 rounded-xl text-xs font-medium border border-green-200 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}
      
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">Crop</label>
        <select name="cropId" required className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-600 outline-none">
          <option value="">Select Crop...</option>
          {crops.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">Centre</label>
        <select name="centreId" required className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-600 outline-none">
          <option value="">Select Centre...</option>
          {centres.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">Price per KG (₹)</label>
        <input type="number" step="0.01" min="0.01" name="pricePerKg" required placeholder="e.g., 25.50" className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-600 outline-none" />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">Effective From</label>
        <input type="date" name="effectiveFrom" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-600 outline-none" />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">Effective To (Optional)</label>
        <input type="date" name="effectiveTo" className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-600 outline-none" />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
        <select name="isActive" className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-600 outline-none">
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <button type="submit" disabled={isLoading} className="w-full py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition">
        {isLoading ? "Saving..." : "Save Configuration"}
      </button>
    </form>
  );
}
