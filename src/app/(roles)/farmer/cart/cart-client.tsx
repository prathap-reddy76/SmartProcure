"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CartSummary,
  updateCartItemQuantity,
  updateCartItemRentalMode,
  removeCartItem,
  clearCart,
} from "@/actions/cart/cart-actions";
import { CartIcon, TrashIcon } from "@/components/ui/icons";

export function CartClient({ initialCart }: { initialCart: CartSummary }) {
  const router = useRouter();
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { items, subtotal, totalItemCount, totalUniqueProducts, totalSecurityDeposit, totalRentalAmount } = initialCart;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleUpdateQuantity = async (cartItemId: string, newQty: number, stock: number) => {
    if (newQty < 1) return;
    if (stock >= 0 && newQty > stock) {
      setErrorMessage(`Only ${stock} units are currently available.`);
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }

    setBusyItemId(cartItemId);
    setErrorMessage(null);

    const res = await updateCartItemQuantity(cartItemId, newQty);
    setBusyItemId(null);

    if (res.error) {
      setErrorMessage(res.error);
      setTimeout(() => setErrorMessage(null), 3500);
    } else {
      router.refresh();
    }
  };

  const handleUpdateRentalMode = async (cartItemId: string, newMode: "HOURLY" | "DAILY") => {
    setBusyItemId(cartItemId);
    setErrorMessage(null);

    const res = await updateCartItemRentalMode(cartItemId, newMode);
    setBusyItemId(null);

    if (res.error) {
      setErrorMessage(res.error);
      setTimeout(() => setErrorMessage(null), 3500);
    } else {
      router.refresh();
    }
  };

  const handleRemove = async (cartItemId: string) => {
    setBusyItemId(cartItemId);
    setErrorMessage(null);

    const res = await removeCartItem(cartItemId);
    setBusyItemId(null);

    if (res.error) {
      setErrorMessage(res.error);
      setTimeout(() => setErrorMessage(null), 3500);
    } else {
      router.refresh();
    }
  };

  const handleClearCart = async () => {
    setIsClearing(true);
    setErrorMessage(null);

    const res = await clearCart();
    setIsClearing(false);
    setShowClearConfirm(false);

    if (res.error) {
      setErrorMessage(res.error);
      setTimeout(() => setErrorMessage(null), 3500);
    } else {
      router.refresh();
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-8 sm:p-14 text-center max-w-lg mx-auto my-8">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
          <CartIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto leading-relaxed">
          Browse agricultural products, seeds, fertilizers, and tools, and add the supplies you need for your farm.
        </p>
        <Link
          href="/farmer/marketplace"
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl text-sm shadow-xs transition-colors"
        >
          <span>Browse Marketplace</span>
          <span>&rarr;</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar with Counts and Clear Cart CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <CartIcon className="w-6 h-6 text-green-700" />
            <span>My Farm Supplies Cart</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {totalUniqueProducts} {totalUniqueProducts === 1 ? "Product" : "Products"} &bull;{" "}
            {totalItemCount} {totalItemCount === 1 ? "Item" : "Total Units"}
          </p>
        </div>

        <button
          onClick={() => setShowClearConfirm(true)}
          className="text-xs text-red-600 hover:text-red-800 font-semibold inline-flex items-center gap-1 self-start sm:self-auto py-1 px-2.5 rounded-lg hover:bg-red-50 transition-colors"
        >
          <TrashIcon className="w-4 h-4" />
          <span>Clear Cart</span>
        </button>
      </div>

      {/* Error alert toast */}
      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold">
          {errorMessage}
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <TrashIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Clear your entire cart?</h3>
              <p className="text-xs text-gray-500 mt-1">
                All agricultural items will be removed from your cart. You will need to add them again from the marketplace.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearCart}
                disabled={isClearing}
                className="flex-1 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isClearing ? "Clearing..." : "Clear Cart"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const isBusy = busyItemId === item.id;
            const isRental = item.isRental || item.productType === "MACHINERY_RENTAL";

            if (isRental) {
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border-2 border-emerald-200/90 shadow-2xs p-5 space-y-4 transition-all ${
                    isBusy ? "opacity-60 pointer-events-none" : ""
                  }`}
                >
                  {/* Header: Badge & Remove */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1.5">
                        <span>🚜</span>
                        <span>Rental Service</span>
                      </span>
                      {item.specifications?.brand && (
                        <span className="text-xs font-bold text-gray-600">
                          {item.specifications.brand}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remove rental from cart"
                      aria-label="Remove item"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Machine Name & Thumbnail */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative w-full sm:w-28 h-28 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200">
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        sizes="(max-width: 640px) 100vw, 112px"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      <Link
                        href={`/farmer/marketplace/${item.productSlug || item.productId}`}
                        className="text-base font-bold text-gray-900 hover:text-green-800 transition-colors block leading-snug"
                      >
                        {item.productName}
                      </Link>

                      <p className="text-xs text-gray-500">
                        Machinery Provider: <span className="font-semibold text-gray-700">{item.shopName}</span>
                        {item.shopDistrict && ` (${item.shopDistrict})`}
                      </p>

                      {/* Mode Selector Toggle */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-xs font-semibold text-gray-500">Rental Type:</span>
                        {item.supportsHourly && item.supportsDaily ? (
                          <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 text-xs font-bold">
                            <button
                              type="button"
                              onClick={() => handleUpdateRentalMode(item.id, "HOURLY")}
                              className={`px-3 py-1 rounded-md transition-all ${
                                item.rentalMode === "HOURLY"
                                  ? "bg-emerald-700 text-white shadow-2xs"
                                  : "text-gray-600 hover:text-gray-900"
                              }`}
                            >
                              Hourly (₹{item.specifications?.rentalHourlyRate}/hr)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateRentalMode(item.id, "DAILY")}
                              className={`px-3 py-1 rounded-md transition-all ${
                                item.rentalMode === "DAILY"
                                  ? "bg-emerald-700 text-white shadow-2xs"
                                  : "text-gray-600 hover:text-gray-900"
                              }`}
                            >
                              Daily (₹{item.specifications?.rentalDailyRate}/day)
                            </button>
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 bg-gray-100 rounded-md text-xs font-bold text-gray-800">
                            {item.rentalMode === "HOURLY"
                              ? `Hourly (₹${item.rentalRate}/hr)`
                              : `Daily (₹${item.rentalRate}/day)`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Duration Stepper & Cost Breakdown */}
                  <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/60">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-700">Rental Duration:</span>
                        <div className="flex items-center border border-gray-300 rounded-lg bg-white shadow-2xs overflow-hidden h-9">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, -1)}
                            disabled={item.quantity <= 1 || isBusy}
                            className="w-8 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent font-bold select-none text-base"
                            aria-label="Decrease duration"
                          >
                            &minus;
                          </button>
                          <span className="px-3 text-center font-bold text-gray-900 text-xs select-none">
                            {item.quantity} {item.rentalMode === "HOURLY" ? (item.quantity === 1 ? "Hour" : "Hours") : (item.quantity === 1 ? "Day" : "Days")}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, -1)}
                            disabled={isBusy}
                            className="w-8 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent font-bold select-none text-base"
                            aria-label="Increase duration"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-gray-500 block">Rate applied</span>
                        <span className="text-xs font-bold text-gray-800">
                          {formatPrice(item.rentalRate || item.price)} / {item.rentalMode === "HOURLY" ? "hour" : "day"}
                        </span>
                      </div>
                    </div>

                    {/* Pricing Breakdown: Rental Fee + Separated Security Deposit + Total */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-gray-700">
                        <span>Rental Fee ({item.quantity} {item.rentalMode === "HOURLY" ? "hrs" : "days"} × {formatPrice(item.rentalRate || item.price)}):</span>
                        <span className="font-bold text-gray-900">{formatPrice(item.rentalAmount || (item.price * item.quantity))}</span>
                      </div>

                      <div className="flex items-center justify-between text-emerald-800">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span>🛡️ Refundable Security Deposit:</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Returned upon machine return</span>
                        </span>
                        <span className="font-bold text-emerald-900">
                          {formatPrice(item.securityDeposit || 0)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-emerald-200/60 text-sm font-extrabold text-gray-900">
                        <span>Total Amount Due:</span>
                        <span className="text-base text-emerald-950">{formatPrice(item.lineTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            const isOutOfStock = item.stock <= 0;
            const isOverStock = item.quantity > item.stock;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border border-gray-200/90 shadow-2xs p-4 sm:p-5 flex flex-col sm:flex-row gap-4 transition-all ${
                  isBusy ? "opacity-60 pointer-events-none" : ""
                }`}
              >
                {/* Product Thumbnail */}
                <div className="relative w-full sm:w-24 h-28 sm:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    sizes="(max-width: 640px) 100vw, 96px"
                    className="object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/farmer/marketplace/${item.productSlug || item.productId}`}
                        className="text-base font-bold text-gray-900 hover:text-green-800 transition-colors leading-snug line-clamp-2"
                      >
                        {item.productName}
                      </Link>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded-md transition-colors"
                        title="Remove product from cart"
                        aria-label="Remove item"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-gray-500 mt-0.5">
                      Seller: <span className="font-medium text-gray-700">{item.shopName}</span>
                      {item.shopDistrict && ` (${item.shopDistrict})`}
                    </p>

                    <div className="text-xs font-semibold text-gray-900 mt-1">
                      {formatPrice(item.price)}
                      {item.unit && <span className="text-gray-500 font-normal"> / {item.unit}</span>}
                    </div>

                    {/* Stock Warning Badge */}
                    {!item.isActive && (
                      <span className="inline-block mt-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        Product Unavailable
                      </span>
                    )}
                    {item.isActive && isOutOfStock && (
                      <span className="inline-block mt-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        Currently Out of Stock
                      </span>
                    )}
                    {item.isActive && !isOutOfStock && isOverStock && (
                      <span className="inline-block mt-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Only {item.stock} available in stock
                      </span>
                    )}
                  </div>

                  {/* Quantity Controls & Line Total */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    {/* Controls */}
                    <div className="flex items-center border border-gray-300 rounded-lg bg-gray-50/60 overflow-hidden h-9">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, item.stock)}
                        disabled={item.quantity <= 1 || isBusy}
                        className="w-8 h-full flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent font-bold select-none text-base"
                        aria-label="Decrease quantity"
                      >
                        &minus;
                      </button>
                      <span className="w-10 text-center font-bold text-gray-900 text-xs select-none">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, item.stock)}
                        disabled={item.quantity >= item.stock || isBusy}
                        className="w-8 h-full flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent font-bold select-none text-base"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">
                        Line Total
                      </span>
                      <span className="text-base font-extrabold text-gray-900">
                        {formatPrice(item.lineTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Cart Summary Panel */}
        <div className="lg:col-span-1 lg:sticky lg:top-20 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 space-y-5">
            <h2 className="text-base font-bold text-gray-900 border-b pb-3">
              Order Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Total Items</span>
                <span className="font-semibold text-gray-900">{totalItemCount}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Unique Products</span>
                <span className="font-semibold text-gray-900">{totalUniqueProducts}</span>
              </div>

              {Boolean(totalSecurityDeposit && totalSecurityDeposit > 0) && (
                <>
                  <div className="flex justify-between text-gray-600">
                    <span>Rental Charges</span>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(subtotal - (totalSecurityDeposit || 0))}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-medium">
                    <span className="flex items-center gap-1">
                      <span>🛡️ Security Deposit</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded font-bold">Refundable</span>
                    </span>
                    <span className="font-bold text-emerald-900">
                      {formatPrice(totalSecurityDeposit || 0)}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Delivery Charge</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">
                  FREE
                </span>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline">
                <span className="text-base font-bold text-gray-900">Total Amount</span>
                <span className="text-2xl font-black text-green-900">
                  {formatPrice(subtotal)}
                </span>
              </div>
            </div>

            {/* Note regarding checkout */}
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-500 leading-relaxed">
              Security deposits for rental equipment are fully refundable upon return and inspection. Normal products are delivered free.
            </div>

            {/* CTA Buttons */}
            <div className="space-y-2.5 pt-2">
              <Link
                href="/farmer/checkout"
                className="w-full block py-3 px-4 bg-green-700 hover:bg-green-800 text-white font-bold text-sm rounded-xl text-center shadow-xs transition-colors"
              >
                Proceed to Checkout &rarr;
              </Link>

              <Link
                href="/farmer/marketplace"
                className="w-full block py-2.5 px-4 bg-green-50 hover:bg-green-100 text-green-800 border border-green-200 font-bold text-xs rounded-xl text-center transition-colors"
              >
                &larr; Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
