import React from "react";
import Link from "next/link";
import Image from "next/image";
import { MarketplaceProductItem } from "@/actions/marketplace/product-actions";
import { CheckCircleIcon } from "@/components/ui/icons";
import { AddToCartButton } from "./add-to-cart-button";

export function ProductCard({ product }: { product: MarketplaceProductItem }) {
  const isInStock = product.stock > 0;
  
  let priceDisplay = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(product.price);

  const spec = product.specifications || {};

  let unitDisplay = product.unit ? `per ${product.unit}` : "";
  if (product.productType === "MACHINERY_RENTAL") {
    if (spec.rentalDailyRate) {
      priceDisplay = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(spec.rentalDailyRate);
      unitDisplay = "per day";
    } else if (spec.rentalHourlyRate) {
      priceDisplay = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(spec.rentalHourlyRate);
      unitDisplay = "per hour";
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs hover:shadow-md hover:border-green-300 transition-all flex flex-col justify-between overflow-hidden group">
      <div>
        {/* Product Image Container */}
        <div className="relative w-full h-44 sm:h-48 bg-gray-100 overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Availability pill badge on image */}
          <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5">
            {isInStock ? (
              <span className="inline-flex items-center gap-1 bg-emerald-600/95 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs backdrop-blur-xs">
                <CheckCircleIcon className="w-3 h-3 text-emerald-200" />
                In Stock
              </span>
            ) : (
              <span className="bg-gray-800/90 text-gray-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs backdrop-blur-xs">
                Out of Stock
              </span>
            )}
            
            {/* TYPE BADGE */}
            {product.productType === "MACHINERY_RENTAL" && (
              <span className="bg-amber-600/95 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs backdrop-blur-xs uppercase tracking-wider">
                Rental
              </span>
            )}
            {product.productType === "MACHINERY_SALES" && (
              <span className="bg-blue-600/95 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs backdrop-blur-xs uppercase tracking-wider">
                Sales
              </span>
            )}
          </div>
          {/* Category Tag on bottom left */}
          <div className="absolute bottom-2.5 left-2.5">
            <span className="bg-white/90 text-gray-900 font-semibold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded shadow-xs backdrop-blur-xs border border-white/40">
              {product.category.name}
            </span>
          </div>
        </div>

        {/* Content details */}
        <div className="p-4 space-y-2">
          {/* Title */}
          <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-green-800 transition-colors">
            {product.name}
          </h3>

          {/* Seller / Shop */}
          <p className="text-xs text-gray-500 truncate flex items-center gap-1">
            <span className="text-gray-400">Sold by:</span>
            <Link
              href={`/farmer/marketplace/shops/${product.shop.id}`}
              className="font-semibold text-green-700 hover:text-green-900 hover:underline transition-colors"
            >
              {product.shop.name}
            </Link>
          </p>

          {/* Highlights */}
          <div className="space-y-1 mt-2">
            {spec.brand && (
              <p className="text-[11px] text-gray-700 bg-gray-50/80 px-2 py-0.5 rounded border border-gray-100 inline-block mr-1">
                <span className="font-semibold">Brand:</span> {spec.brand}
              </p>
            )}
            {product.productType === "FERTILIZER" && spec.npkRatio && (
              <p className="text-[11px] text-green-800 bg-green-50/80 px-2 py-0.5 rounded border border-green-100 inline-block mr-1">
                <span className="font-semibold">NPK:</span> {spec.npkRatio}
              </p>
            )}
            {product.productType === "FERTILIZER" && product.suitableCrops && (
              <p className="text-[11px] text-green-800 bg-green-50/80 px-2 py-0.5 rounded border border-green-100 inline-block line-clamp-1">
                <span className="font-semibold">Crops:</span> {product.suitableCrops}
              </p>
            )}
            {product.productType === "MACHINERY_RENTAL" && spec.engineHp && (
              <p className="text-[11px] text-amber-800 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-100 inline-block mr-1">
                <span className="font-semibold">Engine:</span> {spec.engineHp} HP
              </p>
            )}
            {product.productType === "MACHINERY_SALES" && spec.warranty && (
              <p className="text-[11px] text-blue-800 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100 inline-block mr-1">
                <span className="font-semibold">Warranty:</span> {spec.warranty}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer: Price, View Details & Add to Cart Action */}
      <div className="p-4 pt-2 border-t border-gray-100 flex items-center justify-between gap-2 mt-auto">
        <div>
          <div className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
            {priceDisplay}
          </div>
          {unitDisplay && (
            <span className="text-[11px] text-gray-500 font-medium block -mt-0.5">
              {unitDisplay}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href={`/farmer/marketplace/${product.slug || product.id}`}
            className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all shadow-2xs"
          >
            Details
          </Link>
          <AddToCartButton productId={product.id} stock={product.stock} compact={true} />
        </div>
      </div>
    </div>
  );
}
