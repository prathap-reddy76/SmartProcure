"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { bookProcurementSlotSchema, BookProcurementSlotValues, ProcurementCropConfig, ProcurementSlotData } from "@/types/procurement";
import { getAvailableSlots } from "@/actions/procurement/centre-actions";
import { bookProcurementSlot } from "@/actions/procurement/booking-actions";

export function BookingForm({ centreId, crops }: { centreId: string, crops: ProcurementCropConfig[] }) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [slots, setSlots] = useState<ProcurementSlotData[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BookProcurementSlotValues>({
    resolver: zodResolver(bookProcurementSlotSchema),
    defaultValues: {
      centreId,
      cropId: crops.length > 0 ? crops[0].cropId : "",
      expectedQuantity: undefined,
      slotId: "",
    }
  });

  const selectedCropId = watch("cropId");
  const selectedSlotId = watch("slotId");
  const selectedCropConfig = crops.find(c => c.cropId === selectedCropId);

  useEffect(() => {
    async function fetchSlots() {
      if (!selectedDate) return;
      setIsLoadingSlots(true);
      setError(null);
      try {
        const data = await getAvailableSlots(centreId, selectedDate);
        setSlots(data);
        setValue("slotId", ""); // Reset slot on date change
      } catch (err) {
        setError("Failed to load available slots.");
      } finally {
        setIsLoadingSlots(false);
      }
    }
    fetchSlots();
  }, [centreId, selectedDate, setValue]);

  // Generate next 7 dates for the dropdown
  const next7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const onSubmit = async (data: BookProcurementSlotValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await bookProcurementSlot(data);
      if (res.error) {
        setError(res.error);
      } else if (res.success && res.bookingId) {
        router.push(`/farmer/procurement/bookings/${res.bookingId}?placed=true`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit booking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (crops.length === 0) {
    return <div className="text-sm text-red-600 bg-red-50 p-4 rounded-xl">This centre currently accepts no crops.</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-800 text-sm font-bold rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {/* Crop Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-gray-700">Select Crop to Sell</label>
        <select
          {...register("cropId")}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
        >
          {crops.map(c => (
            <option key={c.cropId} value={c.cropId}>{c.cropName}</option>
          ))}
        </select>
        {errors.cropId && <p className="text-xs text-red-500">{errors.cropId.message}</p>}
      </div>

      {/* Expected Quantity */}
      {selectedCropConfig && (
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">Expected Quantity (in quintals)</label>
          <input
            type="number"
            {...register("expectedQuantity", { valueAsNumber: true })}
            min={selectedCropConfig.minimumQuantity}
            max={selectedCropConfig.maximumQuantity}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
            placeholder={`e.g. ${selectedCropConfig.minimumQuantity + 10}`}
          />
          <p className="text-[11px] text-gray-500">
            Min: {selectedCropConfig.minimumQuantity} q &bull; Max: {selectedCropConfig.maximumQuantity} q
          </p>
          {errors.expectedQuantity && <p className="text-xs text-red-500">{errors.expectedQuantity.message}</p>}
        </div>
      )}

      {/* Date Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-gray-700">Select Date</label>
        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
        >
          {next7Days.map(dateStr => {
            const [y, m, d] = dateStr.split("-").map(Number);
            return (
              <option key={dateStr} value={dateStr}>
                {format(new Date(y, m - 1, d), "EEE, dd MMM yyyy")}
              </option>
            );
          })}
        </select>
      </div>

      {/* Slot Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-gray-700">Select Time Slot</label>
        {isLoadingSlots ? (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center text-xs text-gray-500 animate-pulse">
            Loading available slots...
          </div>
        ) : slots.length === 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs text-amber-800 font-bold">
            No slots available for this date.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {slots.map(slot => {
              const isAvailable = !slot.isFull && !slot.isPast && slot.isActive;
              const isSelected = selectedSlotId === slot.id;
              
              let statusLabel = "Available";
              if (slot.isPast) statusLabel = "Closed";
              else if (slot.isFull) statusLabel = "Full";
              else if (slot.capacity - slot.bookedCount <= 5) statusLabel = "Limited";

              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => setValue("slotId", slot.id, { shouldValidate: true })}
                  className={`relative p-4 rounded-xl border text-left flex flex-col transition-all ${
                    !isAvailable
                      ? "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed"
                      : isSelected
                      ? "bg-green-50 border-green-500 shadow-sm ring-1 ring-green-500"
                      : "bg-white border-gray-300 hover:border-green-400 cursor-pointer"
                  }`}
                >
                  <span className={`text-sm font-bold ${isSelected ? "text-green-900" : "text-gray-900"}`}>
                    {slot.startTime} - {slot.endTime}
                  </span>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                      Availability: {statusLabel}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      slot.isPast || slot.isFull ? "bg-red-100 text-red-800" 
                      : statusLabel === "Limited" ? "bg-amber-100 text-amber-800"
                      : "bg-green-100 text-green-800"
                    }`}>
                      {statusLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {errors.slotId && <p className="text-xs text-red-500 mt-1">{errors.slotId.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !selectedSlotId}
        className="w-full py-3.5 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-colors"
      >
        {isSubmitting ? "Processing..." : "Confirm Booking"}
      </button>
    </form>
  );
}
