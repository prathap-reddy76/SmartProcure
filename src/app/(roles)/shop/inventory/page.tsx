import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import React from "react";
import Link from "next/link";
import { getShopInventory } from "@/actions/shop/shop-actions";
import { InventoryIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function ShopInventoryPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const qParams = await searchParams;
  const page = parseInt(qParams.page || "1", 10) || 1;
  const { items, total, totalPages, currentPage } = await getShopInventory({ page, limit: 12 });

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Get global inventory counts directly from DB
  
  const session = await requireRole("SHOP_OWNER");
  const shop = await prisma.shop.findUnique({ where: { userId: session.user?.id as string } });
  
  const [totalCount, outOfStockCount, lowStockCount] = await Promise.all([
    prisma.product.count({ where: { shopId: shop!.id } }),
    prisma.product.count({ where: { shopId: shop!.id, stock: 0 } }),
    prisma.product.count({ where: { shopId: shop!.id, stock: { gt: 0, lte: 10 } } })
  ]);
  const inStockCount = totalCount - outOfStockCount - lowStockCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
          <InventoryIcon className="w-4 h-4" />
          <span>Warehouse & Stock Visibility</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Inventory Stock Levels
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Real-time stock monitoring synchronized with customer order deductions and cancellations.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs">
          <span className="text-xs font-semibold text-gray-400 block mb-1">Total SKUs</span>
          <div className="text-2xl font-black text-gray-900">{totalCount}</div>
          <span className="text-[11px] text-gray-500">Tracked items</span>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200/80 p-5 shadow-2xs bg-linear-to-b from-white to-emerald-50/20">
          <span className="text-xs font-semibold text-emerald-600 block mb-1">In Stock</span>
          <div className="text-2xl font-black text-emerald-700">{inStockCount}</div>
          <span className="text-[11px] text-emerald-600">&gt; 10 units available</span>
        </div>

        <div className="bg-white rounded-2xl border border-amber-200/80 p-5 shadow-2xs bg-linear-to-b from-white to-amber-50/20">
          <span className="text-xs font-semibold text-amber-600 block mb-1">Low Stock Alert</span>
          <div className="text-2xl font-black text-amber-700">{lowStockCount}</div>
          <span className="text-[11px] text-amber-600">≤ 10 units remaining</span>
        </div>

        <div className="bg-white rounded-2xl border border-red-200/80 p-5 shadow-2xs bg-linear-to-b from-white to-red-50/20">
          <span className="text-xs font-semibold text-red-600 block mb-1">Out of Stock</span>
          <div className="text-2xl font-black text-red-700">{outOfStockCount}</div>
          <span className="text-[11px] text-red-600">0 units (Blocked in store)</span>
        </div>
      </div>

      {/* Inventory Table */}
      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/90 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <InventoryIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Inventory Items</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Your store catalog does not have any products linked yet.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="py-3.5 px-4 sm:px-6">Product / SKU</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Unit Price</th>
                  <th className="py-3.5 px-4 text-center">Current Quantity</th>
                  <th className="py-3.5 px-4 text-center">Availability Status</th>
                  <th className="py-3.5 px-4 sm:pr-6 text-right">Product Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="space-y-0.5">
                        <span className="font-bold text-gray-900 block text-sm">
                          {item.name}
                        </span>
                        <span className="text-gray-500 text-[11px]">
                          Package: {item.packageSize || item.unit || "Standard Unit"}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 font-semibold rounded-lg text-[11px]">
                        {item.categoryName}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right font-black text-gray-900 text-sm">
                      {formatPrice(item.price)}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span
                        className={`font-black text-base ${
                          item.stockStatus === "OUT_OF_STOCK"
                            ? "text-red-600"
                            : item.stockStatus === "LOW_STOCK"
                            ? "text-amber-600"
                            : "text-emerald-700"
                        }`}
                      >
                        {item.stock}
                      </span>
                      <span className="text-gray-400 text-[10px] block font-medium">units</span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                          item.stockStatus === "OUT_OF_STOCK"
                            ? "bg-red-50 text-red-800 border-red-200"
                            : item.stockStatus === "LOW_STOCK"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.stockStatus === "OUT_OF_STOCK"
                              ? "bg-red-500"
                              : item.stockStatus === "LOW_STOCK"
                              ? "bg-amber-500 animate-pulse"
                              : "bg-emerald-500"
                          }`}
                        />
                        {item.stockStatus.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="py-4 px-4 sm:pr-6 text-right">
                      <Link
                        href={`/farmer/marketplace/${item.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
                      >
                        <span>View</span>
                        <span className="text-[10px]">↗</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Boundary & Policy Banner */}
      <div className="p-4 bg-gray-50 border border-gray-200/80 rounded-2xl text-xs text-gray-500 flex items-center justify-between">
        <span>
          💡 <strong>Live Inventory Sync:</strong> Stock updates dynamically when customers place or cancel orders. Direct manual stock adjustments are locked during active ordering.
        </span>
        <Link href="/shop/orders" className="text-emerald-700 font-bold hover:underline shrink-0 ml-4">
          View Pending Orders →
        </Link>
      
      {totalPages > 1 && (
        <div className="flex justify-center py-6 gap-2">
          {currentPage > 1 && (
            <Link href={`/shop/inventory?page=${currentPage - 1}`} className="px-4 py-2 border rounded hover:bg-gray-50 bg-white">Previous</Link>
          )}
          <span className="px-4 py-2 text-sm font-semibold text-gray-500">Page {currentPage} of {totalPages}</span>
          {currentPage < totalPages && (
            <Link href={`/shop/inventory?page=${currentPage + 1}`} className="px-4 py-2 border rounded hover:bg-gray-50 bg-white">Next</Link>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
