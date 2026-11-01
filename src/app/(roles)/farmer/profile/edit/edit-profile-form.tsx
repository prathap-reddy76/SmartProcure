"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { updateFarmerProfile, ProfileData } from "@/actions/farmer/profile-actions";

const profileFormSchema = z.object({
  name: z.string().min(1, "Please enter your full name"),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^[6-9]\d{9}$/.test(val.replace(/[\s-]/g, "")), {
      message: "Please enter a valid 10-digit Indian phone number (starting with 6-9)",
    }),
  village: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{6}$/.test(val.trim()), {
      message: "PIN code must be a 6-digit number",
    }),
  address: z.string().max(300).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function EditProfileForm({ initialProfile }: { initialProfile: ProfileData }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: initialProfile.name || "",
      phone: initialProfile.phone || "",
      village: initialProfile.village || "",
      district: initialProfile.district || "",
      state: initialProfile.state || "",
      pincode: initialProfile.pincode || "",
      address: initialProfile.address || "",
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append("name", data.name);
    if (data.phone) formData.append("phone", data.phone);
    if (data.village) formData.append("village", data.village);
    if (data.district) formData.append("district", data.district);
    if (data.state) formData.append("state", data.state);
    if (data.pincode) formData.append("pincode", data.pincode);
    if (data.address) formData.append("address", data.address);

    const res = await updateFarmerProfile(null, formData);

    setIsSubmitting(false);

    if (res.error) {
      setServerError(res.error);
    } else {
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => {
        router.push("/farmer/profile");
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

      {/* Basic Contact Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-2 border-b">
          Basic Contact Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              {...register("name")}
              className="mt-1 block w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900"
              placeholder="e.g. Ramesh Kumar"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              {...register("phone")}
              className="mt-1 block w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900"
              placeholder="e.g. 9876543210"
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.phone.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-500">
            Registered Email Address (Cannot be changed here)
          </label>
          <input
            type="email"
            disabled
            value={initialProfile.email}
            className="mt-1 block w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Location Details */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-2 border-b">
          Location & Residential Address
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="village" className="block text-sm font-semibold text-gray-700">
              Village / Town
            </label>
            <input
              id="village"
              type="text"
              {...register("village")}
              className="mt-1 block w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900"
              placeholder="e.g. Rampur"
            />
            {errors.village && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.village.message}</p>
            )}
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
            {errors.district && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.district.message}</p>
            )}
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
            {errors.state && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.state.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="pincode" className="block text-sm font-semibold text-gray-700">
              PIN Code
            </label>
            <input
              id="pincode"
              type="text"
              maxLength={6}
              {...register("pincode")}
              className="mt-1 block w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900"
              placeholder="e.g. 518001"
            />
            {errors.pincode && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.pincode.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-semibold text-gray-700">
            Street Address / House No.
          </label>
          <textarea
            id="address"
            rows={2}
            {...register("address")}
            className="mt-1 block w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900"
            placeholder="Door number, street name, landmarks..."
          />
          {errors.address && (
            <p className="mt-1 text-xs text-red-600 font-medium">{errors.address.message}</p>
          )}
        </div>
      </div>

      {/* Submit Button */}
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
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
