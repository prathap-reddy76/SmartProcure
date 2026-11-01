import React from "react";
import Link from "next/link";
import { getAdminShops } from "@/actions/admin/shop-actions";
import { Search, Filter, Plus, Edit, Eye, Archive, Play, Box } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminShopsPage(props: {
  searchParams: Promise<{ query?: string; type?: string; status?: string; district?: string }>;
}) {
  const searchParams = await props.searchParams;
  const shops = await getAdminShops({
    query: searchParams.query,
    shopType: searchParams.type,
    status: searchParams.status,
    district: searchParams.district
  });

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
            Registered Shops
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage agricultural shops and their owners.
          </p>
        </div>
        <Link
          href="/admin/shops/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm self-start sm:self-center"
        >
          <Plus className="w-4 h-4" /> Create Shop
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <form className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative w-full md:w-auto flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input 
              type="text" 
              name="query" 
              placeholder="Search shops or owners..."
              defaultValue={searchParams.query || ""}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
            />
          </div>
          <select name="type" defaultValue={searchParams.type || ""} className="w-full md:w-48 py-2 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-600 outline-none">
            <option value="">All Types</option>
            <option value="FERTILIZER">Fertilizer & Agri Inputs</option>
            <option value="MACHINERY_RENTAL">Machinery Rental</option>
            <option value="MACHINERY_SALES">New Machinery Sales</option>
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
                <th className="py-4 px-5">Shop Details</th>
                <th className="py-4 px-5">Type</th>
                <th className="py-4 px-5">Owner</th>
                <th className="py-4 px-5 text-center">Products</th>
                <th className="py-4 px-5">Location</th>
                <th className="py-4 px-5 text-center">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {shops.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 font-medium">
                    No shops match your criteria.
                  </td>
                </tr>
              ) : (
                shops.map((shop) => (
                  <tr key={shop.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-gray-900">{shop.name}</div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(shop.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="py-4 px-5 font-semibold text-gray-700">
                      {getShopTypeLabel(shop.shopType)}
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-semibold text-gray-800">{shop.ownerName || "No owner"}</div>
                      <div className="text-xs text-gray-500">{shop.user?.email || shop.email}</div>
                    </td>
                    <td className="py-4 px-5 text-center font-bold text-gray-700">
                      {shop._count.products}
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-gray-700">{shop.district || "-"}</div>
                      <div className="text-xs text-gray-500">{shop.state || "-"}</div>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${shop.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                        {shop.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right space-x-2">
                      {/* Products link now properly points to /admin/products with shopId filter */}
                      <Link href={`/admin/products?shopId=${shop.id}`} title="Products" className="inline-flex p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                        <Box className="w-4 h-4" />
                      </Link>
                      <button title={shop.isActive ? "Deactivate" : "Activate"} className="inline-flex p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-lg transition-colors">
                        {shop.isActive ? <Archive className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
