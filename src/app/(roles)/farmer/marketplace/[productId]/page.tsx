import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-utils";
import { getProductById } from "@/actions/marketplace/product-actions";
import { CheckCircleIcon } from "@/components/ui/icons";
import { DetailAddToCart } from "../components/detail-add-to-cart";
import { ProductSpecifications } from "@/components/farmer/product-specifications";
import { MachineryRentalSelector } from "@/components/farmer/machinery-rental-selector";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  await requireRole("FARMER");
  const { productId } = await params;
  const product = await getProductById(productId);

  if (!product) {
    notFound();
  }

  const isInStock = product.stock > 0;
  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(product.price);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-gray-500 flex items-center gap-1.5" aria-label="Breadcrumb">
        <Link href="/farmer/dashboard" className="hover:text-green-700">
          Dashboard
        </Link>
        <span>&rsaquo;</span>
        <Link href="/farmer/marketplace" className="hover:text-green-700">
          Marketplace
        </Link>
        <span>&rsaquo;</span>
        <Link
          href={`/farmer/marketplace?category=${product.category.slug}`}
          className="hover:text-green-700"
        >
          {product.category.name}
        </Link>
        <span>&rsaquo;</span>
        <span className="text-gray-800 font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main Product Card */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8">
          {/* Product Image Gallery */}
          <div className="space-y-3">
            <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              <Image
                src={product.images[0]?.imageUrl || "https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=600&q=80"}
                alt={product.images[0]?.altText || product.name}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute top-3 left-3">
                <span className="bg-white/95 text-green-900 font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-md shadow-xs backdrop-blur-xs">
                  {product.category.name}
                </span>
              </div>
            </div>

            {/* Thumbnail row if multiple images exist */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img) => (
                  <div
                    key={img.id}
                    className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0"
                  >
                    <Image
                      src={img.imageUrl}
                      alt={img.altText || product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Overview & Pricing */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">
                  Verified Agricultural Supply
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 leading-snug">
                  {product.name}
                </h1>
                {product.variety && (
                  <p className="text-sm font-medium text-gray-600 mt-1">
                    Formulation / Variety: <span className="text-gray-900 font-semibold">{product.variety}</span>
                  </p>
                )}
              </div>

              {/* Rental vs Purchase Interface */}
              {product.productType === "MACHINERY_RENTAL" ? (
                <div className="space-y-4">
                  {/* Short Description */}
                  {product.description && (
                    <div className="text-sm text-gray-600 leading-relaxed pt-1">
                      {product.description}
                    </div>
                  )}

                  {/* Interactive Rental Selector & Cart Flow */}
                  <MachineryRentalSelector
                    productId={product.id}
                    supportsHourly={Boolean(
                      (product.specifications as any)?.rentalHourlyRate &&
                        Number((product.specifications as any)?.rentalHourlyRate) > 0
                    )}
                    hourlyRate={
                      (product.specifications as any)?.rentalHourlyRate
                        ? Number((product.specifications as any)?.rentalHourlyRate)
                        : null
                    }
                    supportsDaily={Boolean(
                      (product.specifications as any)?.rentalDailyRate &&
                        Number((product.specifications as any)?.rentalDailyRate) > 0
                    )}
                    dailyRate={
                      (product.specifications as any)?.rentalDailyRate
                        ? Number((product.specifications as any)?.rentalDailyRate)
                        : null
                    }
                    securityDeposit={
                      (product.specifications as any)?.securityDeposit
                        ? Number((product.specifications as any)?.securityDeposit)
                        : 0
                    }
                  />
                </div>
              ) : (
                <>
                  {/* Price & Unit */}
                  <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-gray-900">{formattedPrice}</span>
                    {product.unit && (
                      <span className="text-sm text-gray-600 font-medium">/ {product.unit}</span>
                    )}
                  </div>

                  {/* Stock Status Banner */}
                  <div>
                    {isInStock ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                        <span>In Stock ({product.stock} available)</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 border border-gray-300 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-gray-500" />
                        <span>Currently Out of Stock</span>
                      </div>
                    )}
                  </div>

                  {/* Short Description */}
                  {product.description && (
                    <div className="text-sm text-gray-600 leading-relaxed pt-2">
                      {product.description}
                    </div>
                  )}

                  {/* Add To Cart with Quantity Control */}
                  <DetailAddToCart productId={product.id} stock={product.stock} />
                </>
              )}
            </div>

            {/* Ordering Note */}
            <div className="p-4 bg-green-50/60 rounded-xl border border-green-200/60 text-xs text-green-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-green-950">
                <span>Direct Agro-Shop Product</span>
              </p>
              <p className="text-green-800 leading-relaxed">
                Cart checkout and direct online order placement are scheduled for the next phase. You can currently inspect verified stock and contact the agro-shop below.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Agricultural Specs + Seller Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Advanced Specifications */}
        <ProductSpecifications 
          productType={product.productType || 'FERTILIZER'} 
          specifications={product.specifications || {}}
          suitableCrops={product.suitableCrops}
          dosage={product.dosage}
          packageSize={product.packageSize}
        />

        {/* Verified Seller / Shop Profile */}
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-6 space-y-4">
          <h2 className="text-base font-bold text-gray-900 border-b pb-2">
            Authorized Seller / Agro-Dealer
          </h2>

          <div className="space-y-3">
            <div>
              <h3 className="font-bold text-gray-900 text-base">{product.shop.name}</h3>
              {product.shop.ownerName && (
                <p className="text-xs text-gray-500">Proprietor: {product.shop.ownerName}</p>
              )}
            </div>

            {product.shop.description && (
              <p className="text-xs text-gray-600 leading-relaxed">
                {product.shop.description}
              </p>
            )}

            <div className="pt-2 border-t border-gray-100 space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-gray-700 w-20">Address:</span>
                <span className="text-gray-600 flex-1">
                  {[
                    product.shop.address,
                    product.shop.village,
                    product.shop.district,
                    product.shop.state,
                    product.shop.pincode,
                  ]
                    .filter(Boolean)
                    .join(", ") || "Location details on file"}
                </span>
              </div>

              {product.shop.phone && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700 w-20">Dealer Tel:</span>
                  <a
                    href={`tel:${product.shop.phone}`}
                    className="text-green-700 font-semibold hover:underline"
                  >
                    +91 {product.shop.phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="pt-4 flex justify-between items-center">
        <Link
          href="/farmer/marketplace"
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-900"
        >
          &larr; Back to Catalog
        </Link>
      </div>
    </div>
  );
}
