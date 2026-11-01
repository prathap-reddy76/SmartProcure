"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleAdminProductStatus } from "@/actions/admin/admin-product-actions";

export function AdminProductDetailClient({ product }: { product: any }) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
  };

  const handleToggleStatus = async () => {
    setIsUpdating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const newStatus = !product.isActive;
    const res = await toggleAdminProductStatus(product.id, newStatus);
    
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg(`Product successfully ${newStatus ? 'activated' : 'deactivated'}`);
      router.refresh();
      setTimeout(() => setSuccessMsg(null), 3000);
    }
    
    setIsUpdating(false);
  };

  const specData = product.specifications || {};

  return (
    <div className="space-y-6">
      {errorMsg && <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-semibold border border-red-200">{errorMsg}</div>}
      {successMsg && <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm font-semibold border border-green-200">{successMsg}</div>}
      
      {/* Overview & Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 flex flex-col md:flex-row gap-6 justify-between items-start">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-black text-gray-900">{product.name}</h2>
            {product.isActive ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider bg-emerald-100 text-emerald-800 border-emerald-200">
                Active
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider bg-gray-100 text-gray-600 border-gray-300">
                Inactive
              </span>
            )}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider bg-purple-100 text-purple-800 border-purple-200">
              {product.productType.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-sm text-gray-600 max-w-2xl">{product.description || "No description provided."}</p>
        </div>

        <div>
          <button
            onClick={handleToggleStatus}
            disabled={isUpdating}
            className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50 ${
              product.isActive 
                ? "bg-white border border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200" 
                : "bg-gray-900 text-white hover:bg-gray-800"
            }`}
          >
            {isUpdating ? "Updating..." : product.isActive ? "Deactivate Product" : "Activate Product"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Commercial & Inventory */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Commercial & Inventory</h3>
          <div className="text-sm space-y-2">
            <div className="flex justify-between border-b border-gray-50 pb-1">
              <span className="text-gray-500">Selling Price:</span> 
              <span className="font-bold text-gray-900">{formatPrice(Number(product.price))}</span>
            </div>
            {specData.mrp && (
              <div className="flex justify-between border-b border-gray-50 pb-1">
                <span className="text-gray-500">MRP:</span> 
                <span className="font-semibold text-gray-700">{formatPrice(Number(specData.mrp))}</span>
              </div>
            )}
            {product.unit && (
              <div className="flex justify-between border-b border-gray-50 pb-1">
                <span className="text-gray-500">Unit:</span> 
                <span className="font-semibold text-gray-700">{product.unit}</span>
              </div>
            )}
            <div className="flex justify-between border-b border-gray-50 pb-1">
              <span className="text-gray-500">Current Stock:</span> 
              <span className={`font-bold ${product.stock <= 0 ? 'text-red-600' : product.stock <= 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {product.stock} {product.stock <= 0 ? '(Out of stock)' : product.stock <= 5 ? '(Low stock)' : ''}
              </span>
            </div>
            {specData.minStock && (
              <div className="flex justify-between border-b border-gray-50 pb-1">
                <span className="text-gray-500">Minimum Stock Threshold:</span> 
                <span className="font-semibold text-gray-700">{specData.minStock}</span>
              </div>
            )}
          </div>
        </div>

        {/* Shop Info */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Ownership</h3>
          <div className="text-sm space-y-2">
            <div className="flex justify-between border-b border-gray-50 pb-1">
              <span className="text-gray-500">Shop Name:</span> 
              <span className="font-bold text-gray-900">{product.shop.name}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-1">
              <span className="text-gray-500">Shop Type:</span> 
              <span className="font-semibold text-gray-700">{product.shop.shopType}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-1">
              <span className="text-gray-500">Shop Phone:</span> 
              <span className="font-semibold text-gray-700">{product.shop.phone || "N/A"}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-1 mt-4 pt-4">
              <span className="text-gray-500">Total Order Lines:</span> 
              <span className="font-bold text-indigo-600">{product._count?.orderItems || 0}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-1">
              <span className="text-gray-500">Total Cart Items:</span> 
              <span className="font-bold text-indigo-600">{product._count?.cartItems || 0}</span>
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4 lg:col-span-1 md:col-span-2">
          <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Specifications</h3>
          
          <div className="text-sm space-y-2">
            <div className="flex justify-between border-b border-gray-50 pb-1">
              <span className="text-gray-500">Category:</span> 
              <span className="font-bold text-gray-900">{product.category.name}</span>
            </div>
            {product.suitableCrops && (
              <div className="flex flex-col border-b border-gray-50 pb-1">
                <span className="text-gray-500 text-xs">Suitable Crops:</span> 
                <span className="font-semibold text-gray-700">{product.suitableCrops}</span>
              </div>
            )}
            
            {/* Dynamic Rendering of Custom JSON Specs */}
            {Object.entries(specData).map(([key, value]) => {
              if (!value || key === 'mrp' || key === 'minStock') return null;
              
              // Formatting key (camelCase to Title Case)
              const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              
              return (
                <div key={key} className="flex flex-col border-b border-gray-50 pb-1">
                  <span className="text-gray-500 text-xs">{formattedKey}:</span> 
                  <span className="font-semibold text-gray-700">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Product Images */}
      {product.images && product.images.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Product Images</h3>
          <div className="flex flex-wrap gap-4">
            {product.images.map((img: any) => (
              <div key={img.id} className="relative w-32 h-32 rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <img src={img.imageUrl} alt={img.altText || product.name} className="object-cover w-full h-full" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
