"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminOrderSummary, AdminOrderStats } from "@/actions/admin/admin-order-actions";

interface Props {
  initialOrders: AdminOrderSummary[];
  initialStats: AdminOrderStats | null;
  totalCount: number;
  pageCount: number;
  currentPage: number;
}

export function AdminOrdersClient({ initialOrders, initialStats, totalCount, pageCount, currentPage }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [paymentStatus, setPaymentStatus] = useState(searchParams.get("paymentStatus") || "");
  const [deliveryStatus, setDeliveryStatus] = useState(searchParams.get("deliveryStatus") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "newest");

  // Debounced Search Apply
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters({ search, status, paymentStatus, deliveryStatus, sortBy, page: 1 });
    }, 500);
    return () => clearTimeout(timer);
  }, [search]); // Only run on search string change (others are manual triggers)

  const applyFilters = (filters: any) => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.status) params.set("status", filters.status);
    if (filters.paymentStatus) params.set("paymentStatus", filters.paymentStatus);
    if (filters.deliveryStatus) params.set("deliveryStatus", filters.deliveryStatus);
    if (filters.sortBy && filters.sortBy !== "newest") params.set("sortBy", filters.sortBy);
    if (filters.page && filters.page > 1) params.set("page", filters.page.toString());

    router.push(`/admin/orders?${params.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    let newFilters = { search, status, paymentStatus, deliveryStatus, sortBy, page: 1 } as any;
    newFilters[key] = value;
    
    // Update local state
    if (key === "status") setStatus(value);
    if (key === "paymentStatus") setPaymentStatus(value);
    if (key === "deliveryStatus") setDeliveryStatus(value);
    if (key === "sortBy") setSortBy(value);

    applyFilters(newFilters);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      {initialStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard label="Total Orders" value={initialStats.total} color="bg-gray-50 text-gray-900 border-gray-200" />
          <StatCard label="Pending" value={initialStats.pending} color="bg-amber-50 text-amber-900 border-amber-200" />
          <StatCard label="Processing" value={initialStats.processing} color="bg-blue-50 text-blue-900 border-blue-200" />
          <StatCard label="Out for Delivery" value={initialStats.outForDelivery} color="bg-indigo-50 text-indigo-900 border-indigo-200" />
          <StatCard label="Delivered" value={initialStats.delivered} color="bg-emerald-50 text-emerald-900 border-emerald-200" />
          <StatCard label="Cancelled" value={initialStats.cancelled} color="bg-red-50 text-red-900 border-red-200" />
          <StatCard label="Payment Pending" value={initialStats.paymentPending} color="bg-orange-50 text-orange-900 border-orange-200" />
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200/90 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="lg:col-span-2">
          <input
            type="text"
            placeholder="Search Order #, Farmer, Shop..."
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <select value={status} onChange={(e) => handleFilterChange("status", e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg bg-white">
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="READY_FOR_DELIVERY">Ready for Delivery</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div>
          <select value={deliveryStatus} onChange={(e) => handleFilterChange("deliveryStatus", e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg bg-white">
            <option value="">Any Delivery</option>
            <option value="PENDING_ASSIGNMENT">Unassigned</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="PICKED_UP">Picked Up</option>
            <option value="OUT_FOR_DELIVERY">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="EXCEPTION">Exception</option>
          </select>
        </div>
        <div>
          <select value={paymentStatus} onChange={(e) => handleFilterChange("paymentStatus", e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg bg-white">
            <option value="">All Payments</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div>
          <select value={sortBy} onChange={(e) => handleFilterChange("sortBy", e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg bg-white">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount_desc">Highest Amount</option>
            <option value="amount_asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Order #</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Farmer</th>
                <th className="px-4 py-3 text-left">Shop</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Delivery</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {initialOrders.length > 0 ? (
                initialOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-mono font-bold text-gray-900">{order.orderNumber}</div>
                      <div className="text-[10px] text-gray-500">{order.itemCount} item{order.itemCount > 1 ? "s" : ""}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">{order.farmerName}</div>
                      <div className="text-[10px] text-gray-500">{order.farmerPhone}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {order.shopName || <span className="text-gray-400 italic">Multiple Shops</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge status={order.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {order.status === "READY_FOR_DELIVERY" && (!order.deliveryStatus || order.deliveryStatus === "PENDING_ASSIGNMENT") ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          Awaiting Partner
                        </span>
                      ) : order.deliveryStatus ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          order.deliveryStatus === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                          order.deliveryStatus === 'OUT_FOR_DELIVERY' ? 'bg-purple-100 text-purple-800' :
                          order.deliveryStatus === 'ASSIGNED' ? 'bg-blue-100 text-blue-800' :
                          order.deliveryStatus === 'PICKED_UP' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {order.deliveryStatus.replace(/_/g, " ").toLowerCase()}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="font-bold text-gray-900">{formatPrice(order.totalAmount)}</div>
                      <div className={`text-[10px] font-bold ${order.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {order.paymentStatus}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {order.status === "READY_FOR_DELIVERY" && (!order.deliveryStatus || order.deliveryStatus === "PENDING_ASSIGNMENT") && (
                          <Link 
                            href={`/admin/orders/${order.id}`}
                            className="inline-flex items-center justify-center px-2.5 py-1.5 bg-amber-600 text-white text-xs font-bold rounded shadow hover:bg-amber-700 transition-colors"
                            title="Assign Delivery Partner"
                          >
                            + Assign
                          </Link>
                        )}
                        <Link 
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center justify-center px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded shadow hover:bg-gray-800 transition-colors"
                        >
                          Manage
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    <div className="max-w-md mx-auto">
                      <h3 className="text-base font-bold text-gray-900 mb-1">No Orders Found</h3>
                      <p className="text-xs text-gray-500">Try adjusting your filters or search term to find what you're looking for.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pageCount > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Showing <span className="font-bold text-gray-900">{initialOrders.length}</span> of <span className="font-bold text-gray-900">{totalCount}</span> orders
            </span>
            <div className="flex gap-2">
              <button 
                disabled={currentPage <= 1}
                onClick={() => applyFilters({ search, status, paymentStatus, deliveryStatus, sortBy, page: currentPage - 1 })}
                className="px-3 py-1 border border-gray-300 rounded text-sm bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button 
                disabled={currentPage >= pageCount}
                onClick={() => applyFilters({ search, status, paymentStatus, deliveryStatus, sortBy, page: currentPage + 1 })}
                className="px-3 py-1 border border-gray-300 rounded text-sm bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className={`p-3 rounded-xl border ${color} flex flex-col justify-between`}>
      <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{label}</span>
      <span className="text-xl font-black mt-1">{value}</span>
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const getColors = () => {
    switch (status) {
      case "CONFIRMED": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "PENDING": return "bg-amber-100 text-amber-800 border-amber-200";
      case "PROCESSING": return "bg-blue-100 text-blue-800 border-blue-200";
      case "READY_FOR_DELIVERY": return "bg-purple-100 text-purple-800 border-purple-200";
      case "OUT_FOR_DELIVERY": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "DELIVERED": return "bg-green-100 text-green-800 border-green-200";
      case "CANCELLED": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getColors()}`}>
      {status}
    </span>
  );
}
