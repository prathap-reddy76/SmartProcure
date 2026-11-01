import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Plus, Search, Filter, Edit, Eye, Image as ImageIcon, Box } from "lucide-react";
import { SessionUser } from "@/types/auth";

export const dynamic = "force-dynamic";

export default async function ShopProductsPage(props: {
  searchParams: Promise<{ query?: string; category?: string; status?: string; page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await requireRole("SHOP_OWNER");
  const user = session.user as SessionUser;

  const shop = await prisma.shop.findUnique({
    where: { userId: user.id },
  });

  if (!shop) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        No shop linked to your account.
      </div>
    );
  }

  const whereClause: any = { shopId: shop.id };

  if (searchParams.query) {
    whereClause.name = { contains: searchParams.query, mode: "insensitive" };
  }
  if (searchParams.category) {
    whereClause.categoryId = searchParams.category;
  }
  if (searchParams.status === "active") whereClause.isActive = true;
  if (searchParams.status === "inactive") whereClause.isActive = false;

  const page = parseInt(searchParams.page || "1", 10) || 1;
  const limit = 12;
  const skip = (page - 1) * limit;

  const [products, totalFilteredProducts, totalProducts, activeProducts, outOfStock, lowStock, categories] = await Promise.all([
    prisma.product.findMany({
      skip,
      take: limit,
      where: whereClause,
      include: { category: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where: whereClause }),
    prisma.product.count({ where: { shopId: shop.id } }),
    prisma.product.count({ where: { shopId: shop.id, isActive: true } }),
    prisma.product.count({ where: { shopId: shop.id, stock: 0 } }),
    prisma.product.count({ where: { shopId: shop.id, stock: { gt: 0, lte: 10 } } }),
    prisma.category.findMany({ where: { isActive: true } }),
  ]);

  const getShopTypeLabel = (type: string) => {
    switch(type) {
      case "FERTILIZER": return "Fertilizer & Agri Inputs";
      case "MACHINERY_RENTAL": return "Machinery Rental";
      case "MACHINERY_SALES": return "New Machinery Sales";
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            My Products
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {shop.name} • <span className="font-semibold text-indigo-600">{getShopTypeLabel(shop.shopType)}</span>
          </p>
        </div>
        <Link
          href="/shop/products/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm self-start sm:self-center"
        >
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalProducts}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{activeProducts}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Low Stock</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{lowStock}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{outOfStock}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <form className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative w-full md:w-auto flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input 
              type="text" 
              name="query" 
              placeholder="Search products..."
              defaultValue={searchParams.query || ""}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
            />
          </div>
          <select name="category" defaultValue={searchParams.category || ""} className="w-full md:w-48 py-2 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-600 outline-none">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select name="status" defaultValue={searchParams.status || ""} className="w-full md:w-32 py-2 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-600 outline-none">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button type="submit" className="w-full md:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-500">
                <th className="py-4 px-5">Product</th>
                <th className="py-4 px-5">Category</th>
                <th className="py-4 px-5 text-right">Price</th>
                <th className="py-4 px-5 text-center">Stock</th>
                <th className="py-4 px-5 text-center">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500 font-medium">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                          {p.images[0] ? (
                            <img src={p.images[0].imageUrl} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Box className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{p.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">Updated {new Date(p.updatedAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 font-semibold text-gray-700">
                      {p.category.name}
                    </td>
                    <td className="py-4 px-5 text-right font-bold text-gray-900">
                      ₹{p.price.toString()} <span className="text-gray-400 font-normal text-xs">/ {p.unit}</span>
                    </td>
                    <td className="py-4 px-5 text-center font-bold text-gray-700">
                      {p.stock}
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${p.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right space-x-1">
                      <Link href={`/shop/products/${p.id}`} title="View Details" className="inline-flex p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link href={`/shop/products/${p.id}/edit`} title="Edit" className="inline-flex p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <Link href={`/shop/products/${p.id}`} title="Images" className="inline-flex p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                        <ImageIcon className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        
      {/* Pagination */}
      {Math.ceil(totalFilteredProducts / limit) > 1 && (
        <div className="flex justify-center py-6 gap-2">
          {page > 1 && (
            <Link href={`/shop/products?page=${page - 1}&query=${searchParams.query || ''}&category=${searchParams.category || ''}&status=${searchParams.status || ''}`} className="px-4 py-2 border rounded hover:bg-gray-50 bg-white">Previous</Link>
          )}
          <span className="px-4 py-2 text-sm font-semibold text-gray-500">Page {page} of {Math.ceil(totalFilteredProducts / limit)}</span>
          {page < Math.ceil(totalFilteredProducts / limit) && (
            <Link href={`/shop/products?page=${page + 1}&query=${searchParams.query || ''}&category=${searchParams.category || ''}&status=${searchParams.status || ''}`} className="px-4 py-2 border rounded hover:bg-gray-50 bg-white">Next</Link>
          )}
        </div>
      )}
      </div>
    </div>
  </div>
  );
}
