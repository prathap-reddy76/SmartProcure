"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { updateFarmDetails, FarmData } from "@/actions/farmer/farm-actions";

const farmFormSchema = z.object({
  farmName: z.string().min(1, "Please provide a name or identifier for your farm").max(100),
  farmSize: z
    .string()
    .min(1, "Please specify farm size")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Farm size must be a positive number greater than 0",
    }),
  farmSizeUnit: z.string(),
  landType: z.string().min(1, "Please select land type"),
  irrigationType: z.string().min(1, "Please select irrigation type"),
  primaryCrop: z.string().min(1, "Please specify your primary crop").max(100),
  village: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
});

type FarmFormValues = z.infer<typeof farmFormSchema>;

interface EditFarmFormProps {
  initialFarm: FarmData | null | undefined;
  defaultLocation?: {
    village: string | null;
    district: string | null;
    state: string | null;
  };
}

export function EditFarmForm({ initialFarm, defaultLocation }: EditFarmFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FarmFormValues>({
    resolver: zodResolver(farmFormSchema),
    defaultValues: {
      farmName: initialFarm?.farmName || "Primary Farm Land",
      farmSize: initialFarm?.farmSize !== null && initialFarm?.farmSize !== undefined ? String(initialFarm.farmSize) : "",
      farmSizeUnit: initialFarm?.farmSizeUnit || "acres",
      landType: initialFarm?.landType || "Irrigated",
      irrigationType: initialFarm?.irrigationType || "Borewell",
      primaryCrop: initialFarm?.primaryCrop || "",
      village: initialFarm?.village || defaultLocation?.village || "",
      district: initialFarm?.district || defaultLocation?.district || "",
      state: initialFarm?.state || defaultLocation?.state || "",
    },
  });

  const onSubmit = async (data: FarmFormValues) => {
    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append("farmName", data.farmName);
    formData.append("farmSize", data.farmSize);
    formData.append("farmSizeUnit", data.farmSizeUnit);
    formData.append("landType", data.landType);
    formData.append("irrigationType", data.irrigationType);
    formData.append("primaryCrop", data.primaryCrop);
    if (data.village) formData.append("village", data.village);
    if (data.district) formData.append("district", data.district);
    if (data.state) formData.append("state", data.state);

    const res = await updateFarmDetails(null, formData);

    setIsSubmitting(false);

    if (res.error) {
      setServerError(res.error);
    } else {
      setSuccessMessage("Farm details saved successfully!");
      setTimeout(() => {
        router.push("/farmer/farm");
        router.refresh();
      }, 900);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {serverError}
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg font-medium">
          {successMessage}
        </div>
      )}

      {/* Farm Overview */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-2 border-b">
          Land & Size Details
        </h3>

        <div>
          <label htmlFor="farmName" className="block text-sm font-semibold text-gray-700">
            Farm Name / Identification <span className="text-red-500">*</span>
          </label>
          <input
            id="farmName"
            type="text"
            {...register("farmName")}
            className="mt-1 block w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900"
            placeholder="e.g. Green Valley Plot 1"
          />
          {errors.farmName && (
            <p className="mt-1 text-xs text-red-600 font-medium">{errors.farmName.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="farmSize" className="block text-sm font-semibold text-gray-700">
              Total Farm Size <span className="text-red-500">*</span>
            </label>
            <input
              id="farmSize"
              type="number"
              step="any"
              {...register("farmSize")}
              className="mt-1 block w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900"
              placeholder="e.g. 4.5"
            />
            {errors.farmSize && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.farmSize.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="farmSizeUnit" className="block text-sm font-semibold text-gray-700">
              Unit of Measurement <span className="text-red-500">*</span>
            </label>
            <select
              id="farmSizeUnit"
              {...register("farmSizeUnit")}
              className="mt-1 block w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900"
            >
              <option value="acres">Acres</option>
              <option value="hectares">Hectares</option>
              <option value="bigha">Bigha</option>
              <option value="guntha">Guntha</option>
            </select>
          </div>
        </div>
      </div>

      {/* Agricultural Characteristics */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-2 border-b">
          Soil & Irrigation Features
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="landType" className="block text-sm font-semibold text-gray-700">
              Land Type <span className="text-red-500">*</span>
            </label>
            <select
              id="landType"
              {...register("landType")}
              className="mt-1 block w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900"
            >
              <option value="Irrigated">Irrigated</option>
              <option value="Rainfed">Rainfed (Dryland)</option>
              <option value="Wetland / Lowland">Wetland / Lowland</option>
              <option value="Mixed Soil">Mixed Soil</option>
              <option value="Coastal Sandy">Coastal Sandy</option>
            </select>
            {errors.landType && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.landType.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="irrigationType" className="block text-sm font-semibold text-gray-700">
              Primary Irrigation Source <span className="text-red-500">*</span>
            </label>
            <select
              id="irrigationType"
              {...register("irrigationType")}
              className="mt-1 block w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900"
            >
              <option value="Borewell">Borewell / Tube Well</option>
              <option value="Canal">Government Canal</option>
              <option value="Drip Irrigation">Drip Irrigation</option>
              <option value="Sprinkler">Sprinkler Irrigation</option>
              <option value="Open Well">Open Well / Tank</option>
              <option value="Rainfed (Monsoon only)">Rainfed (Monsoon only)</option>
              <option value="River Lift">River Lift</option>
            </select>
            {errors.irrigationType && (
              <p className="mt-1 text-xs text-red-600 font-medium">
                {errors.irrigationType.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="primaryCrop" className="block text-sm font-semibold text-gray-700">
            Primary Crop Cultivated <span className="text-red-500">*</span>
          </label>
          <input
            id="primaryCrop"
            type="text"
            {...register("primaryCrop")}
            className="mt-1 block w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900"
            placeholder="e.g. Rice (Paddy), Wheat, Cotton, Maize..."
          />
          {errors.primaryCrop && (
            <p className="mt-1 text-xs text-red-600 font-medium">{errors.primaryCrop.message}</p>
          )}
        </div>
      </div>

      {/* Farm Location */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-2 border-b">
          Farm Location (Optional override if different from residence)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="village" className="block text-sm font-semibold text-gray-700">
              Village / Mouza
            </label>
            <input
              id="village"
              type="text"
              {...register("village")}
              className="mt-1 block w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900"
              placeholder="e.g. Rampur"
            />
          </div>

          <div>
            <label htmlFor="district" className="block text-sm font-semibold text-gray-700">
              District
            </label>
            <input
              id="district"
              type="text"
              {...register("district")}
              className="mt-1 block w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900"
              placeholder="e.g. Kurnool"
            />
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-semibold text-gray-700">
              State
            </label>
            <input
              id="state"
              type="text"
              {...register("state")}
              className="mt-1 block w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900"
              placeholder="e.g. Andhra Pradesh"
            />
          </div>
        </div>
      </div>

      {/* Form Buttons */}
      <div className="pt-4 border-t flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-hidden"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 text-sm font-medium text-white bg-green-700 hover:bg-green-800 disabled:opacity-50 rounded-lg shadow-xs focus:ring-2 focus:ring-green-500 focus:outline-hidden transition-colors"
        >
          {isSubmitting ? "Saving..." : "Save Farm Details"}
        </button>
      </div>
    </form>
  );
}
