"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminProductSummary, AdminProductStats } from "@/actions/admin/admin-product-actions";

interface Props {
  initialProducts: AdminProductSummary[];
  initialStats: AdminProductStats | null;
  totalCount: number;
  pageCount: number;
  currentPage: number;
}

export function AdminProductsClient({ initialProducts, initialStats, totalCount, pageCount, currentPage }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [productType, setProductType] = useState(searchParams.get("productType") || "");
  const [activeStatus, setActiveStatus] = useState(searchParams.get("activeStatus") || "");
  const [stockStatus, setStockStatus] = useState(searchParams.get("stockStatus") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "newest");

  // Debounced Search Apply
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters({ search, productType, activeStatus, stockStatus, sortBy, page: 1 });
    }, 500);
    return () => clearTimeout(timer);
  }, [search]); // Only run on search string change (others are manual triggers)

  const applyFilters = (filters: any) => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.productType) params.set("productType", filters.productType);
    if (filters.activeStatus) params.set("activeStatus", filters.activeStatus);
    if (filters.stockStatus) params.set("stockStatus", filters.stockStatus);
    if (filters.sortBy && filters.sortBy !== "newest") params.set("sortBy", filters.sortBy);
    if (filters.page && filters.page > 1) params.set("page", filters.page.toString());

    router.push(`/admin/products?${params.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    let newFilters = { search, productType, activeStatus, stockStatus, sortBy, page: 1 } as any;
    newFilters[key] = value;
    
    if (key === "productType") setProductType(value);
    if (key === "activeStatus") setActiveStatus(value);
    if (key === "stockStatus") setStockStatus(value);
    if (key === "sortBy") setSortBy(value);

    applyFilters(newFilters);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      {initialStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard label="Total" value={initialStats.total} color="bg-gray-50 text-gray-900 border-gray-200" />
          <StatCard label="Active" value={initialStats.active} color="bg-emerald-50 text-emerald-900 border-emerald-200" />
          <StatCard label="Inactive" value={initialStats.inactive} color="bg-gray-100 text-gray-700 border-gray-300" />
          <StatCard label="Out of Stock" value={initialStats.outOfStock} color="bg-red-50 text-red-900 border-red-200" />
          <StatCard label="Fertilizers" value={initialStats.fertilizers} color="bg-blue-50 text-blue-900 border-blue-200" />
          <StatCard label="Rentals" value={initialStats.machineryRentals} color="bg-purple-50 text-purple-900 border-purple-200" />
          <StatCard label="Sales" value={initialStats.machinerySales} color="bg-indigo-50 text-indigo-900 border-indigo-200" />
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200/90 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-1">
          <input
            type="text"
            placeholder="Search Products..."
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <select value={productType} onChange={(e) => handleFilterChange("productType", e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg bg-white">
            <option value="">All Types</option>
            <option value="FERTILIZER">Fertilizers</option>
            <option value="MACHINERY_RENTAL">Machinery Rentals</option>
            <option value="MACHINERY_SALES">Machinery Sales</option>
          </select>
        </div>
        <div>
          <select value={activeStatus} onChange={(e) => handleFilterChange("activeStatus", e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg bg-white">
            <option value="">Status (All)</option>
            <option value="active">Active (Published)</option>
            <option value="inactive">Inactive (Hidden)</option>
          </select>
        </div>
        <div>
          <select value={stockStatus} onChange={(e) => handleFilterChange("stockStatus", e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg bg-white">
            <option value="">Stock (All)</option>
            <option value="in_stock">In Stock (&gt; 0)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>
        </div>
        <div>
          <select value={sortBy} onChange={(e) => handleFilterChange("sortBy", e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg bg-white">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price_desc">Highest Price</option>
            <option value="price_asc">Lowest Price</option>
            <option value="stock_desc">Highest Stock</option>
            <option value="stock_asc">Lowest Stock</option>
            <option value="name">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left w-10">Img</th>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Shop</th>
                <th className="px-4 py-3 text-left">Type & Category</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {initialProducts.length > 0 ? (
                initialProducts.map((product) => (
                  <tr key={product.id} className={`hover:bg-gray-50/80 transition-colors ${!product.isActive ? 'bg-gray-50/50' : ''}`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-8 h-8 rounded-md object-cover border border-gray-200" />
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-gray-400">
                          -
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap max-w-[200px] truncate">
                      <div className={`font-bold ${!product.isActive ? 'text-gray-500' : 'text-gray-900'}`}>{product.name}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600 truncate max-w-[150px]">
                      {product.shopName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-gray-700 text-xs">{product.productType.replace(/_/g, " ")}</div>
                      <div className="text-[10px] text-gray-500">{product.categoryName}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {product.isActive ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider bg-emerald-100 text-emerald-800 border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider bg-gray-100 text-gray-600 border-gray-300">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {product.stock <= 0 ? (
                        <span className="text-xs font-bold text-red-600">Out of stock</span>
                      ) : product.stock <= 5 ? (
                        <span className="text-xs font-bold text-amber-600">{product.stock} (Low)</span>
                      ) : (
                        <span className="text-xs font-bold text-gray-900">{product.stock}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <Link 
                        href={`/admin/products/${product.id}`}
                        className="inline-flex items-center justify-center px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded shadow hover:bg-gray-800 transition-colors"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    <div className="max-w-md mx-auto">
                      <h3 className="text-base font-bold text-gray-900 mb-1">No Products Found</h3>
                      <p className="text-xs text-gray-500">Try adjusting your filters or search term to find what you're looking for.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pageCount > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Showing <span className="font-bold text-gray-900">{initialProducts.length}</span> of <span className="font-bold text-gray-900">{totalCount}</span> products
            </span>
            <div className="flex gap-2">
              <button 
                disabled={currentPage <= 1}
                onClick={() => applyFilters({ search, productType, activeStatus, stockStatus, sortBy, page: currentPage - 1 })}
                className="px-3 py-1 border border-gray-300 rounded text-sm bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button 
                disabled={currentPage >= pageCount}
                onClick={() => applyFilters({ search, productType, activeStatus, stockStatus, sortBy, page: currentPage + 1 })}
                className="px-3 py-1 border border-gray-300 rounded text-sm bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className={`p-3 rounded-xl border ${color} flex flex-col justify-between`}>
      <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{label}</span>
      <span className="text-xl font-black mt-1">{value}</span>
    </div>
  );
}
