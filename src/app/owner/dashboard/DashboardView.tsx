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
  KeyRound,
  Eye,
  Sparkles,
  PieChart,
  ArrowUpRight,
  CircleDot
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

  // Dietary percentages
  const totalDietarySales = todayVegSales + todayNonVegSales + todayEggSales || 1;
  const vegPct = Math.round((todayVegSales / totalDietarySales) * 100);
  const nonVegPct = Math.round((todayNonVegSales / totalDietarySales) * 100);
  const eggPct = 100 - vegPct - nonVegPct;

  // Payment percentages
  const totalPayments = todayCash + todayUpi + todayCard || 1;
  const cashPct = Math.round((todayCash / totalPayments) * 100);
  const upiPct = Math.round((todayUpi / totalPayments) * 100);
  const cardPct = 100 - cashPct - upiPct;

  return (
    <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 text-slate-800">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER HERO BANNER */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
              Live Business Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isTamil ? "வணிக மேலாண்மை டாஷ்போர்டு" : "Executive Command Dashboard"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {isTamil ? `வணக்கம், ${user?.name || "உரிமையாளர்"}! இன்றைய நேரடி விற்பனை மற்றும் கணக்கு விவரங்கள்.` : `Welcome back, ${user?.name || "Owner"}! Real-time sales, payment reconciliation & insights.`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/owner/users"
            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs transition-all border border-slate-200 flex items-center gap-2 shadow-2xs hover:scale-102 active:scale-98"
          >
            <KeyRound className="w-4 h-4 text-slate-500" />
            <span>Staff & PINs</span>
          </Link>

          <Link
            href="/owner/day-closing"
            className="px-4 py-2.5 bg-orange-50 hover:bg-orange-100 text-[#ff5722] font-black rounded-2xl text-xs transition-all border border-orange-200 shadow-2xs flex items-center gap-2 hover:scale-102 active:scale-98"
          >
            <CalendarCheck className="w-4 h-4 text-[#ff5722]" />
            <span>{isTamil ? "நாள் முடிவு கணக்கு" : "Day Closing"}</span>
          </Link>

          <Link
            href="/pos"
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 via-[#ff5722] to-amber-500 hover:from-orange-600 hover:to-orange-700 text-white font-black rounded-2xl text-xs transition-all shadow-md shadow-orange-500/20 flex items-center gap-2 hover:scale-102 active:scale-98"
          >
            <span>{isTamil ? "POS பில் போடவும்" : "Open POS Terminal"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. LOW STOCK ALERT (Clean Slim Banner) */}
      {/* ========================================================================= */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-amber-950 text-xs sm:text-sm">
                {isTamil ? `இருப்பு எச்சரிக்கை: ${lowStockItems.length} உணவுகள் குறைந்த அளவில் உள்ளன!` : `Low Stock Alert: ${lowStockItems.length} items below minimum threshold!`}
              </div>
              <div className="text-[11px] text-amber-800 font-medium">
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
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl transition-all shadow-2xs shrink-0 self-start sm:self-auto flex items-center gap-1.5 cursor-pointer"
          >
            <span>{isTamil ? "இருப்பு புதுப்பிக்க" : "Restock Items"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FOUR CORE SUMMARY CARDS (Clean White, Crisp Typography, No Ugly Tints) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Sales */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-orange-300 transition-all group flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              {isTamil ? "மொத்த விற்பனை (செலுத்தப்பட்டது)" : "Total Sales (Paid)"}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#ff5722] border border-orange-100 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {formatCurrency(todaySales)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{paidBillsCount} {isTamil ? "முடிக்கப்பட்ட பில்கள்" : "Paid Bills Today"}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Collected Income */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-orange-300 transition-all group flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              {isTamil ? "வசூலான வருமானம்" : "Collected Income"}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-emerald-600 tracking-tight">
              {formatCurrency(todayCollected)}
            </div>
            <div className="text-[11px] font-semibold text-slate-400 mt-1">
              {isTamil ? "பெட்டி மற்றும் வங்கியில் வரவு" : "Cash in Till & Bank Deposit"}
            </div>
          </div>
        </div>

        {/* Card 3: Outstanding Unpaid */}
        <Link
          href="/bills"
          className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-orange-300 transition-all group flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider group-hover:text-[#ff5722] transition-colors">
              {isTamil ? "நிலுவைத் தொகை" : "Outstanding Unpaid"}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-amber-600 tracking-tight">
              {formatCurrency(todayOutstanding)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 mt-1 group-hover:underline">
              <span>{unpaidBillsCount} {isTamil ? "நிலுவையில் உள்ள பில்கள்" : "Unpaid Active Bills"}</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </Link>

        {/* Card 4: Low Stock Alert */}
        <Link
          href="/owner/stock"
          className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-orange-300 transition-all group flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider group-hover:text-[#ff5722] transition-colors">
              {isTamil ? "குறைந்த இருப்பு" : "Low Stock Items"}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {lowStockItems.length} <span className="text-base font-bold text-slate-400">/ {allStock.length}</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-400 mt-1">
              {lowStockItems.length === 0 ? (
                <span className="text-emerald-600 font-bold">✓ All items in stock</span>
              ) : (
                <span className="text-rose-600 font-bold">{lowStockItems.length} items need restock</span>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* 4. PAYMENT RECONCILIATION & DIETARY SALES (Two-Column Balanced Cards) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Payment Channels Breakdown Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#ff5722] flex items-center justify-center font-black">
                <Banknote className="w-4 h-4" />
              </div>
              <h2 className="text-base font-black text-slate-900">
                {isTamil ? "பணம் செலுத்தும் முறைகள்" : "Payment Channels"}
              </h2>
            </div>
            <Link href="/owner/payments" className="text-xs font-bold text-[#ff5722] hover:underline flex items-center gap-1">
              <span>{isTamil ? "அனைத்தும்" : "View History"}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Progress Bar Split */}
          <div className="space-y-1.5">
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div style={{ width: `${cashPct}%` }} className="bg-[#ff5722] transition-all duration-500" title={`Cash: ${cashPct}%`}></div>
              <div style={{ width: `${upiPct}%` }} className="bg-sky-500 transition-all duration-500" title={`UPI: ${upiPct}%`}></div>
              <div style={{ width: `${cardPct}%` }} className="bg-purple-500 transition-all duration-500" title={`Card: ${cardPct}%`}></div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
              <span>Cash {cashPct}%</span>
              <span>UPI {upiPct}%</span>
              <span>Card {cardPct}%</span>
            </div>
          </div>

          {/* 3 Payment Channels */}
          <div className="grid grid-cols-3 gap-3">
            {/* Cash */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-[#ff5722]"></span>
                <span>{isTamil ? "ரொக்கம் (Cash)" : "Cash in Till"}</span>
              </div>
              <div className="text-xl font-black text-slate-900">{formatCurrency(todayCash)}</div>
              <div className="text-[10px] text-slate-400 font-semibold">{cashPct}% share</div>
            </div>

            {/* UPI */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                <span>{isTamil ? "UPI / QR" : "UPI / Online"}</span>
              </div>
              <div className="text-xl font-black text-slate-900">{formatCurrency(todayUpi)}</div>
              <div className="text-[10px] text-slate-400 font-semibold">{upiPct}% share</div>
            </div>

            {/* Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>{isTamil ? "கார்டு (Card)" : "Card POS"}</span>
              </div>
              <div className="text-xl font-black text-slate-900">{formatCurrency(todayCard)}</div>
              <div className="text-[10px] text-slate-400 font-semibold">{cardPct}% share</div>
            </div>
          </div>
        </div>

        {/* Dietary Classification Sales Split Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <h2 className="text-base font-black text-slate-900">
                {isTamil ? "உணவு வகை விற்பனை" : "Dietary Sales Split"}
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {isTamil ? "நேரடி சமையலறை கணக்கு" : "Kitchen Breakdown"}
            </span>
          </div>

          {/* Progress Bar Split */}
          <div className="space-y-1.5">
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div style={{ width: `${vegPct}%` }} className="bg-emerald-500 transition-all duration-500" title={`Veg: ${vegPct}%`}></div>
              <div style={{ width: `${nonVegPct}%` }} className="bg-rose-500 transition-all duration-500" title={`Non-Veg: ${nonVegPct}%`}></div>
              <div style={{ width: `${eggPct}%` }} className="bg-amber-400 transition-all duration-500" title={`Egg: ${eggPct}%`}></div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
              <span>Veg {vegPct}%</span>
              <span>Non-Veg {nonVegPct}%</span>
              <span>Egg {eggPct}%</span>
            </div>
          </div>

          {/* 3 Dietary Categories */}
          <div className="grid grid-cols-3 gap-3">
            {/* Pure Veg */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-600 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{isTamil ? "சைவம்" : "Pure Veg"}</span>
              </div>
              <div className="text-xl font-black text-slate-900">{formatCurrency(todayVegSales)}</div>
              <div className="text-[10px] text-emerald-600 font-bold">{todayVegCount} {isTamil ? "ஆர்டர்கள்" : "portions"}</div>
            </div>

            {/* Non-Veg */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-600 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>{isTamil ? "அசைவம்" : "Non-Veg"}</span>
              </div>
              <div className="text-xl font-black text-slate-900">{formatCurrency(todayNonVegSales)}</div>
              <div className="text-[10px] text-rose-600 font-bold">{todayNonVegCount} {isTamil ? "ஆர்டர்கள்" : "portions"}</div>
            </div>

            {/* Egg */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-600 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>{isTamil ? "முட்டை" : "Egg Special"}</span>
              </div>
              <div className="text-xl font-black text-slate-900">{formatCurrency(todayEggSales)}</div>
              <div className="text-[10px] text-amber-700 font-bold">{todayEggCount} {isTamil ? "ஆர்டர்கள்" : "portions"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. TOP DISHES & RECENT BILLS STREAM (Two-Column Balanced Grid) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Top Selling Dishes */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#ff5722]" />
                <h2 className="text-base font-black text-slate-900">
                  {isTamil ? "அதிகம் விற்பனையான உணவுகள்" : "Top Selling Dishes"}
                </h2>
              </div>
              <Link href="/owner/menu" className="text-xs font-bold text-[#ff5722] hover:underline flex items-center gap-1">
                <span>{isTamil ? "மெனு" : "Menu"}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="mt-3">
              {topSellers.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <div className="text-xs font-semibold">
                    {isTamil ? "இன்று இன்னும் பில்கள் விற்பனையாகவில்லை." : "No sales recorded yet today."}
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {topSellers.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-orange-50/50 border border-slate-100 hover:border-orange-200 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                              {getFoodName({ name: item.name, nameTamil: (item as any).nameTamil })}
                            </span>
                            {item.dietary === "NON_VEG" ? (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                                🔴 Non-Veg
                              </span>
                            ) : item.dietary === "EGG" ? (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                🟡 Egg
                              </span>
                            ) : (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700">
                                🟢 Veg
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium">
                            {item.count} {isTamil ? "ஆர்டர்கள் விற்கப்பட்டது" : "portions sold"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-black text-[#ff5722] text-xs sm:text-sm shrink-0">
                        {formatCurrency(item.revenue)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Bills Stream */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-slate-700" />
                <h2 className="text-base font-black text-slate-900">
                  {isTamil ? "சமீபத்திய பில் செயல்பாடுகள்" : "Recent Orders & Bills"}
                </h2>
              </div>
              <Link href="/bills" className="text-xs font-bold text-[#ff5722] hover:underline flex items-center gap-1">
                <span>{isTamil ? "அனைத்து பில்கள்" : "All Bills"}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="mt-3">
              {bills.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <div className="text-xs font-semibold">
                    {isTamil ? "இன்று எந்த பில்களும் உருவாக்கப்படவில்லை." : "No bills recorded yet today."}
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {bills.slice(0, 5).map((bill) => (
                    <div
                      key={bill.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-orange-50/40 border border-slate-100 hover:border-orange-200 transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-xs sm:text-sm">
                            Bill #{bill.billNumber}
                          </span>
                          <span className="font-bold text-slate-500 text-xs">({bill.orderReference})</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                          {formatDateTime(bill.createdAt)} &bull; {bill.items.length} {isTamil ? "பொருட்கள்" : "items"}
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-3">
                        <div className="font-black text-slate-900 text-sm">{formatCurrency(bill.totalAmount)}</div>
                        <div>
                          {bill.status === "PAID" && (
                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                              PAID
                            </span>
                          )}
                          {bill.status === "UNPAID" && (
                            <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
                              UNPAID
                            </span>
                          )}
                          {bill.status === "CANCELLED" && (
                            <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full border border-rose-300">
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

      </div>

    </div>
  );
}
