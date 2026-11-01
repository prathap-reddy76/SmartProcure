import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import {
  getShopStorefront,
  getShopCategories,
  getShopStorefrontProducts,
} from "@/actions/marketplace/shop-discovery-actions";
import { StorefrontFilters } from "./components/storefront-filters";
import { StorefrontProductCard } from "./components/storefront-product-card";
import { StoreIcon, MarketIcon } from "@/components/ui/icons";

export default async function FarmerShopStorefrontPage({
  params,
  searchParams,
}: {
  params: Promise<{ shopId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole("FARMER");
  const { shopId } = await params;
  const queryParams = await searchParams;

  // 1. Fetch Authoritative Shop Details
  const { shop, error: shopError } = await getShopStorefront(shopId);

  if (!shop || shopError) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-8 sm:p-12 text-center max-w-md mx-auto my-12">
        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <StoreIcon className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Shop Not Available</h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          The requested agricultural shop could not be found, or has been temporarily deactivated by platform administration.
        </p>
        <Link
          href="/farmer/marketplace/shops"
          className="inline-flex items-center px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          &larr; Back to Shop Directory
        </Link>
      </div>
    );
  }

  // 2. Fetch scoped categories and scoped products concurrently
  const [categories, productsResult] = await Promise.all([
    getShopCategories(shop.id),
    getShopStorefrontProducts(shop.id, queryParams),
  ]);

  const { products, total, totalPages, currentPage } = productsResult;

  const activeCategorySlug = typeof queryParams.category === "string" ? queryParams.category : undefined;
  const activeSearch = typeof queryParams.search === "string" ? queryParams.search : undefined;
  const activeCategory = categories.find((c) => c.slug === activeCategorySlug);

  const locationParts = [shop.address, shop.village, shop.district, shop.state].filter(Boolean);
  const fullLocation = locationParts.length > 0 ? locationParts.join(", ") : "Local Agro Dealer";

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <Link href="/farmer/marketplace" className="hover:text-green-800 transition-colors">
          Marketplace
        </Link>
        <span>/</span>
        <Link href="/farmer/marketplace/shops" className="hover:text-green-800 transition-colors">
          Shops
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-bold truncate max-w-xs">{shop.name}</span>
      </div>

      {/* Storefront Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200/80 flex items-center justify-center text-green-700 shadow-xs shrink-0">
              <StoreIcon className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  {shop.name}
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                  Verified Dealer
                </span>
              </div>

              {shop.description && (
                <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
                  {shop.description}
                </p>
              )}

              <div className="pt-2 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{fullLocation}</span>
                </div>

                {shop.phone && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{shop.phone}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="font-semibold text-gray-700">
                    {shop.productCount} Total Products Available
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 self-start md:self-center">
            <Link
              href="/farmer/marketplace/shops"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors shadow-2xs"
            >
              <span>&larr;</span>
              <span>All Shops</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Storefront Product Filters & Search */}
      <StorefrontFilters shopId={shop.id} categories={categories} />

      {/* Results Header Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-200">
        <div className="text-sm font-semibold text-gray-800">
          Showing <span className="font-bold text-green-900">{products.length}</span> of{" "}
          <span className="font-bold text-green-900">{total}</span>{" "}
          {total === 1 ? "Product" : "Products"} in this Storefront
          {activeCategory && (
            <span className="text-gray-500 font-normal"> &bull; {activeCategory.name}</span>
          )}
          {activeSearch && (
            <span className="text-gray-500 font-normal"> &bull; matching &ldquo;{activeSearch}&rdquo;</span>
          )}
        </div>

        {(activeCategorySlug || activeSearch || queryParams.availability) && (
          <Link
            href={`/farmer/marketplace/shops/${shop.id}`}
            className="text-xs font-semibold text-green-700 hover:text-green-900 underline"
          >
            Clear store filters
          </Link>
        )}
      </div>

      {/* Products Grid or Empty State */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map((product) => (
            <StorefrontProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-8 sm:p-12 text-center max-w-md mx-auto my-8">
          <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <MarketIcon className="w-7 h-7 text-gray-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            {activeSearch || activeCategorySlug
              ? "No products found in this shop."
              : "This shop has no products available right now."}
          </h2>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            {activeSearch || activeCategorySlug
              ? "Try adjusting your search terms or selecting another category to see available items."
              : "The shop owner has not listed any active inventory yet. Please check back later or explore other verified shops."}
          </p>
          {(activeSearch || activeCategorySlug) ? (
            <Link
              href={`/farmer/marketplace/shops/${shop.id}`}
              className="inline-flex items-center px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              Clear Filters
            </Link>
          ) : (
            <Link
              href="/farmer/marketplace/shops"
              className="inline-flex items-center px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              Browse Other Shops
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
                href={`/farmer/marketplace/shops/${shop.id}?${new URLSearchParams({
                  ...(queryParams as Record<string, string>),
                  page: String(currentPage - 1),
                }).toString()}`}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 font-semibold"
              >
                &larr; Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/farmer/marketplace/shops/${shop.id}?${new URLSearchParams({
                  ...(queryParams as Record<string, string>),
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
