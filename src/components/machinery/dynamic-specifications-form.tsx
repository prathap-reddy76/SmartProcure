"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createMachineryListing,
  updateMachineryListing,
} from "@/actions/machinery/machinery-actions";
import {
  MACHINE_TYPES,
  MachineTypeKey,
  getMachineTypeFromCategory,
  MachinerySpecificationsRecord,
  CustomSpecificationItem,
} from "@/lib/machinery-specifications";
import { MachineryImageUploader } from "./machinery-image-uploader";

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
}

interface DynamicSpecificationsFormProps {
  categories: CategoryOption[];
  initialData?: {
    id?: string;
    name?: string;
    categoryId?: string;
    brand?: string | null;
    modelNumber?: string | null;
    description?: string | null;
    yearOfMake?: number | null;
    condition?: string;
    horsepower?: number | null;
    fuelType?: string | null;
    location?: string;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    supportsHourly?: boolean;
    pricePerHour?: number | null;
    supportsDaily?: boolean;
    pricePerDay?: number | null;
    supportsPerAcre?: boolean;
    pricePerAcre?: number | null;
    securityDeposit?: number;
    deliveryCharge?: number;
    images?: string[];
    specifications?: MachinerySpecificationsRecord | null;
  };
  isEditMode?: boolean;
}

