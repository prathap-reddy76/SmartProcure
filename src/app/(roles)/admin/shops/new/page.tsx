"use client";

import React, { useState } from "react";
import { adminCreateShop } from "@/actions/admin/shop-actions";
import { Leaf, Tractor, Wrench, ArrowLeft, Store, Save } from "lucide-react";

export default function AdminNewShopPage() {
  const [shopType, setShopType] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const shopTypes = [
    {
      id: "FERTILIZER",
      title: "Fertilizer & Agri Inputs",
      description: "Fertilizers, seeds, pesticides and other agricultural inputs.",
      icon: Leaf,
      color: "text-green-600",
      bg: "bg-green-50",
      borderColor: "border-green-200 hover:border-green-500",
    },
    {
      id: "MACHINERY_RENTAL",
      title: "Machinery Rental",
      description: "Agricultural machinery available for farmers to rent.",
      icon: Tractor,
      color: "text-amber-600",
      bg: "bg-amber-50",
      borderColor: "border-amber-200 hover:border-amber-500",
    },
    {
      id: "MACHINERY_SALES",
      title: "New Machinery Sales",
      description: "New agricultural machinery available for purchase.",
      icon: Wrench,
      color: "text-blue-600",
      bg: "bg-blue-50",
      borderColor: "border-blue-200 hover:border-blue-500",
    }
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      const email = formData.get("ownerEmail") as string;
      const pass = formData.get("ownerPassword") as string;
      const confirm = formData.get("confirmPassword") as string;

      if (pass !== confirm) {
         setError("Passwords do not match");
         setLoading(false);
         return;
      }

      await adminCreateShop(formData);
      // action will redirect on success
    } catch (err: any) {
      setError(err.message || "Failed to create shop");
      setLoading(false);
    }
  }

  if (!shopType) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 mt-10">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Choose Shop Type</h1>
          <p className="text-gray-500 text-base max-w-2xl mx-auto">Select the business category for the new shop. This determines the features and product types available to the shop owner.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {shopTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setShopType(type.id)}
              className={`text-left p-6 rounded-2xl border-2 transition-all duration-200 bg-white hover:shadow-lg ${type.borderColor} group`}
            >
              <div className={`w-14 h-14 rounded-xl ${type.bg} ${type.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <type.icon className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{type.title}</h2>
              <p className="text-sm text-gray-500 leading-relaxed">{type.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button 
        onClick={() => setShopType(null)}
        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Change Shop Type
      </button>

      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Create {shopTypes.find(t => t.id === shopType)?.title}</h1>
        <p className="text-sm text-gray-500 mt-1">Fill out the information below to register the shop and create the owner account.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {error && (
          <div className="mx-6 mt-6 p-4 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <input type="hidden" name="shopType" value={shopType} />

        <div className="p-6 md:p-8 space-y-8">
          {/* OWNER ACCOUNT INFO */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Owner Account Credentials</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Owner Full Name *</label>
                <input required type="text" name="ownerName" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Login Email *</label>
                <input required type="email" name="ownerEmail" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Password *</label>
                <input required type="password" name="ownerPassword" minLength={6} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Confirm Password *</label>
                <input required type="password" name="confirmPassword" minLength={6} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all" />
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* SHOP BASIC INFO */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Shop Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Shop Name *</label>
                <input required type="text" name="name" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Primary Phone *</label>
                <input required type="tel" name="phone" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Alternate Phone</label>
                <input type="tel" name="altPhone" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Description</label>
                <textarea name="description" rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all resize-none"></textarea>
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* LOCATION */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Full Address *</label>
                <input required type="text" name="address" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Village/Town *</label>
                <input required type="text" name="village" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">District *</label>
                <input required type="text" name="district" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">State *</label>
                <input required type="text" name="state" defaultValue="Andhra Pradesh" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Pincode *</label>
                <input required type="text" name="pincode" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Latitude (Optional)</label>
                <input type="number" step="any" min="-90" max="90" name="latitude" placeholder="e.g. 17.3850" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Longitude (Optional)</label>
                <input type="number" step="any" min="-180" max="180" name="longitude" placeholder="e.g. 78.4867" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all" />
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />
          
          {/* BUSINESS INFO */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Business Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">GST Number</label>
                <input type="text" name="gstNumber" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Registration/License #</label>
                <input type="text" name="licenseNumber" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all" />
              </div>
            </div>
          </section>
        </div>
        
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button type="button" onClick={() => setShopType(null)} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button disabled={loading} type="submit" className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-70 transition-colors shadow-sm">
            {loading ? "Creating..." : <><Save className="w-4 h-4" /> Create Shop & Owner</>}
          </button>
        </div>
      </form>
    </div>
  );
}
