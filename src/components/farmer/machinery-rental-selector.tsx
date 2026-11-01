"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/actions/cart/cart-actions";
import { CartIcon } from "@/components/ui/icons";

interface MachineryRentalSelectorProps {
  productId: string;
  supportsHourly: boolean;
  hourlyRate: number | null;
  supportsDaily: boolean;
  dailyRate: number | null;
  securityDeposit: number;
}

export function MachineryRentalSelector({
  productId,
  supportsHourly,
  hourlyRate,
  supportsDaily,
  dailyRate,
  securityDeposit,
}: MachineryRentalSelectorProps) {
  const router = useRouter();

  // Pick default available rental mode
  const initialMode: "DAILY" | "HOURLY" =
    supportsDaily && (dailyRate ?? 0) > 0
      ? "DAILY"
      : supportsHourly && (hourlyRate ?? 0) > 0
      ? "HOURLY"
      : "DAILY";

  const [rentalMode, setRentalMode] = useState<"DAILY" | "HOURLY">(initialMode);
  const [duration, setDuration] = useState<number>(1);
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const calculation = useMemo(() => {
    const rate = rentalMode === "HOURLY" ? (hourlyRate || 0) : (dailyRate || 0);
    const validDuration = Math.max(1, duration);
    const rentalAmount = rate * validDuration;
    const deposit = securityDeposit || 0;
    const totalAmount = rentalAmount + deposit;
    const unitLabel = rentalMode === "HOURLY" ? "Hour" : "Day";
    const unitsLabel = rentalMode === "HOURLY" ? "Hours" : "Days";

    return {
      rate,
      validDuration,
      rentalAmount,
      deposit,
      totalAmount,
      unitLabel,
      unitsLabel,
    };
  }, [rentalMode, duration, hourlyRate, dailyRate, securityDeposit]);

  const handleDecrement = () => {
    setDuration((prev) => Math.max(1, prev - 1));
  };

  const handleIncrement = () => {
    setDuration((prev) => prev + 1);
  };

  const handleAddToCart = async () => {
    if (isPending) return;
    setIsPending(true);
    setFeedback(null);

    const res = await addToCart(productId, calculation.validDuration, rentalMode);
    setIsPending(false);

    if (res.error) {
      setFeedback({ type: "error", text: res.error });
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback({
        type: "success",
        text: `Machinery rental (${calculation.validDuration} ${calculation.validDuration === 1 ? calculation.unitLabel : calculation.unitsLabel}) added to cart!`,
      });
      router.refresh();
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Mode Selector Tabs */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
          Select Rental Mode:
        </label>
        <div className="grid grid-cols-2 gap-2">
          {supportsHourly && (hourlyRate ?? 0) > 0 && (
            <button
              type="button"
              onClick={() => setRentalMode("HOURLY")}
              className={`p-3 rounded-xl border text-left transition-all ${
                rentalMode === "HOURLY"
                  ? "border-green-600 bg-green-50/80 ring-2 ring-green-600/20 shadow-xs"
                  : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-wider block text-gray-500">
                ⏱️ Hourly Rental
              </span>
              <span className="text-base font-black text-gray-900 block mt-0.5">
                {formatPrice(hourlyRate || 0)}
                <span className="text-xs font-normal text-gray-500">/hr</span>
              </span>
            </button>
          )}

          {supportsDaily && (dailyRate ?? 0) > 0 && (
            <button
              type="button"
              onClick={() => setRentalMode("DAILY")}
              className={`p-3 rounded-xl border text-left transition-all ${
                rentalMode === "DAILY"
                  ? "border-green-600 bg-green-50/80 ring-2 ring-green-600/20 shadow-xs"
                  : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-wider block text-gray-500">
                📅 Daily Rental
              </span>
              <span className="text-base font-black text-gray-900 block mt-0.5">
                {formatPrice(dailyRate || 0)}
                <span className="text-xs font-normal text-gray-500">/day</span>
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Duration Stepper */}
      <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-gray-800 block">
            Rental Duration:
          </span>
          <span className="text-[11px] text-gray-500">
            {rentalMode === "HOURLY" ? "Number of hours required" : "Full 24-hour shifts"}
          </span>
        </div>

        <div className="flex items-center border border-gray-300 rounded-lg bg-white shadow-2xs overflow-hidden h-10">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={duration <= 1 || isPending}
            className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent font-bold select-none text-lg"
            aria-label="Decrease duration"
          >
            &minus;
          </button>
          <span className="px-3 text-center font-black text-gray-900 text-sm select-none min-w-[70px]">
            {calculation.validDuration} {calculation.validDuration === 1 ? calculation.unitLabel : calculation.unitsLabel}
          </span>
          <button
            type="button"
            onClick={handleIncrement}
            disabled={isPending}
            className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent font-bold select-none text-lg"
            aria-label="Increase duration"
          >
            +
          </button>
        </div>
      </div>

      {/* Price Breakdown with Separated Security Deposit */}
      <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200/90 space-y-2 text-xs">
        <div className="flex items-center justify-between text-gray-700">
          <span>
            Rental Fee ({calculation.validDuration} {calculation.validDuration === 1 ? calculation.unitLabel : calculation.unitsLabel} × {formatPrice(calculation.rate)}):
          </span>
          <span className="font-bold text-gray-900">
            {formatPrice(calculation.rentalAmount)}
          </span>
        </div>

        <div className="flex items-center justify-between text-emerald-800">
          <span className="flex items-center gap-1.5 font-medium">
            <span>🛡️ Refundable Security Deposit:</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">100% Refundable</span>
          </span>
          <span className="font-black text-emerald-900">
            {formatPrice(calculation.deposit)}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-emerald-200 text-sm font-black text-gray-900">
          <span>Total Amount Due:</span>
          <span className="text-base text-emerald-950">
            {formatPrice(calculation.totalAmount)}
          </span>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-bold border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Add To Cart CTA Button */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isPending}
        className="w-full py-3.5 px-6 rounded-xl font-bold bg-green-700 hover:bg-green-800 text-white shadow-sm flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50"
      >
        <CartIcon className="w-5 h-5" />
        <span>
          {isPending ? "Adding Rental to Cart..." : `Add Rental to Cart • ${formatPrice(calculation.totalAmount)}`}
        </span>
      </button>
    </div>
  );
}
