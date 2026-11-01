"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { StorefrontProductItem } from "@/actions/marketplace/shop-discovery-actions";
import { addToCart } from "@/actions/cart/cart-actions";
import { CartIcon, CheckCircleIcon } from "@/components/ui/icons";

export function StorefrontProductCard({
  product,
}: {
  product: StorefrontProductItem;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const isInStock = product.stock > 0;

  const priceDisplay = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(product.price);

  const unitDisplay = product.unit ? `per ${product.unit}` : "";
  const spec = (product.specifications as Record<string, string | number | undefined>) || {};

  const handleDecrease = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncrease = () => {
    setQuantity((prev) => Math.min(product.stock, prev + 1));
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isInStock || isPending) return;

    setIsPending(true);
    setFeedback(null);

    const res = await addToCart(product.id, quantity);
    setIsPending(false);

    if (res.error) {
      setFeedback({ type: "error", text: res.error });
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback({ type: "success", text: `Added ${quantity} unit(s) to cart!` });
      router.refresh();
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs hover:shadow-md hover:border-green-300 transition-all flex flex-col justify-between overflow-hidden group">
      <div>
        {/* Product Image */}
        <div className="relative w-full h-44 sm:h-48 bg-gray-100 overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Availability badge */}
          <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5">
            {isInStock ? (
              <span className="inline-flex items-center gap-1 bg-emerald-600/95 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs backdrop-blur-xs">
                <CheckCircleIcon className="w-3 h-3 text-emerald-200" />
                In Stock ({product.stock})
              </span>
            ) : (
              <span className="bg-gray-800/90 text-gray-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs backdrop-blur-xs">
                Out of Stock
              </span>
            )}
          </div>

          {/* Category Tag */}
          <div className="absolute bottom-2.5 left-2.5">
            <span className="bg-white/90 text-gray-900 font-semibold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded shadow-xs backdrop-blur-xs border border-white/40">
              {product.category.name}
            </span>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-4 space-y-2">
          <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-green-800 transition-colors">
            {product.name}
          </h3>

          {product.description && (
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Specifications Pills */}
          <div className="space-y-1 mt-2">
            {spec.brand && (
              <p className="text-[11px] text-gray-700 bg-gray-50/80 px-2 py-0.5 rounded border border-gray-100 inline-block mr-1">
                <span className="font-semibold">Brand:</span> {String(spec.brand)}
              </p>
            )}
            {product.variety && (
              <p className="text-[11px] text-green-800 bg-green-50/80 px-2 py-0.5 rounded border border-green-100 inline-block mr-1">
                <span className="font-semibold">Variety:</span> {product.variety}
              </p>
            )}
            {product.packageSize && (
              <p className="text-[11px] text-gray-700 bg-gray-50/80 px-2 py-0.5 rounded border border-gray-100 inline-block mr-1">
                <span className="font-semibold">Pack:</span> {product.packageSize}
              </p>
            )}
            {product.suitableCrops && (
              <p className="text-[11px] text-green-800 bg-green-50/80 px-2 py-0.5 rounded border border-green-100 inline-block line-clamp-1">
                <span className="font-semibold">Crops:</span> {product.suitableCrops}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer: Price, Quantity Selector & Add to Cart */}
      <div className="p-4 pt-3 border-t border-gray-100 space-y-3 mt-auto bg-gray-50/40">
        <div className="flex items-baseline justify-between">
          <span className="text-lg font-black text-gray-900 tracking-tight">
            {priceDisplay}
          </span>
          {unitDisplay && (
            <span className="text-[11px] text-gray-500 font-medium">
              {unitDisplay}
            </span>
          )}
        </div>

        {/* Quantity Selector + Add Button */}
        {isInStock ? (
          <div className="relative space-y-2">
            <div className="flex items-center gap-2">
              {/* Stepper */}
              <div className="inline-flex items-center border border-gray-300 rounded-xl bg-white shadow-2xs overflow-hidden">
                <button
                  type="button"
                  onClick={handleDecrease}
                  disabled={quantity <= 1 || isPending}
                  className="px-2.5 py-1.5 text-sm font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="px-3 py-1.5 text-xs font-bold text-gray-900 min-w-8 text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrease}
                  disabled={quantity >= product.stock || isPending}
                  className="px-2.5 py-1.5 text-sm font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              {/* Add to Cart CTA */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isPending}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-50"
              >
                <CartIcon className="w-3.5 h-3.5" />
                <span>{isPending ? "Adding..." : "Add to Cart"}</span>
              </button>
            </div>

            {/* Live Feedback Notification */}
            {feedback && (
              <div
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg text-center shadow-xs transition-all ${
                  feedback.type === "success"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-red-100 text-red-800 border border-red-200"
                }`}
              >
                {feedback.text}
              </div>
            )}
          </div>
        ) : (
          <button
            disabled
            className="w-full py-2 text-xs font-semibold bg-gray-100 text-gray-400 border border-gray-200 rounded-xl cursor-not-allowed text-center"
          >
            Out of Stock
          </button>
        )}
      </div>
    </div>
  );
}
