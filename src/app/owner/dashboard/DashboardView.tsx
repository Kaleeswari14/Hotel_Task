"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  IndianRupee,
  Receipt,
  Clock,
  Ban,
  Boxes,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  UtensilsCrossed,
  ArrowRight,
  Banknote,
  QrCode,
  CreditCard,
  Flame,
  CalendarCheck,
  KeyRound
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDateTime, formatHumanStock } from "@/lib/format";
import { useLanguage } from "@/context/LanguageContext";

interface DashboardViewProps {
  user: { name: string; username: string; role: string } | null;
  bills: any[];
  payments: any[];
  allStock: any[];
  lowStockItems: any[];
  topSellers: Array<{ name: string; count: number; revenue: number; dietary?: string }>;
  todaySales: number;
  todayOutstanding: number;
  paidBillsCount: number;
  unpaidBillsCount: number;
  cancelledBillsCount: number;
  todayCollected: number;
  todayCash: number;
  todayUpi: number;
  todayCard: number;
  todayVegSales?: number;
  todayNonVegSales?: number;
  todayEggSales?: number;
  todayVegCount?: number;
  todayNonVegCount?: number;
  todayEggCount?: number;
}

export default function DashboardView({
  user,
  bills,
  payments,
  allStock,
  lowStockItems,
  topSellers,
  todaySales,
  todayOutstanding,
  paidBillsCount,
  unpaidBillsCount,
  cancelledBillsCount,
  todayCollected,
  todayCash,
  todayUpi,
  todayCard,
  todayVegSales = 0,
  todayNonVegSales = 0,
  todayEggSales = 0,
  todayVegCount = 0,
  todayNonVegCount = 0,
  todayEggCount = 0,
}: DashboardViewProps) {
  const { isTamil, getFoodName } = useLanguage();
  return (
    <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200/90 shadow-luxury">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Executive Command Hub
            </h1>
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-glow-emerald tracking-wider uppercase">
              Live Terminal
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1 font-semibold">
            Welcome back, <span className="text-slate-900 font-bold">{user?.name || "Owner"}</span>! Real-time restaurant sales, cash drawer reconciliation &amp; settlement analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/owner/users"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs transition-all border border-slate-300 flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-emerald-600" />
            <span>Staff &amp; PINs</span>
          </Link>

          <Link
            href="/owner/day-closing"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4 text-emerald-400" />
            <span>Day Closing</span>
          </Link>

          <Link
            href="/pos"
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl text-xs transition-all shadow-glow-emerald flex items-center gap-2 cursor-pointer"
          >
            <span>Open POS Terminal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <div className="p-4 sm:p-5 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-luxury">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-glow-amber">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-amber-950 text-sm sm:text-base">
                Low Stock Alert: {lowStockItems.length} item(s) below minimum threshold!
              </div>
              <div className="text-xs text-amber-800 mt-0.5 font-medium">
                {lowStockItems
                  .map((i) => `${i.foodItem.name} (${formatHumanStock(i.currentQuantity, i.unitName)})`)
                  .slice(0, 3)
                  .join(", ")}
                {lowStockItems.length > 3 && ` and ${lowStockItems.length - 3} more...`}
              </div>
            </div>
          </div>

          <Link
            href="/owner/stock"
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl transition-all shadow-sm self-start sm:self-auto shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Restock Batches</span>
            <span>&rarr;</span>
          </Link>
        </div>
      )}

      {/* 4 Core Metric Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales */}
        <div className="luxury-card p-5.5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Sales (Paid)
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {formatCurrency(todaySales)}
            </div>
            <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
              ✓ {paidBillsCount} Paid Bills
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20 shadow-glow-emerald">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        {/* Collected Income */}
        <div className="luxury-card p-5.5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Collected Income
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {formatCurrency(todayCollected)}
            </div>
            <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Money in Till &amp; Bank
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center border border-teal-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Outstanding Unpaid */}
        <Link
          href="/bills"
          className="luxury-card p-5.5 flex items-center justify-between group cursor-pointer hover:border-amber-400"
          title="Click to open Active Bills Queue"
        >
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-amber-700 transition-colors flex items-center gap-1">
              <span>Outstanding Unpaid</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-amber-600" />
            </span>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {formatCurrency(todayOutstanding)}
            </div>
            <div className="text-[11px] text-slate-400 font-semibold mt-0.5 group-hover:text-amber-800 transition-colors">
              {unpaidBillsCount} Active Unpaid Bills
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition-all">
            <Clock className="w-6 h-6" />
          </div>
        </Link>

        {/* Low Stock Items */}
        <div className="luxury-card p-5.5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Low Stock Items
            </span>
            <div
              className={`text-2xl font-black mt-1 ${
                lowStockItems.length > 0 ? "text-amber-600" : "text-slate-900"
              }`}
            >
              {lowStockItems.length} Dishes
            </div>
            <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Out of {allStock.length} items
            </div>
          </div>
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              lowStockItems.length > 0 ? "bg-amber-100 text-amber-700 border border-amber-300" : "bg-blue-50 text-blue-600 border border-blue-200"
            }`}
          >
            <Boxes className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Payment Channel Breakdown Box */}
      <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200/90 shadow-luxury space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-emerald-600" />
            Payment Channel Summary ({payments.length} Payments Received)
          </h2>
          <Link href="/owner/payments" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer">
            <span>Payment History</span>
            <span>&rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4.5 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/40 border border-emerald-200/80 flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                💵 Cash In Till
              </div>
              <div className="text-2xl font-black text-emerald-800 mt-1">
                {formatCurrency(todayCash)}
              </div>
            </div>
            <Banknote className="w-8 h-8 text-emerald-600 opacity-70" />
          </div>

          <div className="p-4.5 rounded-2xl bg-gradient-to-br from-sky-50/80 to-blue-50/40 border border-sky-200/80 flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-xs font-black text-sky-900 uppercase tracking-wider">
                📱 UPI / QR In Bank
              </div>
              <div className="text-2xl font-black text-sky-800 mt-1">
                {formatCurrency(todayUpi)}
              </div>
            </div>
            <QrCode className="w-8 h-8 text-sky-600 opacity-70" />
          </div>

          <div className="p-4.5 rounded-2xl bg-gradient-to-br from-purple-50/80 to-indigo-50/40 border border-purple-200/80 flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-xs font-black text-purple-900 uppercase tracking-wider">
                💳 Card Payments
              </div>
              <div className="text-2xl font-black text-purple-800 mt-1">
                {formatCurrency(todayCard)}
              </div>
            </div>
            <CreditCard className="w-8 h-8 text-purple-600 opacity-70" />
          </div>
        </div>
      </div>

      {/* Dietary Classification Sales Breakdown */}
      <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200/90 shadow-luxury space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
            Dietary Category Revenue Breakdown
          </h2>
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
            Live Kitchen Split
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Pure Veg */}
          <div className="p-4.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 flex items-center justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-glow-emerald"></span>
                <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                  🟢 Pure Veg Sales
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-800 mt-1">
                {formatCurrency(todayVegSales)}
              </div>
              <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                {todayVegCount} Portions Sold
              </div>
            </div>
            <div className="text-3xl opacity-90">🥗</div>
          </div>

          {/* Non-Veg */}
          <div className="p-4.5 rounded-2xl bg-rose-50/70 border border-rose-200/90 flex items-center justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shadow-xs"></span>
                <span className="text-xs font-black text-rose-900 uppercase tracking-wider">
                  🔴 Non-Veg Sales
                </span>
              </div>
              <div className="text-2xl font-black text-rose-800 mt-1">
                {formatCurrency(todayNonVegSales)}
              </div>
              <div className="text-[11px] text-rose-700 font-bold mt-0.5">
                {todayNonVegCount} Portions Sold
              </div>
            </div>
            <div className="text-3xl opacity-90">🍗</div>
          </div>

          {/* Egg */}
          <div className="p-4.5 rounded-2xl bg-amber-50/70 border border-amber-200/90 flex items-center justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-glow-amber"></span>
                <span className="text-xs font-black text-amber-900 uppercase tracking-wider">
                  🟡 Egg Sales
                </span>
              </div>
              <div className="text-2xl font-black text-amber-800 mt-1">
                {formatCurrency(todayEggSales)}
              </div>
              <div className="text-[11px] text-amber-700 font-bold mt-0.5">
                {todayEggCount} Portions Sold
              </div>
            </div>
            <div className="text-3xl opacity-90">🥚</div>
          </div>
        </div>
      </div>

      {/* Top Sellers & Recent Bills Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Selling Food Items */}
        <div className="lg:col-span-5 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200/90 shadow-luxury space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              Top Selling Dishes
            </h2>
            <Link href="/owner/menu" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer">
              <span>Menu</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {topSellers.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <div className="text-xs font-semibold">
                No paid sales yet today.
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {topSellers.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/90 hover:bg-white border border-slate-200/70 hover:border-slate-300 transition-all shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-glow-emerald">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {getFoodName({ name: item.name, nameTamil: (item as any).nameTamil })}
                        </span>
                        {item.dietary === "NON_VEG" ? (
                          <span className="inline-flex items-center text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            🔴 {isTamil ? "அசைவம்" : "Non-Veg"}
                          </span>
                        ) : item.dietary === "EGG" ? (
                          <span className="inline-flex items-center text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            🟡 {isTamil ? "முட்டை" : "Egg"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            🟢 {isTamil ? "சைவம்" : "Veg"}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {item.count} Portions Sold
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-black text-emerald-700 text-xs sm:text-sm shrink-0">
                    {formatCurrency(item.revenue)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Bills Activity */}
        <div className="lg:col-span-7 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200/90 shadow-luxury space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-slate-700" />
              Recent Bills Activity
            </h2>
            <Link href="/bills" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer">
              <span>All Bills</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {bills.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <div className="text-xs font-semibold">
                No bills created yet today.
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {bills.slice(0, 5).map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/90 hover:bg-white border border-slate-200/70 hover:border-slate-300 text-xs transition-all shadow-2xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900">
                        Bill #{bill.billNumber}
                      </span>
                      <span className="font-bold text-slate-500">({bill.orderReference})</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      {formatDateTime(bill.createdAt)} &bull; {bill.items.length} items
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-2.5">
                    <div className="font-black text-slate-900 text-sm">{formatCurrency(bill.totalAmount)}</div>
                    <div>
                      {bill.status === "PAID" && (
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300 shadow-2xs">
                          PAID
                        </span>
                      )}
                      {bill.status === "UNPAID" && (
                        <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300 shadow-2xs">
                          UNPAID
                        </span>
                      )}
                      {bill.status === "CANCELLED" && (
                        <span className="text-[10px] font-black text-red-700 bg-red-100 px-2.5 py-1 rounded-full border border-red-300 shadow-2xs">
                          CANCELLED
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
