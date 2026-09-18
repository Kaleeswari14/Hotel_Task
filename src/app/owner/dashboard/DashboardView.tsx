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
  Languages,
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
  topSellers: Array<{ name: string; nameTamil?: string | null; count: number; revenue: number; dietary?: string }>;
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
  const { language: lang, setLanguage: setLang } = useLanguage();

  return (
    <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header with Language Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">
              {lang === "ta" ? "ஹோட்டல் மேலாண்மை டேஷ்போர்டு" : "Owner Command Dashboard"}
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
              {lang === "ta" ? "நேரலை பார்வை (Live)" : "OWNER TERMINAL"}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            {lang === "ta"
              ? `வணக்கம், ${user?.name || "உரிமையாளர்"}! இன்றைய நேரடி விற்பனை, ரொக்க வசூல், இருப்பு மற்றும் பில் விபரங்கள்.`
              : `Welcome back, ${user?.name}. Real-time monitoring of sales, physical collection, inventory & settlements.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/owner/users"
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-all border border-slate-300 flex items-center gap-1.5 shadow-2xs"
          >
            <KeyRound className="w-4 h-4 text-emerald-600" />
            <span>{lang === "ta" ? "பாஸ்வேர்ட் / பயனர்கள்" : "Users & Pass"}</span>
          </Link>

          <Link
            href="/owner/day-closing"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
          >
            <CalendarCheck className="w-4 h-4 text-emerald-400" />
            <span>{lang === "ta" ? "நாள் முடிவு (Day Closing)" : "Day Closing"}</span>
          </Link>

          <Link
            href="/pos"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
          >
            <span>{lang === "ta" ? "POS பில்லிங் திறக்க" : "Open POS Terminal"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <div className="p-4 sm:p-5 bg-amber-500/10 border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-amber-950 text-sm sm:text-base">
                {lang === "ta"
                  ? `⚠️ குறைந்த இருப்பு எச்சரிக்கை: ${lowStockItems.length} உணவுகள் குறைந்தபட்ச இருப்பு அளவை விட குறைவாக உள்ளன!`
                  : `Low Stock Warning: ${lowStockItems.length} item(s) below minimum safety threshold!`}
              </div>
              <div className="text-xs text-amber-800 mt-0.5 font-medium">
                {lowStockItems
                  .map((i) => `${lang === "ta" ? (i.foodItem.nameTamil || i.foodItem.name) : i.foodItem.name} (${formatHumanStock(i.currentQuantity, i.unitName)})`)
                  .slice(0, 3)
                  .join(", ")}
                {lowStockItems.length > 3 && (lang === "ta" ? ` மற்றும் மேலும் ${lowStockItems.length - 3} உணவுகள்...` : ` and ${lowStockItems.length - 3} more...`)}
              </div>
            </div>
          </div>

          <Link
            href="/owner/stock"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm self-start sm:self-auto shrink-0 flex items-center gap-1.5"
          >
            <span>{lang === "ta" ? "இருப்பு புதுப்பிக்க" : "Restock Now"}</span>
            <span>&rarr;</span>
          </Link>
        </div>
      )}

      {/* 4 Core Metric Banners (Sales vs Income vs Outstanding) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {lang === "ta" ? "இன்றைய மொத்த விற்பனை" : "Total Sales (Paid)"}
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {formatCurrency(todaySales)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {lang === "ta" ? `${paidBillsCount} பில்கள் முடிந்தது` : `${paidBillsCount} Paid Bills`}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        {/* Collected Income */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {lang === "ta" ? "வசூலான மொத்த தொகை" : "Collected Income"}
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {formatCurrency(todayCollected)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {lang === "ta" ? "ரொக்கம் & வங்கி கணக்கில் உள்ளது" : "Money in Till & Bank"}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Outstanding Unpaid - Clickable link to /bills */}
        <Link
          href="/bills"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 hover:shadow-md transition-all flex items-center justify-between group cursor-pointer"
          title={lang === "ta" ? "நிலுவை பில்களை பார்க்க கிளிக் செய்க" : "Click to open Active Bills Queue"}
        >
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-amber-700 transition-colors flex items-center gap-1">
              <span>{lang === "ta" ? "நிலுவை / பாக்கித் தொகை" : "Outstanding Unpaid"}</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-amber-600" />
            </span>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {formatCurrency(todayOutstanding)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 group-hover:text-slate-600 transition-colors">
              {lang === "ta" ? `${unpaidBillsCount} பில்கள் இன்னும் பாக்கி (பார்க்க கிளிக்)` : `${unpaidBillsCount} Active Unpaid Bills (Click to view)`}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 group-hover:scale-105 transition-all">
            <Clock className="w-6 h-6" />
          </div>
        </Link>

        {/* Low Stock Items */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {lang === "ta" ? "குறைந்த இருப்பு உணவுகள்" : "Low Stock Items"}
            </span>
            <div
              className={`text-2xl font-black mt-1 ${
                lowStockItems.length > 0 ? "text-amber-600" : "text-slate-900"
              }`}
            >
              {lowStockItems.length} {lang === "ta" ? "உணவுகள்" : "Dishes"}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {lang === "ta" ? `மொத்தம் ${allStock.length} உணவுகளில்` : `Out of ${allStock.length} items`}
            </div>
          </div>
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              lowStockItems.length > 0 ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-600"
            }`}
          >
            <Boxes className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Payment Channel Breakdown Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-emerald-600" />
            {lang === "ta"
              ? `பணம் செலுத்திய விபரம் (${payments.length} பரிவர்த்தனைகள்)`
              : `Payment Channel Summary (${payments.length} Payments Received)`}
          </h2>
          <Link href="/owner/payments" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            <span>{lang === "ta" ? "அனைத்து பரிவர்த்தனைகள்" : "Payment History"}</span>
            <span>&rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-900 uppercase">
                {lang === "ta" ? "💵 கல்லா ரொக்கம் (Cash)" : "💵 Cash In Till"}
              </div>
              <div className="text-2xl font-black text-emerald-800 mt-1">
                {formatCurrency(todayCash)}
              </div>
            </div>
            <Banknote className="w-8 h-8 text-emerald-600 opacity-60" />
          </div>

          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-blue-900 uppercase">
                {lang === "ta" ? "📱 கூகுள்பே / QR வங்கி வரவு (UPI)" : "📱 UPI / QR In Bank"}
              </div>
              <div className="text-2xl font-black text-blue-800 mt-1">
                {formatCurrency(todayUpi)}
              </div>
            </div>
            <QrCode className="w-8 h-8 text-blue-600 opacity-60" />
          </div>

          <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-purple-900 uppercase">
                {lang === "ta" ? "💳 கார்டு வரவு (Card)" : "💳 Card Payments"}
              </div>
              <div className="text-2xl font-black text-purple-800 mt-1">
                {formatCurrency(todayCard)}
              </div>
            </div>
            <CreditCard className="w-8 h-8 text-purple-600 opacity-60" />
          </div>
        </div>
      </div>

      {/* Dietary Classification Sales Breakdown (Veg vs Non-Veg vs Egg) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
            {lang === "ta"
              ? "உணவு வகை வாரியாக விற்பனை (Dietary Sales Analysis)"
              : "Veg vs Non-Veg Sales Breakdown"}
          </h2>
          <span className="text-xs font-bold text-slate-400">
            {lang === "ta" ? "நேரலை விற்பனை விகிதம்" : "Live Category Split"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Pure Veg */}
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-300 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span className="text-xs font-black text-emerald-900 uppercase">
                  {lang === "ta" ? "🟢 சைவ விற்பனை (Veg)" : "🟢 Pure Veg Sales"}
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-800 mt-1">
                {formatCurrency(todayVegSales)}
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                {todayVegCount} {lang === "ta" ? "பங்குகள் விற்பனை" : "Portions Sold"}
              </div>
            </div>
            <div className="text-3xl opacity-80">🥗</div>
          </div>

          {/* Non-Veg */}
          <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-300 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                <span className="text-xs font-black text-rose-900 uppercase">
                  {lang === "ta" ? "🔴 அசைவ விற்பனை (Non-Veg)" : "🔴 Non-Veg Sales"}
                </span>
              </div>
              <div className="text-2xl font-black text-rose-800 mt-1">
                {formatCurrency(todayNonVegSales)}
              </div>
              <div className="text-[11px] text-rose-700 font-semibold mt-0.5">
                {todayNonVegCount} {lang === "ta" ? "பங்குகள் விற்பனை" : "Portions Sold"}
              </div>
            </div>
            <div className="text-3xl opacity-80">🍗</div>
          </div>

          {/* Egg */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-xs font-black text-amber-900 uppercase">
                  {lang === "ta" ? "🟡 முட்டை விற்பனை (Egg)" : "🟡 Egg Sales"}
                </span>
              </div>
              <div className="text-2xl font-black text-amber-800 mt-1">
                {formatCurrency(todayEggSales)}
              </div>
              <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
                {todayEggCount} {lang === "ta" ? "பங்குகள் விற்பனை" : "Portions Sold"}
              </div>
            </div>
            <div className="text-3xl opacity-80">🥚</div>
          </div>
        </div>
      </div>

      {/* Top Sellers & Recent Bills Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Selling Food Items (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              {lang === "ta" ? "அதிகம் விற்பனையான உணவுகள்" : "Top Selling Dishes"}
            </h2>
            <Link href="/owner/menu" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              <span>{lang === "ta" ? "மெனு" : "Menu"}</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {topSellers.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <div className="text-xs font-semibold">
                {lang === "ta" ? "இன்று இன்னும் விற்பனை இல்லை." : "No paid sales yet today."}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {topSellers.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {lang === "ta" ? (item.nameTamil || item.name) : item.name}
                        </span>
                        {item.dietary === "NON_VEG" ? (
                          <span className="inline-flex items-center text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-200">
                            🔴 Non-Veg
                          </span>
                        ) : item.dietary === "EGG" ? (
                          <span className="inline-flex items-center text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                            🟡 Egg
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                            🟢 Veg
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.count} {lang === "ta" ? "பங்குகள் விற்பனை" : "Portions Sold"}
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

        {/* Recent Bills (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-slate-700" />
              {lang === "ta" ? "சமீபத்திய பில் விபரங்கள்" : "Recent Bills Activity"}
            </h2>
            <Link href="/bills" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              <span>{lang === "ta" ? "அனைத்து பில்கள்" : "All Bills"}</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {bills.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <div className="text-xs font-semibold">
                {lang === "ta" ? "இன்று இன்னும் பில்கள் போடப்படவில்லை." : "No bills created yet today."}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {bills.slice(0, 5).map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900">
                        {lang === "ta" ? `பில் #${bill.billNumber}` : `Bill #${bill.billNumber}`}
                      </span>
                      <span className="font-semibold text-slate-600">({bill.orderReference})</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {formatDateTime(bill.createdAt)} &bull; {bill.items.length} {lang === "ta" ? "உணவுகள்" : "items"}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-slate-900">{formatCurrency(bill.totalAmount)}</div>
                    <div>
                      {bill.status === "PAID" && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {lang === "ta" ? "செலுத்தப்பட்டது" : "PAID"}
                        </span>
                      )}
                      {bill.status === "UNPAID" && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          {lang === "ta" ? "நிலுவை" : "UNPAID"}
                        </span>
                      )}
                      {bill.status === "CANCELLED" && (
                        <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                          {lang === "ta" ? "ரத்து செய்யப்பட்டது" : "CANCELLED"}
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
