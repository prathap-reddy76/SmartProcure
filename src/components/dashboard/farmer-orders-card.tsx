"use client";

import React from "react";
import Link from "next/link";
import { SupportedLanguage, CHAT_TRANSLATIONS } from "@/lib/ai/i18n";
import { OrdersIcon, ProcurementIcon } from "@/components/ui/icons";
import { formatDeterministicDate } from "@/lib/date-utils";

interface ActiveOrder {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  totalAmount: string;
  itemsCount: number;
}

interface ActiveProcurement {
  id: string;
  bookingNumber?: string;
  expectedQuantity?: number;
  status: string;
  centre: { name: string };
  crop: { name: string };
  slot: { date: string; startTime: string; endTime: string };
}

export function FarmerOrdersCard({
  activeOrders,
  activeProcurement,
  language = "en",
}: {
  activeOrders: ActiveOrder[];
  activeProcurement: ActiveProcurement[];
  language?: SupportedLanguage;
}) {
  const t = CHAT_TRANSLATIONS[language];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Active Orders Section */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden flex flex-col">
        <div className="p-5 border-b border-gray-100 bg-gray-50/70 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg text-blue-800">
              <OrdersIcon className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-gray-900 tracking-tight">{t.recentOrdersHeading}</h2>
          </div>
          <Link
            href="/farmer/orders"
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline"
          >
            {t.viewAllOrders} &rarr;
          </Link>
        </div>

        <div className="p-5 flex-1 space-y-3">
          {activeOrders.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-gray-500 mb-3">{t.noRecentOrders}</p>
              <Link
                href="/farmer/marketplace"
                className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors inline-block"
              >
                {t.shopNowButton}
              </Link>
            </div>
          ) : (
            activeOrders.map((o) => (
              <div
                key={o.id}
                className="p-3.5 border border-gray-100 rounded-xl bg-gray-50/40 flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900 text-sm">
                      #{o.orderNumber || o.id.slice(-6).toUpperCase()}
                    </p>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded uppercase">
                      {o.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {formatDeterministicDate(o.createdAt)} • {o.itemsCount}{" "}
                    {language === "te" ? "వస్తువులు" : "items"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-gray-900 text-sm">₹{parseFloat(o.totalAmount).toFixed(2)}</p>
                  <Link
                    href={`/farmer/orders/${o.id}`}
                    className="text-xs text-emerald-700 hover:underline font-bold"
                  >
                    {t.trackOrder} &rarr;
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upcoming Procurement Section */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden flex flex-col">
        <div className="p-5 border-b border-gray-100 bg-gray-50/70 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-800">
              <ProcurementIcon className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-gray-900 tracking-tight">{t.upcomingProcurementHeading}</h2>
          </div>
          <Link
            href="/farmer/procurement/bookings"
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline"
          >
            {t.viewAllBookings} &rarr;
          </Link>
        </div>

        <div className="p-5 flex-1 space-y-3">
          {activeProcurement.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-gray-500 mb-3">{t.noRecentBookings}</p>
              <Link
                href="/farmer/procurement/centres"
                className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors inline-block"
              >
                {t.bookSlotButton}
              </Link>
            </div>
          ) : (
            activeProcurement.map((b) => (
              <div
                key={b.id}
                className="p-3.5 border border-gray-100 rounded-xl bg-gray-50/40 flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900 text-sm">{b.centre.name}</p>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded uppercase">
                      {b.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {b.crop.name} • {formatDeterministicDate(b.slot.date)}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono">
                    {b.slot.startTime} - {b.slot.endTime}
                  </p>
                </div>
                <div className="text-right">
                  <Link
                    href={`/farmer/procurement/bookings/${b.id}`}
                    className="text-xs text-emerald-700 hover:underline font-bold"
                  >
                    {language === "te" ? "వివరాలు" : "Details"} &rarr;
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
