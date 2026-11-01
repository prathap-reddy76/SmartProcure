"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/actions/cart/cart-actions";
import { CartIcon } from "@/components/ui/icons";

interface DetailAddToCartProps {
  productId: string;
  stock: number;
}

export function DetailAddToCart({ productId, stock }: DetailAddToCartProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const isOutOfStock = stock <= 0;

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncrement = () => {
    if (quantity < stock) {
      setQuantity((prev) => prev + 1);
    } else {
      setFeedback({ type: "error", text: `Maximum available quantity is ${stock}` });
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  const handleAdd = async () => {
    if (isOutOfStock || isPending) return;

    setIsPending(true);
    setFeedback(null);

    const res = await addToCart(productId, quantity);
    setIsPending(false);

    if (res.error) {
      setFeedback({ type: "error", text: res.error });
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback({ type: "success", text: "Product added to your cart!" });
      router.refresh();
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  if (isOutOfStock) {
    return (
      <div className="pt-2">
        <button
          disabled
          className="w-full py-3 px-6 rounded-xl font-bold bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed text-sm"
        >
          Product Currently Out of Stock
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        {/* Quantity Controls */}
        <div className="flex items-center border border-gray-300 rounded-xl bg-white shadow-2xs overflow-hidden h-12">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={quantity <= 1 || isPending}
            className="w-12 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent font-bold text-lg select-none"
            aria-label="Decrease quantity"
          >
            &minus;
          </button>
          <div className="w-14 text-center font-bold text-gray-900 text-base select-none">
            {quantity}
          </div>
          <button
            type="button"
            onClick={handleIncrement}
            disabled={quantity >= stock || isPending}
            className="w-12 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent font-bold text-lg select-none"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        {/* Add to Cart CTA */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={isPending}
          className="flex-1 h-12 inline-flex items-center justify-center gap-2 px-6 bg-green-700 hover:bg-green-800 text-white font-bold text-sm rounded-xl shadow-xs transition-colors disabled:opacity-50"
        >
          <CartIcon className="w-5 h-5" />
          <span>{isPending ? "Adding to Cart..." : "Add to Cart"}</span>
        </button>
      </div>

      {/* Floating or Inline Feedback */}
      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          {feedback.text}
        </div>
      )}
    </div>
  );
}
