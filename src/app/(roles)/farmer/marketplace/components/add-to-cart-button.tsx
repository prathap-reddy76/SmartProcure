"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/actions/cart/cart-actions";
import { CartIcon } from "@/components/ui/icons";

interface AddToCartButtonProps {
  productId: string;
  stock: number;
  compact?: boolean;
  quantity?: number;
}

export function AddToCartButton({
  productId,
  stock,
  compact = false,
  quantity = 1,
}: AddToCartButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const isOutOfStock = stock <= 0;

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock || isPending) return;

    setIsPending(true);
    setFeedback(null);

    const res = await addToCart(productId, quantity);
    setIsPending(false);

    if (res.error) {
      setFeedback({ type: "error", text: res.error });
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback({ type: "success", text: "Added to cart!" });
      router.refresh();
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  if (isOutOfStock) {
    return (
      <button
        disabled
        className={`${
          compact ? "px-2.5 py-1.5 text-xs" : "px-5 py-2.5 text-sm"
        } rounded-lg font-semibold bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed`}
      >
        Out of Stock
      </button>
    );
  }

  return (
    <div className="relative inline-flex flex-col items-center">
      <button
        onClick={handleAdd}
        disabled={isPending}
        className={`inline-flex items-center justify-center gap-1.5 font-bold transition-all shadow-2xs ${
          compact
            ? "px-3 py-1.5 text-xs bg-green-700 hover:bg-green-800 text-white rounded-lg disabled:opacity-50"
            : "px-6 py-3 text-sm bg-green-700 hover:bg-green-800 text-white rounded-xl shadow-xs disabled:opacity-50"
        }`}
      >
        <CartIcon className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
        <span>{isPending ? "Adding..." : "Add to Cart"}</span>
      </button>

      {/* Floating Feedback Notification */}
      {feedback && (
        <div
          className={`absolute bottom-full mb-1 z-30 px-2.5 py-1 rounded-md text-[11px] font-bold shadow-md whitespace-nowrap transition-all ${
            feedback.type === "success"
              ? "bg-emerald-800 text-white"
              : "bg-red-800 text-white"
          }`}
        >
          {feedback.text}
        </div>
      )}
    </div>
  );
}