export function DynamicSpecificationsForm({
  categories,
  initialData,
  isEditMode = false,
}: DynamicSpecificationsFormProps) {
  const router = useRouter();

  // Determine initial machine type
  const initialCat = categories.find((c) => c.id === initialData?.categoryId) || categories[0];
  const initialType: MachineTypeKey =
    initialData?.specifications?.machineType ||
    getMachineTypeFromCategory(initialCat?.slug || initialCat?.name);

  const [machineType, setMachineType] = useState<MachineTypeKey>(initialType);
  const [categoryId, setCategoryId] = useState<string>(
    initialData?.categoryId || initialCat?.id || ""
  );

  // Common basic fields
  const [name, setName] = useState(initialData?.name || "");
  const [brand, setBrand] = useState(initialData?.brand || "");
  const [modelNumber, setModelNumber] = useState(initialData?.modelNumber || "");
  const [yearOfMake, setYearOfMake] = useState<number | "">(
    initialData?.yearOfMake ?? new Date().getFullYear()
  );
  const [purchaseYear, setPurchaseYear] = useState<number | "">(
    initialData?.specifications?.purchaseYear ?? new Date().getFullYear()
  );
  const [condition, setCondition] = useState(initialData?.condition || "GOOD");
  const [description, setDescription] = useState(initialData?.description || "");

  // Rental pricing
  const [supportsHourly, setSupportsHourly] = useState(initialData?.supportsHourly ?? false);
  const [pricePerHour, setPricePerHour] = useState(initialData?.pricePerHour?.toString() || "");
  const [supportsDaily, setSupportsDaily] = useState(initialData?.supportsDaily ?? true);
  const [pricePerDay, setPricePerDay] = useState(initialData?.pricePerDay?.toString() || "");
  const [supportsPerAcre, setSupportsPerAcre] = useState(initialData?.supportsPerAcre ?? false);
  const [pricePerAcre, setPricePerAcre] = useState(initialData?.pricePerAcre?.toString() || "");
  const [customRentalUnitName, setCustomRentalUnitName] = useState(
    initialData?.specifications?.customRentalUnitName || ""
  );
  const [customRentalPrice, setCustomRentalPrice] = useState(
    initialData?.specifications?.customRentalPrice
      ? String(initialData.specifications.customRentalPrice)
      : ""
  );
  const [securityDeposit, setSecurityDeposit] = useState(
    initialData?.securityDeposit !== undefined ? String(initialData.securityDeposit) : "0"
  );
  const [deliveryCharge, setDeliveryCharge] = useState(
    initialData?.deliveryCharge !== undefined ? String(initialData.deliveryCharge) : "0"
  );

  // Availability & Location
  // Availability status
  const [location, setLocation] = useState(initialData?.location || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [serviceRadiusKm, setServiceRadiusKm] = useState(
    initialData?.specifications?.serviceRadiusKm !== undefined
      ? String(initialData.specifications.serviceRadiusKm)
      : "25"
  );
  const [availableFrom, setAvailableFrom] = useState(
    initialData?.specifications?.availableFrom || ""
  );
  const [availableUntil, setAvailableUntil] = useState(
    initialData?.specifications?.availableUntil || ""
  );

  // Images
  const [images, setImages] = useState<string[]>(initialData?.images || []);

  // Machine Type Specific state
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const initSpecs: any = initialData?.specifications || {};
  const [specs, setSpecs] = useState<Record<string, any>>({
    ...initSpecs,
    hp: initSpecs.hp || initialData?.horsepower || "",
    fuelType: initSpecs.fuelType || initialData?.fuelType || "Diesel",
  });

  // Custom key-value pairs for Other Machinery
  const [customSpecs, setCustomSpecs] = useState<CustomSpecificationItem[]>(
    Array.isArray(initSpecs.additionalSpecifications) && initSpecs.additionalSpecifications.length > 0
      ? initSpecs.additionalSpecifications
      : [{ name: "", value: "" }]
  );

  // UI accordion toggles for smooth mobile layout
  const [expandedSections, setExpandedSections] = useState({
    type: true,
    basic: true,
    specs: true,
    pricing: true,
    availability: true,
    images: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle machine type change: auto sync category
  const handleMachineTypeSelect = (newType: MachineTypeKey) => {
    setMachineType(newType);
    const def = MACHINE_TYPES.find((m) => m.key === newType);
    if (def) {
      const matchedCat =
        categories.find((c) => c.slug === def.categorySlug) ||
        categories.find((c) => c.name.toLowerCase().includes(def.label.toLowerCase())) ||
        categories[0];
      if (matchedCat) {
        setCategoryId(matchedCat.id);
      }
    }
  };

  // Handle category dropdown change: auto sync machine type
  const handleCategoryChange = (newCatId: string) => {
    setCategoryId(newCatId);
    const cat = categories.find((c) => c.id === newCatId);
    if (cat) {
      const inferredType = getMachineTypeFromCategory(cat.slug || cat.name);
      setMachineType(inferredType);
    }
  };

  const updateSpecField = (field: string, value: any) => {
    setSpecs((prev) => ({ ...prev, [field]: value }));
  };

  const handleCustomSpecChange = (index: number, key: "name" | "value", val: string) => {
    const next = [...customSpecs];
    next[index][key] = val;
    setCustomSpecs(next);
  };

  const addCustomSpecRow = () => {
    setCustomSpecs((prev) => [...prev, { name: "", value: "" }]);
  };

  const removeCustomSpecRow = (index: number) => {
    setCustomSpecs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError("Please enter the machine name.");
      return;
    }
    if (!brand.trim()) {
      setError("Please enter the manufacturer brand.");
      return;
    }
    if (!location.trim()) {
      setError("Please enter the equipment location / village.");
      return;
    }

    const hasHourly = supportsHourly && parseFloat(pricePerHour) > 0;
    const hasDaily = supportsDaily && parseFloat(pricePerDay) > 0;
    const hasPerAcre = supportsPerAcre && parseFloat(pricePerAcre) > 0;
    const hasCustom = Boolean(customRentalPrice && parseFloat(customRentalPrice) > 0);

    if (!hasHourly && !hasDaily && !hasPerAcre && !hasCustom) {
      setError("Please enable at least one rental pricing option (Hourly, Daily, Per Acre, or Custom).");
      return;
    }

    setSubmitting(true);

    try {
      // Assemble structured specifications payload
      const cleanedCustomSpecs = customSpecs.filter((c) => c.name.trim() && c.value.trim());

      const finalSpecifications: MachinerySpecificationsRecord = {
        ...specs,
        machineType,
        purchaseYear: purchaseYear ? Number(purchaseYear) : null,
        serviceRadiusKm: serviceRadiusKm ? Number(serviceRadiusKm) : null,
        availableFrom: availableFrom || null,
        availableUntil: availableUntil || null,
        customRentalUnitName: customRentalUnitName.trim() || null,
        customRentalPrice: customRentalPrice ? parseFloat(customRentalPrice) : null,
        additionalSpecifications: cleanedCustomSpecs.length > 0 ? cleanedCustomSpecs : null,
      };

      const payload = {
        name: name.trim(),
        categoryId,
        brand: brand.trim(),
        modelNumber: modelNumber.trim() || undefined,
        description: description.trim() || undefined,
        yearOfMake: yearOfMake ? Number(yearOfMake) : undefined,
        purchaseYear: purchaseYear ? Number(purchaseYear) : undefined,
        condition: condition as "NEW" | "EXCELLENT" | "GOOD" | "FAIR",
        horsepower: specs.hp ? Number(specs.hp) : specs.enginePowerHp ? Number(specs.enginePowerHp) : undefined,
        fuelType: specs.fuelType?.trim() || undefined,
        location: location.trim(),
        address: address.trim() || undefined,
        serviceRadiusKm: serviceRadiusKm ? Number(serviceRadiusKm) : undefined,
        availableFrom: availableFrom || undefined,
        availableUntil: availableUntil || undefined,

        supportsHourly,
        pricePerHour: hasHourly ? parseFloat(pricePerHour) : undefined,
        supportsDaily,
        pricePerDay: hasDaily ? parseFloat(pricePerDay) : undefined,
        supportsPerAcre,
        pricePerAcre: hasPerAcre ? parseFloat(pricePerAcre) : undefined,
        customRentalUnitName: customRentalUnitName.trim() || undefined,
        customRentalPrice: hasCustom ? parseFloat(customRentalPrice) : undefined,

        securityDeposit: securityDeposit ? parseFloat(securityDeposit) : 0,
        deliveryCharge: deliveryCharge ? parseFloat(deliveryCharge) : 0,
        imageUrls: images.slice(0, 8),
        specifications: finalSpecifications as unknown as Record<string, unknown>,
      };

      let res;
      if (isEditMode && initialData?.id) {
        res = await updateMachineryListing(initialData.id, payload);
      } else {
        res = await createMachineryListing(payload);
      }

      if (!res.success) {
        setError(res.error || "Failed to save machinery listing");
        setSubmitting(false);
        return;
      }

      router.push("/machinery/my-machinery");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred while saving machinery.";
      setError(msg);
      
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto pb-12">
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3 shadow-xs">
          <span className="text-xl">⚠️</span>
          <div className="flex-1">
            <h4 className="font-bold text-red-900">Please correct the following:</h4>
            <p className="mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. MACHINE TYPE SELECTION (FIRST FIELD - SECTION 2 & 3)       */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div
          className="flex items-center justify-between cursor-pointer select-none"
          onClick={() => toggleSection("type")}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white font-black text-sm flex items-center justify-center shadow-xs">
              1
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Machine Type Selection *
              </h2>
              <p className="text-xs text-gray-500">
                Choose the exact machine type to load relevant technical specifications.
              </p>
            </div>
          </div>
          <span className="text-gray-400 text-sm font-bold">
            {expandedSections.type ? "▲" : "▼"}
          </span>
        </div>

        {expandedSections.type && (
          <div className="space-y-4 pt-2">
            {/* Visual Machine Type Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {MACHINE_TYPES.map((m) => {
                const isSelected = machineType === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => handleMachineTypeSelect(m.key)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "border-amber-500 bg-amber-50/80 ring-2 ring-amber-400/40 shadow-xs"
                        : "border-gray-200 hover:border-gray-300 bg-gray-50/40 hover:bg-white"
                    }`}
                  >
                    <span className="text-2xl mb-1">{m.icon}</span>
                    <span
                      className={`text-xs font-bold leading-tight ${
                        isSelected ? "text-amber-900" : "text-gray-800"
                      }`}
                    >
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Category Dropdown (Synced) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Selected Machine Type
                </label>
                <div className="px-3.5 py-2.5 bg-amber-50/60 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-2">
                  <span className="text-base">
                    {MACHINE_TYPES.find((m) => m.key === machineType)?.icon}
                  </span>
                  <span>{MACHINE_TYPES.find((m) => m.key === machineType)?.label}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Marketplace Category *
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. BASIC MACHINE INFORMATION                                  */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div
          className="flex items-center justify-between cursor-pointer select-none"
          onClick={() => toggleSection("basic")}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gray-900 text-white font-black text-sm flex items-center justify-center shadow-xs">
              2
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Basic Machine Information</h2>
              <p className="text-xs text-gray-500">
                General identification, manufacturer details, and condition.
              </p>
            </div>
          </div>
          <span className="text-gray-400 text-sm font-bold">
            {expandedSections.basic ? "▲" : "▼"}
          </span>
        </div>

        {expandedSections.basic && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Machine Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mahindra 575 DI 45HP Tractor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Brand / Manufacturer *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mahindra, John Deere, Shaktiman, Kubota"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Model Number / Variant
              </label>
              <input
                type="text"
                placeholder="e.g. 575 DI XP Plus, Semi Champion 48"
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Manufacturing Year
              </label>
              <input
                type="number"
                min="1970"
                max={new Date().getFullYear() + 1}
                value={yearOfMake}
                onChange={(e) => setYearOfMake(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Purchase Year
              </label>
              <input
                type="number"
                min="1970"
                max={new Date().getFullYear() + 1}
                value={purchaseYear}
                onChange={(e) => setPurchaseYear(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Overall Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="NEW">Brand New</option>
                <option value="EXCELLENT">Excellent (Like New, Low Hours)</option>
                <option value="GOOD">Good (Regularly Serviced & Operational)</option>
                <option value="FAIR">Fair (Working Condition)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Equipment Fuel Type
              </label>
              <select
                value={specs.fuelType || "Diesel"}
                onChange={(e) => updateSpecField("fuelType", e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="Diesel">Diesel</option>
                <option value="Petrol">Petrol</option>
                <option value="Electric">Electric / Battery</option>
                <option value="CNG">CNG</option>
                <option value="Tractor PTO Powered">PTO Powered (No Engine)</option>
                <option value="None">Non-Powered (Trailed/Manual)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Detailed Description
              </label>
              <textarea
                rows={3}
                placeholder="Mention any custom modifications, maintenance records, attachment inclusions, driver availability..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. DYNAMIC TECHNICAL SPECIFICATIONS BY MACHINE TYPE           */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div
          className="flex items-center justify-between cursor-pointer select-none"
          onClick={() => toggleSection("specs")}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
              3
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>{MACHINE_TYPES.find((m) => m.key === machineType)?.icon}</span>
                <span>
                  {MACHINE_TYPES.find((m) => m.key === machineType)?.label} Specifications
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                Tailored engineering & farmer-facing details for this machine type.
              </p>
            </div>
          </div>
          <span className="text-gray-400 text-sm font-bold">
            {expandedSections.specs ? "▲" : "▼"}
          </span>
        </div>

        {expandedSections.specs && (
          <div className="space-y-6 pt-2">
            {/* TRACTOR SPECIFICATIONS */}
            {machineType === "TRACTOR" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-1.5 mb-3">
                    Engine & Power
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Horsepower (HP) *
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 45"
                        value={specs.hp || ""}
                        onChange={(e) => updateSpecField("hp", e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Torque (Nm)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 190 Nm @ 1400 RPM"
                        value={specs.torque || ""}
                        onChange={(e) => updateSpecField("torque", e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Engine Displacement (cc)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 2979"
                        value={specs.displacementCc || ""}
                        onChange={(e) => updateSpecField("displacementCc", e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Number of Cylinders
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 4"
                        value={specs.cylinderCount || ""}
                        onChange={(e) => updateSpecField("cylinderCount", e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Engine Type
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 4-Stroke, Direct Injection"
                        value={specs.engineType || ""}
                        onChange={(e) => updateSpecField("engineType", e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Fuel Tank Capacity (L)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 50"
                        value={specs.fuelTankCapacityLiters || ""}
                        onChange={(e) => updateSpecField("fuelTankCapacityLiters", e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-1.5 mb-3">
                    Transmission & Speed
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Transmission Type
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Partial Constant Mesh, Synchromesh"
                        value={specs.transmissionType || ""}
                        onChange={(e) => updateSpecField("transmissionType", e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Number of Gears
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 8 Forward + 2 Reverse"
                        value={specs.gearCount || ""}
                        onChange={(e) => updateSpecField("gearCount", e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Max Speed (km/h)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 32"
                        value={specs.maxSpeedKmh || ""}
                        onChange={(e) => updateSpecField("maxSpeedKmh", e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-1.5 mb-3">
                    PTO & Hydraulics
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        PTO Type
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dual PTO, Reverse PTO"
                        value={specs.ptoType || ""}
                        onChange={(e) => updateSpecField("ptoType", e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        PTO RPM
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 540 / 1000 RPM"
                        value={specs.ptoRpm || ""}
                        onChange={(e) => updateSpecField("ptoRpm", e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Hydraulic Lift Capacity (kg)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 1600"
                        value={specs.hydraulicLiftCapacityKg || ""}
                        onChange={(e) => updateSpecField("hydraulicLiftCapacityKg", e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Hydraulic System Type
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. High Precision ADDC, Position & Draft Control"
                        value={specs.hydraulicSystemType || ""}
                        onChange={(e) => updateSpecField("hydraulicSystemType", e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-1.5 mb-3">
                    Chassis, Steering & Dimensions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Drive Type *
                      </label>
                      <select
                        value={specs.driveType || "2WD"}
                        onChange={(e) => updateSpecField("driveType", e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      >
                        <option value="2WD">2WD (Two Wheel Drive)</option>
                        <option value="4WD">4WD (Four Wheel Drive)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Steering Type
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Hydrostatic Power Steering"
                        value={specs.steeringType || ""}
                        onChange={(e) => updateSpecField("steeringType", e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Brake Type
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Oil Immersed Multi-Disc Brakes"
                        value={specs.brakeType || ""}
                        onChange={(e) => updateSpecField("brakeType", e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Tyre Size
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Front 6.00-16 / Rear 13.6-28"
                        value={specs.tyreSize || ""}
                        onChange={(e) => updateSpecField("tyreSize", e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Total Tractor Weight (kg)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 2100"
                        value={specs.weightKg || ""}
                        onChange={(e) => updateSpecField("weightKg", e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Ground Clearance (mm)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 400"
                        value={specs.groundClearanceMm || ""}
                        onChange={(e) => updateSpecField("groundClearanceMm", e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 border-b border-amber-100 pb-1.5 mb-3">
                    Useful Farmer Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Recommended Land Size
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 5 - 25 Acres"
                        value={specs.recommendedLandSize || ""}
                        onChange={(e) => updateSpecField("recommendedLandSize", e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Suitable Crops
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Paddy, Cotton, Sugarcane, Wheat, Maize"
                        value={specs.suitableCrops || ""}
                        onChange={(e) => updateSpecField("suitableCrops", e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Recommended Implements & Operations
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. MB Plough, 7ft Rotavator, 9-tyne Cultivator, 5-ton Trolley"
                        value={specs.recommendedImplements || ""}
                        onChange={(e) => updateSpecField("recommendedImplements", e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ROTAVATOR SPECIFICATIONS */}
            {machineType === "ROTAVATOR" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Working Width *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 5 Feet (1.5 m) / 6 Feet"
                      value={specs.workingWidth || ""}
                      onChange={(e) => updateSpecField("workingWidth", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Number of Blades
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 48"
                      value={specs.bladeCount || ""}
                      onChange={(e) => updateSpecField("bladeCount", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Blade Type
                    </label>
                    <select
                      value={specs.bladeType || "L-Type"}
                      onChange={(e) => updateSpecField("bladeType", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    >
                      <option value="L-Type">L-Type (Wetland & Puddling)</option>
                      <option value="C-Type">C-Type (Dryland Hard Soil)</option>
                      <option value="J-Type">J-Type (General Purpose)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Number of Flanges / Blade Sets
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 8"
                      value={specs.bladeSetsCount || ""}
                      onChange={(e) => updateSpecField("bladeSetsCount", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Tractor HP Requirement *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 40 - 55 HP"
                      value={specs.tractorHpRequirement || ""}
                      onChange={(e) => updateSpecField("tractorHpRequirement", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      PTO RPM
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 540 RPM"
                      value={specs.ptoRpm || ""}
                      onChange={(e) => updateSpecField("ptoRpm", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Gearbox Type
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Multi Speed / Single Speed"
                      value={specs.gearboxType || ""}
                      onChange={(e) => updateSpecField("gearboxType", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Working Depth
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 4 - 7 Inches"
                      value={specs.workingDepth || ""}
                      onChange={(e) => updateSpecField("workingDepth", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Rotavator Weight (kg)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 420"
                      value={specs.weightKg || ""}
                      onChange={(e) => updateSpecField("weightKg", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Recommended Soil Type
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sandy Loam, Clay, Black Cotton"
                      value={specs.recommendedSoilType || ""}
                      onChange={(e) => updateSpecField("recommendedSoilType", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Approx. Field Capacity
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1.2 - 1.5 Acres/hr"
                      value={specs.fieldCapacity || ""}
                      onChange={(e) => updateSpecField("fieldCapacity", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Three-Point Hitch Category
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Category I / Category II"
                      value={specs.hitchCategory || ""}
                      onChange={(e) => updateSpecField("hitchCategory", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PLOUGH SPECIFICATIONS */}
            {machineType === "PLOUGH" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Plough Type *
                    </label>
                    <select
                      value={specs.ploughType || "Mouldboard"}
                      onChange={(e) => updateSpecField("ploughType", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    >
                      <option value="Mouldboard">Mouldboard (MB) Plough</option>
                      <option value="Disc">Disc Plough</option>
                      <option value="Reversible">Hydraulic Reversible MB Plough</option>
                      <option value="Chisel">Chisel Plough (Subsoiler)</option>
                      <option value="Other">Other Primary Tillage Plough</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Number of Bottoms / Furrows
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2 or 3"
                      value={specs.bottomCount || ""}
                      onChange={(e) => updateSpecField("bottomCount", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Number of Discs (If Disc Plough)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2, 3, or 4"
                      value={specs.discCount || ""}
                      onChange={(e) => updateSpecField("discCount", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Disc Diameter
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 26 Inches (660 mm)"
                      value={specs.discDiameter || ""}
                      onChange={(e) => updateSpecField("discDiameter", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Working Width
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 3 - 4.5 Feet"
                      value={specs.workingWidth || ""}
                      onChange={(e) => updateSpecField("workingWidth", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Working Depth
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 8 - 12 Inches"
                      value={specs.workingDepth || ""}
                      onChange={(e) => updateSpecField("workingDepth", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Tractor HP Requirement *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 45 - 65 HP"
                      value={specs.tractorHpRequirement || ""}
                      onChange={(e) => updateSpecField("tractorHpRequirement", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Plough Weight (kg)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 360"
                      value={specs.weightKg || ""}
                      onChange={(e) => updateSpecField("weightKg", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Hitch Type
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 3-Point Linkage (Cat II)"
                      value={specs.hitchType || ""}
                      onChange={(e) => updateSpecField("hitchType", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Recommended Soil & Crops
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hard soil deep ploughing for Sugarcane, Cotton, Maize"
                      value={specs.recommendedSoilType || ""}
                      onChange={(e) => updateSpecField("recommendedSoilType", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* POWER TILLER SPECIFICATIONS */}
            {machineType === "POWER_TILLER" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Engine Power (HP) *
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 15 HP"
                      value={specs.enginePowerHp || ""}
                      onChange={(e) => updateSpecField("enginePowerHp", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Engine Type
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Single Cylinder 4-Stroke Water Cooled"
                      value={specs.engineType || ""}
                      onChange={(e) => updateSpecField("engineType", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Displacement (cc)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 680"
                      value={specs.displacementCc || ""}
                      onChange={(e) => updateSpecField("displacementCc", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Working Width
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 24 - 36 Inches"
                      value={specs.workingWidth || ""}
                      onChange={(e) => updateSpecField("workingWidth", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Starting System
                    </label>
                    <select
                      value={specs.startingSystem || "Electric / Key Start"}
                      onChange={(e) => updateSpecField("startingSystem", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    >
                      <option value="Electric / Key Start">Electric / Key Start</option>
                      <option value="Manual Recoil / Hand Crank">Manual Recoil / Hand Crank</option>
                      <option value="Dual (Electric & Recoil)">Dual (Electric & Recoil)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Tiller Weight (kg)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 380"
                      value={specs.weightKg || ""}
                      onChange={(e) => updateSpecField("weightKg", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Suitable Implements & Recommended Land Size
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rotary Tiller, Ridger, Cage Wheels for 1-5 acre wet paddy"
                      value={specs.suitableImplements || ""}
                      onChange={(e) => updateSpecField("suitableImplements", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* HYDRAULIC TRUCK SPECIFICATIONS */}
            {machineType === "HYDRAULIC_TRUCK" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Payload Capacity (Tons) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 8.5"
                      value={specs.payloadCapacityTons || ""}
                      onChange={(e) => updateSpecField("payloadCapacityTons", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Hydraulic Lifting Capacity (Tons)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 10"
                      value={specs.hydraulicLiftingCapacityTons || ""}
                      onChange={(e) => updateSpecField("hydraulicLiftingCapacityTons", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Tipping Type
                    </label>
                    <select
                      value={specs.tippingType || "Rear Tipping"}
                      onChange={(e) => updateSpecField("tippingType", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    >
                      <option value="Rear Tipping">Rear Tipping</option>
                      <option value="Three-Way Tipping">Three-Way Tipping</option>
                      <option value="Side Tipping">Side Tipping</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Bed Length (Feet)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 14"
                      value={specs.bedLengthFeet || ""}
                      onChange={(e) => updateSpecField("bedLengthFeet", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Bed Width (Feet)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 7"
                      value={specs.bedWidthFeet || ""}
                      onChange={(e) => updateSpecField("bedWidthFeet", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Engine Power (HP)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 130"
                      value={specs.enginePowerHp || ""}
                      onChange={(e) => updateSpecField("enginePowerHp", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Suitable Transport Materials & Farm Operations
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Paddy transport, Fertilizer shifting, Sugarcane to mill, Soil transport"
                      value={specs.suitableFarmOperations || ""}
                      onChange={(e) => updateSpecField("suitableFarmOperations", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* HARVESTER SPECIFICATIONS */}
            {machineType === "HARVESTER" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Harvester Type *
                    </label>
                    <select
                      value={specs.harvesterType || "Self-Propelled Multi-Crop Combine"}
                      onChange={(e) => updateSpecField("harvesterType", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    >
                      <option value="Self-Propelled Multi-Crop Combine">Self-Propelled Combine</option>
                      <option value="Track-Type Wet Paddy Harvester">Track-Type Wet Paddy Harvester</option>
                      <option value="Tractor-Mounted Harvester">Tractor-Mounted Harvester</option>
                      <option value="Mini Grain Harvester">Mini Grain Harvester</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Engine Power (HP) *
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 101 HP"
                      value={specs.enginePowerHp || ""}
                      onChange={(e) => updateSpecField("enginePowerHp", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Cutting Width (Feet)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 14"
                      value={specs.cuttingWidthFeet || ""}
                      onChange={(e) => updateSpecField("cuttingWidthFeet", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Grain Tank Capacity (Liters)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2400"
                      value={specs.grainTankCapacityLiters || ""}
                      onChange={(e) => updateSpecField("grainTankCapacityLiters", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Harvesting Capacity
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1.5 - 2.5 Acres/hr"
                      value={specs.harvestingCapacity || ""}
                      onChange={(e) => updateSpecField("harvestingCapacity", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Total Machine Weight (kg)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 7200"
                      value={specs.weightKg || ""}
                      onChange={(e) => updateSpecField("weightKg", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Suitable Crops & Field Conditions
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Paddy, Wheat, Soybean, Maize in dry and marshy soils"
                      value={specs.suitableCrops || ""}
                      onChange={(e) => updateSpecField("suitableCrops", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CULTIVATOR SPECIFICATIONS */}
            {machineType === "CULTIVATOR" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Number of Tines *
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 9 or 11"
                      value={specs.tineCount || ""}
                      onChange={(e) => updateSpecField("tineCount", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Tine Type
                    </label>
                    <select
                      value={specs.tineType || "Spring Loaded"}
                      onChange={(e) => updateSpecField("tineType", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    >
                      <option value="Spring Loaded">Spring Loaded</option>
                      <option value="Rigid Tyne">Rigid Tyne</option>
                      <option value="Duckfoot Tyne">Duckfoot Tyne (Weed Control)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Tractor HP Requirement *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 35 - 50 HP"
                      value={specs.tractorHpRequirement || ""}
                      onChange={(e) => updateSpecField("tractorHpRequirement", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Working Width
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 7.5 Feet"
                      value={specs.workingWidth || ""}
                      onChange={(e) => updateSpecField("workingWidth", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Working Depth
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 7 Inches"
                      value={specs.workingDepth || ""}
                      onChange={(e) => updateSpecField("workingDepth", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Total Weight (kg)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 280"
                      value={specs.weightKg || ""}
                      onChange={(e) => updateSpecField("weightKg", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SEED DRILL / SEED PLANTER SPECIFICATIONS */}
            {machineType === "SEED_DRILL" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Number of Rows *
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 9 or 11"
                      value={specs.rowCount || ""}
                      onChange={(e) => updateSpecField("rowCount", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Row Spacing (Inches)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 7"
                      value={specs.rowSpacingInches || ""}
                      onChange={(e) => updateSpecField("rowSpacingInches", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Seed Capacity (kg)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      value={specs.seedCapacityKg || ""}
                      onChange={(e) => updateSpecField("seedCapacityKg", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Fertilizer Capacity (kg)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      value={specs.fertilizerCapacityKg || ""}
                      onChange={(e) => updateSpecField("fertilizerCapacityKg", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Tractor HP Requirement
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 35 - 45 HP"
                      value={specs.tractorHpRequirement || ""}
                      onChange={(e) => updateSpecField("tractorHpRequirement", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Seed Metering Mechanism
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Fluted Roller Mechanism"
                      value={specs.meteringMechanism || ""}
                      onChange={(e) => updateSpecField("meteringMechanism", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TRAILER SPECIFICATIONS */}
            {machineType === "TRAILER" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Trailer Type *
                    </label>
                    <select
                      value={specs.trailerType || "2-Wheel Hydraulic Tipper"}
                      onChange={(e) => updateSpecField("trailerType", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    >
                      <option value="2-Wheel Hydraulic Tipper">2-Wheel Hydraulic Tipper</option>
                      <option value="4-Wheel Hydraulic Tipper">4-Wheel Hydraulic Tipper</option>
                      <option value="4-Wheel Non-Tipping Trolley">4-Wheel Non-Tipping Trolley</option>
                      <option value="Tandem Axle Heavy Trolley">Tandem Axle Heavy Trolley</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Payload Capacity (Tons) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 5"
                      value={specs.payloadCapacityTons || ""}
                      onChange={(e) => updateSpecField("payloadCapacityTons", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Hydraulic Tipping
                    </label>
                    <select
                      value={specs.tippingHydraulic || "Yes"}
                      onChange={(e) => updateSpecField("tippingHydraulic", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    >
                      <option value="Yes">Yes (Hydraulic Tipping)</option>
                      <option value="No">No (Rigid Platform)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Bed Length (Feet)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 11"
                      value={specs.lengthFeet || ""}
                      onChange={(e) => updateSpecField("lengthFeet", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Bed Width (Feet)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 6"
                      value={specs.widthFeet || ""}
                      onChange={(e) => updateSpecField("widthFeet", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Number of Axles
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 1 or 2"
                      value={specs.axleCount || ""}
                      onChange={(e) => updateSpecField("axleCount", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* OTHER AGRICULTURAL MACHINERY SPECIFICATIONS */}
            {machineType === "OTHER" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Engine / Motor Power (HP)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 10 HP"
                      value={specs.enginePowerHp || ""}
                      onChange={(e) => updateSpecField("enginePowerHp", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Capacity / Output
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 5000 Litres, 2 Tons/hr"
                      value={specs.capacity || ""}
                      onChange={(e) => updateSpecField("capacity", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Machine Weight (kg)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 450"
                      value={specs.weightKg || ""}
                      onChange={(e) => updateSpecField("weightKg", e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Additional Key-Value Specifications Table (Section 14) */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase">
                      Additional Custom Specifications
                    </label>
                    <button
                      type="button"
                      onClick={addCustomSpecRow}
                      className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>+ Add Row</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {customSpecs.map((row, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Specification Name (e.g. Boom Width)"
                          value={row.name}
                          onChange={(e) => handleCustomSpecChange(idx, "name", e.target.value)}
                          className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <input
                          type="text"
                          placeholder="Value (e.g. 12 meters)"
                          value={row.value}
                          onChange={(e) => handleCustomSpecChange(idx, "value", e.target.value)}
                          className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        {customSpecs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCustomSpecRow(idx)}
                            className="p-2 text-red-500 hover:text-red-700 text-xs font-bold rounded-lg hover:bg-red-50 cursor-pointer"
                            title="Remove row"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. RENTAL PRICING & MODES (SECTION 4)                         */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div
          className="flex items-center justify-between cursor-pointer select-none"
          onClick={() => toggleSection("pricing")}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
              4
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Rental Information & Pricing</h2>
              <p className="text-xs text-gray-500">
                Configure flexible rental units: per hour, per day, per acre, or per trip.
              </p>
            </div>
          </div>
          <span className="text-gray-400 text-sm font-bold">
            {expandedSections.pricing ? "▲" : "▼"}
          </span>
        </div>

        {expandedSections.pricing && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Daily Rate */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  supportsDaily
                    ? "border-emerald-300 bg-emerald-50/40"
                    : "border-gray-200 bg-gray-50/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-900">📅 Daily Rental</span>
                  <input
                    type="checkbox"
                    checked={supportsDaily}
                    onChange={(e) => setSupportsDaily(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                {supportsDaily && (
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Price Per Day (₹) *
                    </label>
                    <input
                      type="number"
                      required={supportsDaily}
                      min="1"
                      placeholder="e.g. 2500"
                      value={pricePerDay}
                      onChange={(e) => setPricePerDay(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Hourly Rate */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  supportsHourly
                    ? "border-emerald-300 bg-emerald-50/40"
                    : "border-gray-200 bg-gray-50/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-900">⏱️ Hourly Rental</span>
                  <input
                    type="checkbox"
                    checked={supportsHourly}
                    onChange={(e) => setSupportsHourly(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                {supportsHourly && (
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Price Per Hour (₹) *
                    </label>
                    <input
                      type="number"
                      required={supportsHourly}
                      min="1"
                      placeholder="e.g. 450"
                      value={pricePerHour}
                      onChange={(e) => setPricePerHour(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Per Acre Rate */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  supportsPerAcre
                    ? "border-emerald-300 bg-emerald-50/40"
                    : "border-gray-200 bg-gray-50/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-900">🌾 Per Acre Work</span>
                  <input
                    type="checkbox"
                    checked={supportsPerAcre}
                    onChange={(e) => setSupportsPerAcre(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                {supportsPerAcre && (
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Price Per Acre (₹) *
                    </label>
                    <input
                      type="number"
                      required={supportsPerAcre}
                      min="1"
                      placeholder="e.g. 1200"
                      value={pricePerAcre}
                      onChange={(e) => setPricePerAcre(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Custom / Per Trip Pricing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Custom Rental Unit (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Per Trip, Per Ton, Per Load"
                  value={customRentalUnitName}
                  onChange={(e) => setCustomRentalUnitName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Custom Unit Price (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 1500"
                  value={customRentalPrice}
                  onChange={(e) => setCustomRentalPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Refundable Security Deposit (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Delivery / Haulage Charge (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0 for free farmer pickup"
                  value={deliveryCharge}
                  onChange={(e) => setDeliveryCharge(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. AVAILABILITY & SERVICE LOCATION                             */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div
          className="flex items-center justify-between cursor-pointer select-none"
          onClick={() => toggleSection("availability")}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
              5
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Availability & Service Radius</h2>
              <p className="text-xs text-gray-500">
                Specify base location, operational range, and booking dates.
              </p>
            </div>
          </div>
          <span className="text-gray-400 text-sm font-bold">
            {expandedSections.availability ? "▲" : "▼"}
          </span>
        </div>

        {expandedSections.availability && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Base Location / City / Mandal *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Vijayawada, Krishna District"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Service Radius (km)
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 25 km"
                value={serviceRadiusKm}
                onChange={(e) => setServiceRadiusKm(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Available From Date
              </label>
              <input
                type="date"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Available Until Date
              </label>
              <input
                type="date"
                value={availableUntil}
                onChange={(e) => setAvailableUntil(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Full Physical Address / Shed Location
              </label>
              <input
                type="text"
                placeholder="e.g. Plot 14, Farm Equipment Hub, Near Market Yard"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6. MACHINE PHOTOS (SECTION 15 & 16)                           */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div
          className="flex items-center justify-between cursor-pointer select-none"
          onClick={() => toggleSection("images")}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
              6
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Machine Images & Gallery</h2>
              <p className="text-xs text-gray-500">
                Upload up to 8 real photos of the machine from multiple angles.
              </p>
            </div>
          </div>
          <span className="text-gray-400 text-sm font-bold">
            {expandedSections.images ? "▲" : "▼"}
          </span>
        </div>

        {expandedSections.images && (
          <div className="pt-2">
            <MachineryImageUploader
              images={images}
              onChange={setImages}
              maxImages={8}
            />
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SUBMISSION & ACTIONS                                          */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-between pt-4">
        <Link
          href="/machinery/my-machinery"
          className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold text-sm transition-colors"
        >
          &larr; Cancel
        </Link>

        <button
          type="submit"
          disabled={submitting}
          className="px-7 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving Listing...</span>
            </>
          ) : isEditMode ? (
            <span>Update Machine Listing &rarr;</span>
          ) : (
            <span>Publish Machine Listing &rarr;</span>
          )}
        </button>
      </div>
    </form>
  );
}
