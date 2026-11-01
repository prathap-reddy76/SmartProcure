"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { addFarmerCrop, deleteFarmerCrop, CropData } from "@/actions/farmer/crop-actions";
import { CropIcon, PlusIcon, CloseIcon } from "@/components/ui/icons";

const cropFormSchema = z.object({
  cropName: z.string().min(1, "Please enter crop name (e.g. Paddy, Wheat)").max(100),
  variety: z.string().max(100).optional(),
  area: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) > 0), {
      message: "Area must be a positive number",
    }),
  areaUnit: z.string(),
  season: z.string(),
  plantingDate: z.string().optional(),
  harvestDate: z.string().optional(),
});

type CropFormValues = z.infer<typeof cropFormSchema>;

export function CropsClient({ initialCrops }: { initialCrops: CropData[] }) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CropFormValues>({
    resolver: zodResolver(cropFormSchema),
    defaultValues: {
      cropName: "",
      variety: "",
      area: "",
      areaUnit: "acres",
      season: "Kharif",
      plantingDate: "",
      harvestDate: "",
    },
  });

  const onSubmit = async (data: CropFormValues) => {
    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append("cropName", data.cropName);
    if (data.variety) formData.append("variety", data.variety);
    if (data.area) formData.append("area", data.area);
    formData.append("areaUnit", data.areaUnit);
    if (data.season) formData.append("season", data.season);
    if (data.plantingDate) formData.append("plantingDate", data.plantingDate);
    if (data.harvestDate) formData.append("harvestDate", data.harvestDate);

    const res = await addFarmerCrop(null, formData);

    setIsSubmitting(false);

    if (res.error) {
      setServerError(res.error);
    } else {
      setSuccessMessage("Crop added successfully!");
      reset();
      setShowAddForm(false);
      router.refresh();
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleDelete = async (cropId: string) => {
    if (!confirm("Are you sure you want to remove this crop record?")) return;

    setDeletingId(cropId);
    const res = await deleteFarmerCrop(cropId);
    setDeletingId(null);

    if (res.error) {
      alert(res.error);
    } else {
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-sm font-semibold text-gray-700">
            Total Crops Recorded:{" "}
            <span className="text-green-800 font-bold">{initialCrops.length}</span>
          </span>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-medium rounded-lg shadow-xs transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add New Crop</span>
          </button>
        )}
      </div>

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg font-medium">
          {successMessage}
        </div>
      )}

      {/* Add Crop Inline Form Modal/Card */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-green-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CropIcon className="w-5 h-5 text-green-700" />
              <span>Record a Cultivated Crop</span>
            </h2>
            <button
              onClick={() => {
                setShowAddForm(false);
                setServerError(null);
              }}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              aria-label="Close"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {serverError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cropName" className="block text-sm font-semibold text-gray-700">
                  Crop Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="cropName"
                  type="text"
                  {...register("cropName")}
                  className="mt-1 block w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900"
                  placeholder="e.g. Rice (Paddy), Wheat, Cotton..."
                />
                {errors.cropName && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.cropName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="variety" className="block text-sm font-semibold text-gray-700">
                  Variety / Hybrid Name
                </label>
                <input
                  id="variety"
                  type="text"
                  {...register("variety")}
                  className="mt-1 block w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900"
                  placeholder="e.g. Sona Masoori, Sharbati, BT Cotton..."
                />
                {errors.variety && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.variety.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="area" className="block text-sm font-semibold text-gray-700">
                    Cultivated Area
                  </label>
                  <input
                    id="area"
                    type="number"
                    step="any"
                    {...register("area")}
                    className="mt-1 block w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900"
                    placeholder="e.g. 2.5"
                  />
                  {errors.area && (
                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.area.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="areaUnit" className="block text-sm font-semibold text-gray-700">
                    Unit
                  </label>
                  <select
                    id="areaUnit"
                    {...register("areaUnit")}
                    className="mt-1 block w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900"
                  >
                    <option value="acres">Acres</option>
                    <option value="hectares">Hectares</option>
                    <option value="bigha">Bigha</option>
                    <option value="guntha">Guntha</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="season" className="block text-sm font-semibold text-gray-700">
                  Cropping Season
                </label>
                <select
                  id="season"
                  {...register("season")}
                  className="mt-1 block w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900"
                >
                  <option value="Kharif">Kharif (Monsoon)</option>
                  <option value="Rabi">Rabi (Winter)</option>
                  <option value="Zaid">Zaid (Summer)</option>
                  <option value="Perennial / Annual">Perennial / Annual</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="plantingDate" className="block text-sm font-semibold text-gray-700">
                  Planting / Sowing Date
                </label>
                <input
                  id="plantingDate"
                  type="date"
                  {...register("plantingDate")}
                  className="mt-1 block w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="harvestDate" className="block text-sm font-semibold text-gray-700">
                  Expected Harvest Date
                </label>
                <input
                  id="harvestDate"
                  type="date"
                  {...register("harvestDate")}
                  className="mt-1 block w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900"
                />
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-hidden"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-medium text-white bg-green-700 hover:bg-green-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
              >
                {isSubmitting ? "Adding..." : "Save Crop"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Crops List or Empty State */}
      {initialCrops.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {initialCrops.map((crop) => (
            <div
              key={crop.id}
              className="bg-white rounded-xl border border-gray-200/80 shadow-xs hover:border-green-300 p-5 flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 leading-snug">{crop.cropName}</h3>
                    {crop.variety && (
                      <p className="text-xs font-medium text-green-700">{crop.variety}</p>
                    )}
                  </div>
                  {crop.season && (
                    <span className="text-[11px] font-bold px-2.5 py-1 bg-green-50 text-green-800 border border-green-200/80 rounded-md">
                      {crop.season}
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400 block font-semibold uppercase">Area</span>
                    <span className="font-bold text-gray-800 text-sm">
                      {crop.area ? `${crop.area} ${crop.areaUnit}` : "Not set"}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block font-semibold uppercase">Expected Harvest</span>
                    <span className="font-medium text-gray-700">
                      {crop.harvestDate ? new Date(crop.harvestDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Unspecified"}
                    </span>
                  </div>

                  {crop.plantingDate && (
                    <div className="col-span-2 mt-1">
                      <span className="text-gray-400 block font-semibold uppercase">Sown On</span>
                      <span className="font-medium text-gray-600">
                        {new Date(crop.plantingDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  Added {new Date(crop.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                </span>
                <button
                  onClick={() => handleDelete(crop.id)}
                  disabled={deletingId === crop.id}
                  className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {deletingId === crop.id ? "Removing..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State as specified in Section 17 & 25 */
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-8 sm:p-12 text-center max-w-xl mx-auto my-6">
          <div className="w-16 h-16 rounded-full bg-green-50 text-green-700 flex items-center justify-center mx-auto mb-4 border border-green-100">
            <CropIcon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No crops added yet</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Add your crops to keep your farm information organized and prepare for digital slot booking.
          </p>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg text-sm shadow-xs transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add Crop</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
