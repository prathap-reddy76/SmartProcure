import React from "react";
import { requireRole } from "@/lib/auth-utils";
import { getCart } from "@/actions/cart/cart-actions";
import { CartClient } from "./cart-client";

export default async function FarmerCartPage() {
  await requireRole("FARMER");
  const res = await getCart();

  if (!res.cart) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-gray-200">
        <p className="text-red-600 font-semibold">{res.error || "Unable to load cart."}</p>
      </div>
    );
  }

  return <CartClient initialCart={res.cart} />;
}
