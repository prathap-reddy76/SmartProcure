"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createRentalBooking } from "@/actions/machinery/booking-actions";

interface MachineryData {
  id: string;
  name: string;
  brand: string | null;
  modelNumber?: string | null;
  location: string;
  address?: string | null;
  supportsHourly: boolean;
  pricePerHour?: number | null;
  supportsDaily: boolean;
  pricePerDay?: number | null;
  supportsPerAcre: boolean;
  pricePerAcre?: number | null;
  securityDeposit: number;
  deliveryCharge: number;
  isAvailable: boolean;
  isApproved: boolean;
  ownerName: string;
  category: {
    name: string;
  };
}

export function BookingFormClient({
  machinery,
  initialMode,
  initialDuration,
}: {
  machinery: MachineryData;
  initialMode?: string;
  initialDuration?: number;
}) {
  const router = useRouter();

  // Pick default available rental mode
  const resolvedMode: "HOURLY" | "DAILY" | "PER_ACRE" =
    initialMode === "HOURLY" && machinery.supportsHourly
      ? "HOURLY"
      : initialMode === "DAILY" && machinery.supportsDaily
      ? "DAILY"
      : initialMode === "PER_ACRE" && machinery.supportsPerAcre
      ? "PER_ACRE"
      : machinery.supportsDaily
      ? "DAILY"
      : machinery.supportsHourly
      ? "HOURLY"
      : "PER_ACRE";

  const [rentalMode, setRentalMode] = useState<"HOURLY" | "DAILY" | "PER_ACRE">(resolvedMode);

  // Set default start time (tomorrow 09:00 AM) and end time based on mode and initialDuration
  const defaultStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  }, []);

  const defaultEnd = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    const dur = initialDuration && initialDuration > 0 ? initialDuration : 1;
    if (resolvedMode === "HOURLY") {
      d.setHours(d.getHours() + dur);
    } else {
      d.setDate(d.getDate() + dur);
    }
    return d.toISOString().slice(0, 16);
  }, [resolvedMode, initialDuration]);

  const [startDateTime, setStartDateTime] = useState<string>(defaultStart);
  const [endDateTime, setEndDateTime] = useState<string>(defaultEnd);
  const [quantity, setQuantity] = useState<number>(initialDuration && initialDuration > 0 ? initialDuration : 1);
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live calculation breakdown
  const calculation = useMemo(() => {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    let units = 1;
    let rate = 0;
    let unitLabel = "Unit";

    if (rentalMode === "HOURLY") {
      rate = machinery.pricePerHour || 0;
      unitLabel = "Hours";
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
        const diffHrs = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        units = Math.max(1, Math.ceil(diffHrs));
      }
    } else if (rentalMode === "DAILY") {
      rate = machinery.pricePerDay || 0;
      unitLabel = "Days";
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
        const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        units = Math.max(1, Math.ceil(diffDays));
      }
    } else if (rentalMode === "PER_ACRE") {
      rate = machinery.pricePerAcre || 0;
      unitLabel = "Acres";
      units = Math.max(1, Number(quantity) || 1);
    }

    const baseAmount = rate * units;
    const delivery = machinery.deliveryCharge || 0;
    const deposit = machinery.securityDeposit || 0;
    const total = baseAmount + delivery + deposit;

    const isValidTime = !isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start;

    return {
      rate,
      units,
      unitLabel,
      baseAmount,
      delivery,
      deposit,
      total,
      isValidTime,
    };
  }, [rentalMode, startDateTime, endDateTime, quantity, machinery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!calculation.isValidTime) {
      setError("Return end time must be after start time");
      return;
    }

    setSubmitting(true);

    try {
      const res = await createRentalBooking({
        machineryId: machinery.id,
        rentalMode,
        startDateTime: new Date(startDateTime).toISOString(),
        endDateTime: new Date(endDateTime).toISOString(),
        quantity: rentalMode === "PER_ACRE" ? quantity : calculation.units,
        deliveryAddress: deliveryAddress.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error || "Failed to create booking");
        setSubmitting(false);
        return;
      }

      // Success -> navigate to bookings list or specific booking detail
      if (res.bookingId) {
        router.push(`/farmer/machinery/bookings/${res.bookingId}`);
      } else {
        router.push("/farmer/machinery/bookings");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while booking");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Booking Form Details */}
      <div className="lg:col-span-2 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
            <span className="font-semibold">Booking Error:</span> {error}
          </div>
        )}

        {/* Step 1: Select Rental Mode */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            1. Select Rental Pricing Mode
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {machinery.supportsHourly && (
              <label
                className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                  rentalMode === "HOURLY"
                    ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-900">Hourly</span>
                  <input
                    type="radio"
                    name="rentalMode"
                    value="HOURLY"
                    checked={rentalMode === "HOURLY"}
                    onChange={() => setRentalMode("HOURLY")}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <div className="text-lg font-bold text-emerald-700">
                  ₹{machinery.pricePerHour}
                  <span className="text-xs text-gray-500 font-normal">/hr</span>
                </div>
                <span className="text-xs text-gray-500 mt-1">Pay per hour of operation</span>
              </label>
            )}

            {machinery.supportsDaily && (
              <label
                className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                  rentalMode === "DAILY"
                    ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-900">Daily</span>
                  <input
                    type="radio"
                    name="rentalMode"
                    value="DAILY"
                    checked={rentalMode === "DAILY"}
                    onChange={() => setRentalMode("DAILY")}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <div className="text-lg font-bold text-emerald-700">
                  ₹{machinery.pricePerDay}
                  <span className="text-xs text-gray-500 font-normal">/day</span>
                </div>
                <span className="text-xs text-gray-500 mt-1">Best for full day farm work</span>
              </label>
            )}

            {machinery.supportsPerAcre && (
              <label
                className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                  rentalMode === "PER_ACRE"
                    ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-900">Per Acre</span>
                  <input
                    type="radio"
                    name="rentalMode"
                    value="PER_ACRE"
                    checked={rentalMode === "PER_ACRE"}
                    onChange={() => setRentalMode("PER_ACRE")}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <div className="text-lg font-bold text-emerald-700">
                  ₹{machinery.pricePerAcre}
                  <span className="text-xs text-gray-500 font-normal">/acre</span>
                </div>
                <span className="text-xs text-gray-500 mt-1">Calculated by land area</span>
              </label>
            )}
          </div>
        </div>

        {/* Step 2: Time Window and Quantity */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-semibold text-gray-900">
            2. Schedule & Duration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Return / End Date & Time
              </label>
              <input
                type="datetime-local"
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {rentalMode === "PER_ACRE" && (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Field Size (in Acres)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(0.5, parseFloat(e.target.value) || 1))}
                  className="w-32 px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-600">Acres of land to work</span>
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Delivery & Instructions */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-semibold text-gray-900">
            3. Delivery & Field Details
          </h2>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Delivery / Farm Location Address
            </label>
            <input
              type="text"
              placeholder="e.g. Survey No. 42, North Field, Village Rampur"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-500 mt-1">
              Where should the equipment be dropped off or delivered?
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Special Instructions / Notes for Owner (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Please bring extra rotary blades; access road is slightly narrow."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Summary & Price Breakdown Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs sticky top-24 space-y-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Booking Summary
            </span>
            <h3 className="text-lg font-bold text-gray-900 mt-0.5">{machinery.name}</h3>
            <p className="text-xs text-gray-500">
              {machinery.brand} • {machinery.category.name}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Provided by <span className="font-semibold">{machinery.ownerName}</span>
            </p>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3 text-sm">
            <div className="flex justify-between items-center text-gray-600">
              <span>
                Rental Rate ({calculation.units} {calculation.unitLabel} @ ₹{calculation.rate}/
                {rentalMode === "HOURLY" ? "hr" : rentalMode === "DAILY" ? "day" : "acre"})
              </span>
              <span className="font-medium text-gray-900">₹{calculation.baseAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-gray-600">
              <div>
                <span>Delivery Charge</span>
                <span className="block text-[10px] text-gray-400">Doorstep delivery</span>
              </div>
              <span className="font-medium text-gray-900">₹{calculation.delivery.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-gray-600">
              <div>
                <span>Security Deposit</span>
                <span className="block text-[10px] text-emerald-600">Refundable on return</span>
              </div>
              <span className="font-medium text-gray-900">₹{calculation.deposit.toFixed(2)}</span>
            </div>

            <div className="border-t border-gray-200 pt-3 flex justify-between items-baseline">
              <div>
                <span className="text-base font-bold text-gray-900">Total Payable</span>
                <span className="block text-[11px] text-gray-500">Payable on dispatch / delivery</span>
              </div>
              <span className="text-2xl font-extrabold text-emerald-700">
                ₹{calculation.total.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-800 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <span>🛡️</span> Overlap Prevention Guarantee
            </div>
            <p className="text-[11px] text-emerald-700">
              Your requested slot is automatically locked upon submission. Owner will review and confirm availability.
            </p>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={submitting || !calculation.isValidTime}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Reserving Slot...</span>
                </>
              ) : (
                <span>Request Rental Reservation</span>
              )}
            </button>

            <Link
              href={`/farmer/machinery/${machinery.id}`}
              className="block text-center py-2 text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              Cancel & Return to Details
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
