import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-utils";
import { getCart } from "@/actions/cart/cart-actions";
import { getCheckoutDefaults } from "@/actions/order/order-actions";
import { CheckoutClient } from "./checkout-client";
import { CartIcon } from "@/components/ui/icons";

export default async function CheckoutPage() {
  await requireRole("FARMER");

  const [cartRes, defaults] = await Promise.all([
    getCart(),
    getCheckoutDefaults(),
  ]);

  const cart = cartRes.cart;

  if (!cart || cart.items.length === 0) {
    redirect("/farmer/cart");
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-gray-200">
        <nav className="text-xs text-gray-500 flex items-center gap-1.5 mb-2" aria-label="Breadcrumb">
          <Link href="/farmer/cart" className="hover:text-green-700">
            Cart
          </Link>
          <span>&rsaquo;</span>
          <span className="text-gray-800 font-medium">Checkout</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <CartIcon className="w-6 h-6 text-green-700" />
          <span>Farm Supplies Checkout</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Review your items and provide delivery location to place your agricultural supplies order.
        </p>
      </div>

      <CheckoutClient cart={cart} initialDefaults={defaults} />
    </div>
  );
}
