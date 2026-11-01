"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";

interface MachineryRentalCalculatorProps {
  machineryId: string;
  supportsHourly: boolean;
  pricePerHour: number | null;
  supportsDaily: boolean;
  pricePerDay: number | null;
  supportsPerAcre: boolean;
  pricePerAcre: number | null;
  securityDeposit: number;
  deliveryCharge: number;
  serviceRadiusKm?: number | null;
}

export function MachineryEquipmentRentalCalculator({
  machineryId,
  supportsHourly,
  pricePerHour,
  supportsDaily,
  pricePerDay,
  supportsPerAcre: _supportsPerAcre,
  pricePerAcre,
  securityDeposit,
  deliveryCharge,
  serviceRadiusKm,
}: MachineryRentalCalculatorProps) {
  // Determine initial rental mode
  const initialMode: "DAILY" | "HOURLY" | "PER_ACRE" =
    supportsDaily && (pricePerDay ?? 0) > 0
      ? "DAILY"
      : supportsHourly && (pricePerHour ?? 0) > 0
      ? "HOURLY"
      : "PER_ACRE";

  const [rentalMode, setRentalMode] = useState<"DAILY" | "HOURLY" | "PER_ACRE">(initialMode);
  const [duration, setDuration] = useState<number>(1);

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Calculation
  const calculation = useMemo(() => {
    let rate = 0;
    let unitLabel = "Day";
    let unitsLabel = "Days";

    if (rentalMode === "HOURLY") {
      rate = pricePerHour || 0;
      unitLabel = "Hour";
      unitsLabel = "Hours";
    } else if (rentalMode === "DAILY") {
      rate = pricePerDay || 0;
      unitLabel = "Day";
      unitsLabel = "Days";
    } else if (rentalMode === "PER_ACRE") {
      rate = pricePerAcre || 0;
      unitLabel = "Acre";
      unitsLabel = "Acres";
    }

    const validDuration = Math.max(1, duration);
    const rentalAmount = rate * validDuration;
    const deposit = securityDeposit || 0;
    const delivery = deliveryCharge || 0;
    const totalAmount = rentalAmount + deposit + delivery;

    return {
      rate,
      unitLabel,
      unitsLabel,
      validDuration,
      rentalAmount,
      deposit,
      delivery,
      totalAmount,
    };
  }, [rentalMode, duration, pricePerHour, pricePerDay, pricePerAcre, securityDeposit, deliveryCharge]);

  const handleDecrement = () => {
    setDuration((prev) => Math.max(1, prev - 1));
  };

  const handleIncrement = () => {
    setDuration((prev) => prev + 1);
  };

  return (
    <div className="space-y-5">
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-green-700">
          Rental Pricing Calculator
        </span>
        <h3 className="text-lg font-bold text-gray-900 mt-1">
          Select Rental Duration
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Choose Hourly or Daily operation for live pricing
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-2 gap-2">
        {supportsHourly && (pricePerHour ?? 0) > 0 && (
          <button
            type="button"
            onClick={() => setRentalMode("HOURLY")}
            className={`p-3 rounded-xl border text-left transition-all ${
              rentalMode === "HOURLY"
                ? "border-green-600 bg-green-50/70 ring-2 ring-green-600/20 shadow-xs"
                : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
            }`}
          >
            <span className="text-[11px] font-black uppercase tracking-wider block text-gray-500">
              Hourly Mode
            </span>
            <span className="text-base font-extrabold text-gray-900 block mt-0.5">
              {formatPrice(pricePerHour || 0)}
              <span className="text-xs font-normal text-gray-500">/hr</span>
            </span>
          </button>
        )}

        {supportsDaily && (pricePerDay ?? 0) > 0 && (
          <button
            type="button"
            onClick={() => setRentalMode("DAILY")}
            className={`p-3 rounded-xl border text-left transition-all ${
              rentalMode === "DAILY"
                ? "border-green-600 bg-green-50/70 ring-2 ring-green-600/20 shadow-xs"
                : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
            }`}
          >
            <span className="text-[11px] font-black uppercase tracking-wider block text-gray-500">
              Daily Mode
            </span>
            <span className="text-base font-extrabold text-gray-900 block mt-0.5">
              {formatPrice(pricePerDay || 0)}
              <span className="text-xs font-normal text-gray-500">/day</span>
            </span>
          </button>
        )}
      </div>

      {/* Duration Stepper */}
      <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-gray-700 block">
            Rental Duration:
          </span>
          <span className="text-[11px] text-gray-500">
            {rentalMode === "HOURLY" ? "Operation hours" : "24-hr shifts"}
          </span>
        </div>

        <div className="flex items-center border border-gray-300 rounded-lg bg-white shadow-2xs overflow-hidden h-9">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={duration <= 1}
            className="w-8 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent font-bold select-none text-base"
            aria-label="Decrease duration"
          >
            &minus;
          </button>
          <span className="px-3 text-center font-extrabold text-gray-900 text-xs select-none min-w-[70px]">
            {calculation.validDuration} {calculation.validDuration === 1 ? calculation.unitLabel : calculation.unitsLabel}
          </span>
          <button
            type="button"
            onClick={handleIncrement}
            className="w-8 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent font-bold select-none text-base"
            aria-label="Increase duration"
          >
            +
          </button>
        </div>
      </div>

      {/* Dynamic Price Breakdown Card */}
      <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-2.5 text-xs">
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
          <span className="font-extrabold text-emerald-900">
            {formatPrice(calculation.deposit)}
          </span>
        </div>

        {calculation.delivery > 0 ? (
          <div className="flex items-center justify-between text-gray-700">
            <span>Delivery / Transport Charge:</span>
            <span className="font-bold text-gray-900">{formatPrice(calculation.delivery)}</span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-gray-700">
            <span>Delivery:</span>
            <span className="font-bold text-emerald-700">Free / Pickup</span>
          </div>
        )}

        {serviceRadiusKm && (
          <div className="flex items-center justify-between text-gray-500 text-[11px] pt-1">
            <span>Operating Radius:</span>
            <span>Up to {serviceRadiusKm} km</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2.5 border-t border-emerald-200 text-sm font-black text-gray-900">
          <span>Total Amount Due:</span>
          <span className="text-base text-emerald-950">
            {formatPrice(calculation.totalAmount)}
          </span>
        </div>
      </div>

      {/* CTA Button linking to book page with pre-filled mode & duration */}
      <Link
        href={`/farmer/machinery/${machineryId}/book?mode=${rentalMode}&duration=${calculation.validDuration}`}
        className="w-full block text-center py-3.5 bg-green-700 hover:bg-green-800 text-white font-bold text-sm rounded-xl transition-colors shadow-sm"
      >
        Proceed to Book Rental &rarr;
      </Link>
    </div>
  );
}
