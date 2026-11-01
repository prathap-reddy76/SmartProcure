"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createOrder } from "@/actions/order/order-actions";
import { checkoutSchema, CheckoutFormValues, CheckoutDefaults } from "@/types/order";
import { CartSummary } from "@/actions/cart/cart-actions";
import { CheckCircleIcon } from "@/components/ui/icons";

interface CheckoutClientProps {
  cart: CartSummary;
  initialDefaults: CheckoutDefaults;
}

export function CheckoutClient({ cart, initialDefaults }: CheckoutClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI">("COD");

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingName: initialDefaults.shippingName || "",
      shippingPhone: initialDefaults.shippingPhone || "",
      shippingAddress: initialDefaults.shippingAddress || "",
      shippingVillage: initialDefaults.shippingVillage || "",
      shippingDistrict: initialDefaults.shippingDistrict || "",
      shippingState: initialDefaults.shippingState || "",
      shippingPincode: initialDefaults.shippingPincode || "",
      paymentMethod: "COD",
    },
  });

  const onSubmit = async (values: CheckoutFormValues) => {
    setIsSubmitting(true);
    setServerError(null);

    const res = await createOrder({
      ...values,
      paymentMethod,
    });

    if (res.error) {
      setServerError(res.error);
      setIsSubmitting(false);
    } else if (res.orderIds && res.orderIds.length > 1) {
      router.push(`/farmer/orders?placed=true`);
    } else if (res.orderId || (res.orderIds && res.orderIds.length === 1)) {
      const id = res.orderId || res.orderIds![0];
      router.push(`/farmer/orders/${id}?placed=true`);
    }
  };

  const deliveryCharge = 0;
  const finalTotal = cart.subtotal + deliveryCharge;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {serverError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-semibold">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Delivery Address & Payment Method */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Delivery Address Card */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <span className="w-6 h-6 rounded-full bg-green-700 text-white font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h2 className="text-base font-bold text-gray-900">
                Delivery Address & Contact Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Recipient Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("shippingName")}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                />
                {errors.shippingName && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {errors.shippingName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  10-Digit Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  {...register("shippingPhone")}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                />
                {errors.shippingPhone && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {errors.shippingPhone.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Farm / Street Address <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                {...register("shippingAddress")}
                placeholder="House / Survey Plot number, main street, nearby landmark"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
              />
              {errors.shippingAddress && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {errors.shippingAddress.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Village</label>
                <input
                  type="text"
                  {...register("shippingVillage")}
                  placeholder="Village"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">District</label>
                <input
                  type="text"
                  {...register("shippingDistrict")}
                  placeholder="District"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">State</label>
                <input
                  type="text"
                  {...register("shippingState")}
                  placeholder="State"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  PIN Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  {...register("shippingPincode")}
                  placeholder="6-digit PIN"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg text-gray-900 font-mono"
                />
                {errors.shippingPincode && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {errors.shippingPincode.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 2. Payment Method Card */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <span className="w-6 h-6 rounded-full bg-green-700 text-white font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h2 className="text-base font-bold text-gray-900">Select Payment Method</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cash on Delivery */}
              <label
                onClick={() => {
                  setPaymentMethod("COD");
                  setValue("paymentMethod", "COD");
                }}
                className={`relative flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === "COD"
                    ? "bg-green-50/70 border-green-600 shadow-xs ring-1 ring-green-600"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethodSelect"
                  checked={paymentMethod === "COD"}
                  onChange={() => {
                    setPaymentMethod("COD");
                    setValue("paymentMethod", "COD");
                  }}
                  className="mt-1 text-green-700 focus:ring-green-500"
                />
                <div>
                  <span className="font-bold text-gray-900 text-sm block">
                    Cash on Delivery (COD)
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    Pay securely in cash directly to the delivery person upon arrival at your farm.
                  </p>
                </div>
              </label>

              {/* UPI (Coming Soon) */}
              <label
                onClick={() => {
                  setPaymentMethod("UPI");
                  setValue("paymentMethod", "UPI");
                }}
                className={`relative flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === "UPI"
                    ? "bg-green-50/70 border-green-600 shadow-xs ring-1 ring-green-600"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethodSelect"
                  checked={paymentMethod === "UPI"}
                  onChange={() => {
                    setPaymentMethod("UPI");
                    setValue("paymentMethod", "UPI");
                  }}
                  className="mt-1 text-green-700 focus:ring-green-500"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-900 text-sm">UPI Payment</span>
                    <span className="text-[10px] font-bold px-2 py-0.2 bg-emerald-100 text-emerald-800 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    GPay, PhonePe, and BHIM QR gateway integration will be completed in the next phase.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Items Review & Total Summary */}
        <div className="lg:col-span-1 lg:sticky lg:top-20 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 space-y-5">
            <h2 className="text-base font-bold text-gray-900 border-b pb-3">
              Order Items ({cart.totalItemCount})
            </h2>

            {/* Compact Items List */}
            <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 space-y-2 pr-1">
              {cart.items.map((item) => (
                <div key={item.id} className="pt-2 text-xs flex justify-between gap-3">
                  <div>
                    <span className="font-bold text-gray-900 block leading-tight">
                      {item.productName}
                    </span>
                    <span className="text-gray-500 text-[11px] block mt-0.5">
                      {item.isRental || item.productType === "MACHINERY_RENTAL"
                        ? `Duration: ${item.quantity} ${item.rentalMode === "HOURLY" ? "Hours" : "Days"} • Seller: ${item.shopName}`
                        : `Qty: ${item.quantity} • Seller: ${item.shopName}`}
                    </span>
                    {(item.isRental || item.productType === "MACHINERY_RENTAL") && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-emerald-800 text-[10px] font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          🚜 RENTAL ({item.rentalMode || "DAILY"})
                        </span>
                        {item.securityDeposit && item.securityDeposit > 0 ? (
                          <span className="text-[10px] text-gray-500">
                            (incl. ₹{item.securityDeposit} deposit)
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 font-bold text-gray-800">
                    {formatPrice(item.lineTotal)}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-3 border-t border-gray-100 space-y-2.5 text-xs text-gray-600">
              {Boolean(cart.totalSecurityDeposit && cart.totalSecurityDeposit > 0) ? (
                <>
                  <div className="flex justify-between">
                    <span>Rental & Goods Subtotal</span>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(cart.subtotal - (cart.totalSecurityDeposit || 0))}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-medium">
                    <span className="flex items-center gap-1">
                      <span>🛡️ Security Deposit</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold">Refundable</span>
                    </span>
                    <span className="font-bold text-emerald-900">
                      {formatPrice(cart.totalSecurityDeposit || 0)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-gray-900">{formatPrice(cart.subtotal)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span>Delivery Charge</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  FREE
                </span>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline text-sm">
                <span className="font-bold text-gray-900">Total Payable</span>
                <span className="text-2xl font-black text-green-950">
                  {formatPrice(finalTotal)}
                </span>
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-green-700 hover:bg-green-800 text-white font-bold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircleIcon className="w-5 h-5 text-green-300" />
                <span>{isSubmitting ? "Placing Order..." : "Place Order Now"}</span>
              </button>

              <Link
                href="/farmer/cart"
                className="w-full block py-2 text-center text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
              >
                &larr; Return to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
