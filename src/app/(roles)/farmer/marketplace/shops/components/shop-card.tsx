import React from "react";
import Link from "next/link";
import { MarketplaceShopItem } from "@/actions/marketplace/shop-discovery-actions";
import { StoreIcon } from "@/components/ui/icons";

export function ShopCard({ shop }: { shop: MarketplaceShopItem }) {
  // Format location
  const locationParts = [shop.village, shop.district, shop.state].filter(Boolean);
  const locationDisplay = locationParts.length > 0 ? locationParts.join(", ") : "Local Agro Dealer";

  // Pretty format shop type
  let shopTypeLabel = "Seeds & Fertilizers";
  let badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-200/80";

  if (shop.shopType === "MACHINERY_RENTAL") {
    shopTypeLabel = "Machinery & Equipment Rental";
    badgeColor = "bg-amber-50 text-amber-800 border-amber-200/80";
  } else if (shop.shopType === "MACHINERY_SALES") {
    shopTypeLabel = "Farm Machinery Sales";
    badgeColor = "bg-blue-50 text-blue-800 border-blue-200/80";
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs hover:shadow-md hover:border-green-300 transition-all flex flex-col justify-between overflow-hidden group p-5 sm:p-6">
      <div className="space-y-3">
        {/* Header Icon & Shop Type Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200/70 flex items-center justify-center text-green-700 shadow-2xs group-hover:scale-105 transition-transform">
            <StoreIcon className="w-6 h-6" />
          </div>
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-2xs uppercase tracking-wider ${badgeColor}`}
          >
            {shopTypeLabel}
          </span>
        </div>

        {/* Shop Name */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-800 transition-colors leading-snug">
            {shop.name}
          </h3>
          {shop.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
              {shop.description}
            </p>
          )}
        </div>

        {/* Location & Details */}
        <div className="pt-2 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-gray-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="truncate font-medium text-gray-700">{locationDisplay}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-emerald-600 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <span className="font-semibold text-gray-800">
              {shop.productCount} {shop.productCount === 1 ? "Product" : "Products"} Available
            </span>
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="pt-5 mt-4 border-t border-gray-100 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-green-700 group-hover:text-green-800 transition-colors">
          Direct from dealer
        </span>
        <Link
          href={`/farmer/marketplace/shops/${shop.id}`}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs group-hover:shadow-sm"
        >
          <span>View Shop</span>
          <span>&rarr;</span>
        </Link>
      </div>
    </div>
  );
}
