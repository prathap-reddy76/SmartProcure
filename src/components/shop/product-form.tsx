"use client";

import React, { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { createShopProduct, updateShopProduct } from "@/actions/shop/product-actions";
import { ShopType } from "@prisma/client";

interface ProductFormProps {
  shopType: ShopType;
  categories: { id: string; name: string }[];
  initialData?: any;
}

export function ProductForm({ shopType, categories, initialData }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isEditing = !!initialData;
  const spec = initialData?.specifications || {};
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.images?.[0]?.imageUrl || null);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      if (isEditing) {
        await updateShopProduct(initialData.id, formData);
      } else {
        await createShopProduct(formData);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  }

  const renderFertilizerFields = () => (
    <>
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Agricultural Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Product Type</label>
            <input type="text" name="productTypeInput" defaultValue={spec.productTypeInput} placeholder="e.g. Bio Fertilizer" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Composition</label>
            <input type="text" name="composition" defaultValue={spec.composition} placeholder="e.g. Nitrogen 46%" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Active Ingredient</label>
            <input type="text" name="activeIngredient" defaultValue={spec.activeIngredient} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">NPK Ratio</label>
            <input type="text" name="npkRatio" defaultValue={spec.npkRatio} placeholder="e.g. 19:19:19" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Suitable Crops</label>
            <input type="text" name="cropSuitability" defaultValue={initialData?.suitableCrops || spec.cropSuitability} placeholder="e.g. Paddy, Wheat" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Application Method</label>
            <input type="text" name="applicationMethod" defaultValue={spec.applicationMethod} placeholder="e.g. Foliar Spray" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Dosage & Usage Instructions</label>
            <textarea name="dosage" defaultValue={initialData?.dosage || spec.dosage} rows={2} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"></textarea>
          </div>
        </div>
      </section>
    </>
  );

  const renderRentalFields = () => (
    <>
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Machine Technical Specs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Brand *</label>
            <input required type="text" name="brand" defaultValue={spec.brand} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Model *</label>
            <input required type="text" name="model" defaultValue={spec.model} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Manufacturing Year</label>
            <input type="number" name="manufacturingYear" defaultValue={spec.manufacturingYear} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Engine HP</label>
            <input type="text" name="engineHp" defaultValue={spec.engineHp} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Fuel Type</label>
            <input type="text" name="fuelType" defaultValue={spec.fuelType} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Capacity / Dimensions</label>
            <input type="text" name="capacity" defaultValue={spec.capacity} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Rental Terms & Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Hourly Rate (₹)</label>
            <input type="number" name="rentalHourlyRate" defaultValue={spec.rentalHourlyRate} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Daily Rate (₹)</label>
            <input type="number" name="rentalDailyRate" defaultValue={spec.rentalDailyRate} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Security Deposit (₹)</label>
            <input type="number" name="securityDeposit" defaultValue={spec.securityDeposit} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
          
          <div className="md:col-span-2 pt-4 border-t border-gray-100 flex gap-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
              <input type="checkbox" name="operatorAvailable" value="true" defaultChecked={spec.operatorAvailable} className="w-4 h-4 text-indigo-600 rounded" />
              Operator Available
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
              <input type="checkbox" name="deliveryAvailable" value="true" defaultChecked={spec.deliveryAvailable} className="w-4 h-4 text-indigo-600 rounded" />
              Delivery Available
            </label>
          </div>
        </div>
      </section>
    </>
  );

  const renderSalesFields = () => (
    <>
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Machine Technical Specs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Brand *</label>
            <input required type="text" name="brand" defaultValue={spec.brand} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Model *</label>
            <input required type="text" name="model" defaultValue={spec.model} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Variant</label>
            <input type="text" name="variant" defaultValue={spec.variant} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Engine HP</label>
            <input type="text" name="engineHp" defaultValue={spec.engineHp} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Warranty Terms</label>
            <input type="text" name="warranty" defaultValue={spec.warranty} placeholder="e.g. 2 Years Manufacturer" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
        </div>
      </section>
      
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Value Added Services</h2>
        <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
              <input type="checkbox" name="deliveryAvailable" value="true" defaultChecked={spec.deliveryAvailable} className="w-4 h-4 text-indigo-600 rounded" />
              Delivery
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
              <input type="checkbox" name="installationAvailable" value="true" defaultChecked={spec.installationAvailable} className="w-4 h-4 text-indigo-600 rounded" />
              Installation Demo
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
              <input type="checkbox" name="financingAvailable" value="true" defaultChecked={spec.financingAvailable} className="w-4 h-4 text-indigo-600 rounded" />
              Financing / EMI
            </label>
        </div>
      </section>
    </>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/shop/products" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Products
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          {isEditing ? "Edit Product" : "Create New Product"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Fill out the details below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {/* BASIC INFO (Always visible) */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Product Name *</label>
              <input required type="text" name="name" defaultValue={initialData?.name} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Category *</label>
              <select required name="categoryId" defaultValue={initialData?.categoryId} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                <option value="">Select Category...</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {shopType !== "MACHINERY_RENTAL" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Selling Price (₹) *</label>
                  <input required type="number" step="0.01" name="price" defaultValue={initialData?.price} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Unit / Packaging</label>
                  <input type="text" name="unit" defaultValue={initialData?.unit} placeholder="e.g. 1 Bag, Piece, per Hour" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Stock Quantity</label>
                  <input type="number" name="stock" defaultValue={initialData?.stock ?? 1} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                </div>
              </>
            )}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Description</label>
              <textarea name="description" defaultValue={initialData?.description} rows={3} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm resize-none"></textarea>
            </div>
            {isEditing && (
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 cursor-pointer">
                  <input type="checkbox" name="isActive" value="true" defaultChecked={initialData?.isActive} className="w-4 h-4 text-indigo-600 rounded" />
                  Product is Active and Visible in Marketplace
                </label>
              </div>
            )}
          </div>
        </section>

        {/* SPECIFIC FIELDS */}
        {shopType === "FERTILIZER" && renderFertilizerFields()}
        {shopType === "MACHINERY_RENTAL" && renderRentalFields()}
        {shopType === "MACHINERY_SALES" && renderSalesFields()}

        <div className="flex justify-end gap-3 pt-4">
          <Link href="/shop/products" className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors">
            Cancel
          </Link>
          <button disabled={loading} type="submit" className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-70 transition-colors shadow-sm">
            {loading ? "Saving..." : <><Save className="w-4 h-4" /> {isEditing ? "Update Product" : "Create Product"}</>}
          </button>
        </div>
      </form>
    </div>
  );
}
