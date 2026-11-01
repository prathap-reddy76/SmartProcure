import React from "react";
import { requireRole } from "@/lib/auth-utils";
import { SessionUser } from "@/types/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Plus, Trash2, Image as ImageIcon, Box, Star, CheckCircle } from "lucide-react";
import { uploadProductImage, deleteProductImage, setPrimaryProductImage } from "@/actions/shop/product-actions";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function ProductDetailsPage(props: {
  params: Promise<{ productId: string }>;
}) {
  const params = await props.params;
  const session = await requireRole("SHOP_OWNER");
  const user = session.user as SessionUser;

  const shop = await prisma.shop.findUnique({
    where: { userId: user.id },
  });

  if (!shop) return <div className="p-8 text-center text-red-500 font-bold">No shop linked to your account.</div>;

  const product = await prisma.product.findUnique({
    where: { id: params.productId, shopId: shop.id },
    include: { category: true, images: { orderBy: { sortOrder: 'asc' } } },
  });

  if (!product) notFound();

  const spec = (product.specifications as Record<string, any>) || {};

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/shop/products" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Link>
        <Link href={`/shop/products/${product.id}/edit`} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-sm rounded-lg transition-colors">
          <Edit className="w-4 h-4" /> Edit Product
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN - INFO */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{product.name}</h1>
                <p className="text-sm font-semibold text-indigo-600 mt-1">{product.category.name}</p>
              </div>
              <span className={`inline-block px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${product.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                {product.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              {product.description || "No description provided."}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Selling Price</p>
                <p className="font-bold text-gray-900">₹{product.price.toString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Unit</p>
                <p className="font-bold text-gray-900">{product.unit || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Stock</p>
                <p className="font-bold text-gray-900">{product.stock}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Type</p>
                <p className="font-bold text-gray-900">{product.productType.replace("_", " ")}</p>
              </div>
            </div>
          </section>

          {/* SPECIFICATIONS based on Type */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Technical Specifications</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              {Object.entries(spec).map(([key, value]) => {
                if (value === null || value === undefined || value === "") return null;
                // Add spaces to camelCase keys
                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                return (
                  <div key={key} className="py-2 border-b border-gray-100 last:border-0">
                    <span className="text-xs font-semibold text-gray-500 block mb-0.5">{label}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                    </span>
                  </div>
                )
              })}
              {(!spec || Object.keys(spec).length === 0) && (
                <div className="col-span-2 text-sm text-gray-500 py-2">No specifications added.</div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN - MEDIA MANAGEMENT */}
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-500" /> Product Media
              </h2>
            </div>
            
            <form action={async (formData) => {
              "use server";
              await uploadProductImage(product.id, formData);
            }} className="mb-6">
              <label className="block w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
                <input type="file" name="file" accept="image/*" className="hidden" required />
                <Plus className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
                <span className="text-xs font-semibold text-indigo-600 block">Click to upload image</span>
                <span className="text-[10px] text-gray-500 mt-1 block">PNG, JPG up to 5MB</span>
              </label>
              <button type="submit" className="w-full mt-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-gray-800 transition-colors">
                Upload
              </button>
            </form>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Uploaded Images ({product.images.length})</h3>
              {product.images.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-100">
                  <Box className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-gray-500">No images added yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {product.images.map((img, idx) => (
                    <div key={img.id} className={`flex items-center gap-3 p-2 rounded-xl border ${idx === 0 ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-200 bg-white'}`}>
                      <div className="w-16 h-16 rounded-lg bg-gray-100 shrink-0 overflow-hidden border border-gray-200">
                        <img src={img.imageUrl} alt="Product" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        {idx === 0 && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md mb-1"><Star className="w-3 h-3" /> Primary</span>}
                        <div className="flex gap-2 mt-1">
                          {idx !== 0 && (
                            <form action={async () => { "use server"; await setPrimaryProductImage(img.id); }}>
                              <button type="submit" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">Set Primary</button>
                            </form>
                          )}
                        </div>
                      </div>
                      <form action={async () => { "use server"; await deleteProductImage(img.id); }}>
                        <button type="submit" className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
        
      </div>
    </div>
  );
}
