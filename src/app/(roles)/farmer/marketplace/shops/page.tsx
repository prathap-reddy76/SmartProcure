import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import { getMarketplaceShops } from "@/actions/marketplace/shop-discovery-actions";
import { ShopSearch } from "./components/shop-search";
import { ShopCard } from "./components/shop-card";
import { StoreIcon } from "@/components/ui/icons";

export default async function FarmerShopsDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole("FARMER");
  const params = await searchParams;

  const { shops, total, totalPages, currentPage } = await getMarketplaceShops(params);

  const activeSearch = typeof params.search === "string" ? params.search : undefined;
  const activeDistrict = typeof params.district === "string" ? params.district : undefined;

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb / Header */}
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <Link href="/farmer/marketplace" className="hover:text-green-800 transition-colors">
          Marketplace
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-bold">Verified Agro-Dealer Shops</span>
      </div>

      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/60 text-emerald-200 text-xs font-semibold mb-3 border border-emerald-600/40">
            <StoreIcon className="w-4 h-4 text-emerald-300" />
            Verified Agro-Dealer Network
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Browse Agricultural Shops
          </h1>
          <p className="mt-2 text-emerald-100 text-sm sm:text-base leading-relaxed">
            Select a verified local shop in your district to purchase seeds, fertilizers, and farming supplies directly from the dealer with transparent pricing and fast fulfillment.
          </p>
        </div>
      </div>

      {/* Search & Location Filter */}
      <ShopSearch />

      {/* Results Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-200">
        <div className="text-sm font-semibold text-gray-800">
          Showing <span className="font-bold text-green-900">{shops.length}</span> of{" "}
          <span className="font-bold text-green-900">{total}</span>{" "}
          {total === 1 ? "Shop" : "Shops"}
          {activeDistrict && (
            <span className="text-gray-500 font-normal"> in {activeDistrict}</span>
          )}
          {activeSearch && (
            <span className="text-gray-500 font-normal"> matching &ldquo;{activeSearch}&rdquo;</span>
          )}
        </div>

        {(activeSearch || activeDistrict) && (
          <Link
            href="/farmer/marketplace/shops"
            className="text-xs font-semibold text-green-700 hover:text-green-900 underline"
          >
            Clear all filters
          </Link>
        )}
      </div>

      {/* Shops Grid or Empty State */}
      {shops.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {shops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-8 sm:p-12 text-center max-w-md mx-auto my-8">
          <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <StoreIcon className="w-7 h-7 text-gray-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            {activeSearch || activeDistrict ? "No shops found matching your search." : "No shops available yet."}
          </h2>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            {activeSearch || activeDistrict
              ? "Try adjusting your search terms or clearing your location filter to view all available agro-dealers."
              : "Verified agro-dealers and shops will appear here as soon as they are registered by the platform administration."}
          </p>
          {(activeSearch || activeDistrict) && (
            <Link
              href="/farmer/marketplace/shops"
              className="inline-flex items-center px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              Clear Search Filters
            </Link>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pt-6 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={`/farmer/marketplace/shops?${new URLSearchParams({
                  ...(params as Record<string, string>),
                  page: String(currentPage - 1),
                }).toString()}`}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 font-semibold"
              >
                &larr; Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/farmer/marketplace/shops?${new URLSearchParams({
                  ...(params as Record<string, string>),
                  page: String(currentPage + 1),
                }).toString()}`}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 font-semibold"
              >
                Next &rarr;
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
