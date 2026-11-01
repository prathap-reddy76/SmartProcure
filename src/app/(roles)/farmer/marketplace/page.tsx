import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import { getMarketplaceCategories } from "@/actions/marketplace/category-actions";
import { getMarketplaceProducts } from "@/actions/marketplace/product-actions";
import { ProductCard } from "./components/product-card";
import { CategoryFilter } from "./components/category-filter";
import { ProductSearch } from "./components/product-search";
import { ProductFilters } from "./components/product-filters";
import { MarketIcon, StoreIcon } from "@/components/ui/icons";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole("FARMER");
  const params = await searchParams;

  const [categories, productResult] = await Promise.all([
    getMarketplaceCategories(),
    getMarketplaceProducts(params),
  ]);

  const { products, total, totalPages, currentPage } = productResult;

  const activeCategorySlug = typeof params.category === "string" ? params.category : undefined;
  const activeSearch = typeof params.search === "string" ? params.search : undefined;
  const activeCategory = categories.find((c) => c.slug === activeCategorySlug);

  return (
    <div className="space-y-6">
      {/* Banner & Browse Shops CTA */}
      <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/60 text-emerald-200 text-xs font-semibold mb-3 border border-emerald-600/40">
            <MarketIcon className="w-4 h-4 text-emerald-300" />
            Direct Agricultural Marketplace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Agricultural Marketplace
          </h1>
          <p className="mt-2 text-emerald-100 text-sm sm:text-base leading-relaxed">
            Browse certified seeds, organic & mineral fertilizers, crop protection, and farming equipment from verified local agro-dealers.
          </p>
        </div>

        {/* Shop Discovery Card */}
        <div className="shrink-0 bg-white/10 backdrop-blur-xs p-4 sm:p-5 rounded-2xl border border-white/20 flex flex-col items-start gap-2.5 w-full md:w-72">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
              <StoreIcon className="w-5 h-5 text-emerald-200" />
            </div>
            <span className="font-bold text-sm text-white">Buy by Shop?</span>
          </div>
          <p className="text-xs text-emerald-100 leading-normal">
            Browse verified agro-dealers in your district with dedicated shop storefronts.
          </p>
          <Link
            href="/farmer/marketplace/shops"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-green-800 hover:bg-emerald-50 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <span>Browse Shops</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </div>

      {/* Search & Top Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <ProductSearch />
      </div>

      {/* Horizontal Category Selector */}
      <CategoryFilter categories={categories} />

      {/* Main Catalog View: Sidebar Filters + Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left Filter Sidebar */}
        <div className="md:col-span-1 md:sticky md:top-20">
          <ProductFilters />
        </div>

        {/* Right Product Grid */}
        <div className="md:col-span-3 space-y-4">
          {/* Header Status & Active Filter Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-200">
            <div className="text-sm font-semibold text-gray-800">
              Showing <span className="font-bold text-green-900">{products.length}</span> of{" "}
              <span className="font-bold text-green-900">{total}</span>{" "}
              {total === 1 ? "Product" : "Products"}
              {activeCategory && (
                <span className="text-gray-500 font-normal"> in {activeCategory.name}</span>
              )}
              {activeSearch && (
                <span className="text-gray-500 font-normal"> matching &ldquo;{activeSearch}&rdquo;</span>
              )}
            </div>

            {(activeCategorySlug || activeSearch || params.minPrice || params.maxPrice) && (
              <Link
                href="/farmer/marketplace"
                className="text-xs font-semibold text-green-700 hover:text-green-900 underline"
              >
                Clear all filters
              </Link>
            )}
          </div>

          {/* Products Grid or Empty State */}
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            /* Empty State as specified in Section 29 */
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-8 sm:p-12 text-center max-w-md mx-auto my-8">
              <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <MarketIcon className="w-7 h-7 text-gray-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                {params.productType === 'FERTILIZER' 
                  ? 'No fertilizers found matching your filters.' 
                  : params.productType === 'MACHINERY_RENTAL' 
                    ? 'No machinery rentals found.' 
                    : params.productType === 'MACHINERY_SALES'
                      ? 'No machinery sales found.'
                      : activeSearch 
                        ? 'No products match your search.'
                        : 'No products found'}
              </h2>
              <p className="text-xs text-gray-500 mb-6">
                Try changing your search terms, adjusting price bounds, or clearing your selected filters.
              </p>
              <Link
                href="/farmer/marketplace"
                className="inline-flex items-center px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
              >
                Clear All Filters
              </Link>
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
                    href={`/farmer/marketplace?${new URLSearchParams({
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
                    href={`/farmer/marketplace?${new URLSearchParams({
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
      </div>
    </div>
  );
}
