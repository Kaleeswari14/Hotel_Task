"use client";

import React, { useState } from "react";
import {
  CalendarCheck,
  Lock,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  Banknote,
  QrCode,
  CreditCard,
  Clock,
  Ban,
  Boxes,
  FileText,
  Check,
  Calendar,
  Share2,
  MessageSquare,
  UtensilsCrossed,
  Send,
  Smartphone,
  Sparkles,
  Settings,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { formatCurrency, formatDateTime, formatHumanStock } from "@/lib/format";
import { useLanguage } from "@/context/LanguageContext";

interface StockSnapshotItem {
  foodName: string;
  category: string;
  dietary?: string;
  quantity: number;
  unitName: string;
  minThreshold: number;
}

interface DayClosingData {
  id: string;
  closingDate: string;
  totalBills: number;
  paidBills: number;
  unpaidBills: number;
  cancelledBills: number;
  totalSales: number;
  totalCollected: number;
  cashCollected: number;
  upiCollected: number;
  cardCollected: number;
  outstandingAmount: number;
  cancelledAmount: number;
  closingStockJson: string;
  notes: string | null;
  closedAt: string;
  closedBy: { name: string; username: string };
}

interface DayClosingViewProps {
  todayDate: string;
  initialIsClosed: boolean;
  initialTodayClosing: DayClosingData | null;
  initialPreview: {
    totalBills: number;
    paidBills: number;
    unpaidBills: number;
    cancelledBills: number;
    totalSales: number;
    totalCollected: number;
    cashCollected: number;
    upiCollected: number;
    cardCollected: number;
    outstandingAmount: number;
    cancelledAmount: number;
    todayVegSales?: number;
    todayNonVegSales?: number;
    todayEggSales?: number;
    todayVegCount?: number;
    todayNonVegCount?: number;
    todayEggCount?: number;
    stockSnapshot: StockSnapshotItem[];
  };
  initialHistory: DayClosingData[];
}

export default function DayClosingView({
  todayDate,
  initialIsClosed,
  initialTodayClosing,
  initialPreview,
  initialHistory,
}: DayClosingViewProps) {
  const { language, isTamil, getFoodName, getCategoryName } = useLanguage();
  const [isClosed, setIsClosed] = useState(initialIsClosed);
  const [todayClosing, setTodayClosing] = useState<DayClosingData | null>(initialTodayClosing);
  const [preview, setPreview] = useState(initialPreview);
  const [history, setHistory] = useState<DayClosingData[]>(initialHistory);

  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<DayClosingData | null>(null);

  // Owner WhatsApp Phone State (Persisted in localStorage)
  const [ownerPhone, setOwnerPhone] = useState("");
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [tempPhone, setTempPhone] = useState("");
  const [isSendingApi, setIsSendingApi] = useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem("owner_whatsapp_phone") || "";
    setOwnerPhone(saved);
    setTempPhone(saved);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleSavePhone = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tempPhone.trim().replace(/\D/g, "");
    if (clean.length < 10) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }
    setOwnerPhone(clean);
    localStorage.setItem("owner_whatsapp_phone", clean);
    setShowPhoneModal(false);
    showToast(`✅ Owner WhatsApp Number set to +91 ${clean.slice(-10)}`);
  };

  // Build Night Summary text
  const buildNightSummaryText = () => {
    const data = isClosed && todayClosing ? todayClosing : preview;
    const hotelName = process.env.NEXT_PUBLIC_HOTEL_NAME || "HOTEL JB";

    return `🏨 *${hotelName} — NIGHT CLOSING REPORT* 🌙
📅 *Date:* ${todayDate}

💰 *Sales & Collections:*
• Total Paid Bills: ${data.paidBills}
• Total Sales: ${formatCurrency(data.totalSales)}
• Total Collected: ${formatCurrency(data.totalCollected)}
• Outstanding Unpaid: ${formatCurrency(data.outstandingAmount)}

🥗 *Dietary Breakdown:*
• 🟢 Pure Veg: ${formatCurrency(preview.todayVegSales || 0)} (${preview.todayVegCount || 0} portions)
• 🔴 Non-Veg: ${formatCurrency(preview.todayNonVegSales || 0)} (${preview.todayNonVegCount || 0} portions)
• 🟡 Egg: ${formatCurrency(preview.todayEggSales || 0)} (${preview.todayEggCount || 0} portions)

💵 *Payment Channel Breakdown:*
• Cash in Hand: ${formatCurrency(data.cashCollected)}
• UPI / Online: ${formatCurrency(data.upiCollected)}
• Card: ${formatCurrency(data.cardCollected)}

${isClosed && todayClosing?.notes ? `📝 *Closing Notes:* ${todayClosing.notes}\n` : ""}
✅ *Day Status:* ${isClosed ? "CLOSED & SETTLED" : "ACTIVE PREVIEW"}
*** End of Day Summary ***`;
  };

  // Direct API Send to Owner WhatsApp
  const handleSendViaApi = async () => {
    let targetPhone = ownerPhone;
    if (!targetPhone || targetPhone.length < 10) {
      setShowPhoneModal(true);
      return;
    }

    setIsSendingApi(true);
    try {
      const messageText = buildNightSummaryText();
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: targetPhone,
          customerName: "Hotel Owner",
          billNumber: 0,
          message: messageText,
        }),
      });

      const result = await res.json();
      if (result.success) {
        showToast(`⚡ Night Closing Report delivered directly to Owner WhatsApp (+91 ${targetPhone.slice(-10)})!`);
      } else {
        throw new Error(result.error || "Failed to dispatch via WhatsApp API");
      }
    } catch (err: any) {
      alert(`WhatsApp API Send Error: ${err.message || "Failed to send message. Please ensure WhatsApp engine is connected."}`);
    } finally {
      setIsSendingApi(false);
    }
  };

  const handleCloseDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm(`Are you sure you want to finalize and close the business day for ${todayDate}?`)) return;

    setLoading(true);
    try {
      const res = await fetch("/api/reports/day-closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to close day");

      setIsClosed(true);
      setTodayClosing(data.dayClosing);
      showToast(`Business day closed successfully for ${todayDate}`);

      // Refresh data
      const refreshRes = await fetch("/api/reports/day-closing");
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setHistory(refreshData.history);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const data = isClosed && todayClosing ? todayClosing : preview;

  // Dietary percentages
  const totalDietarySales = (preview.todayVegSales || 0) + (preview.todayNonVegSales || 0) + (preview.todayEggSales || 0) || 1;
  const vegPct = Math.round(((preview.todayVegSales || 0) / totalDietarySales) * 100);
  const nonVegPct = Math.round(((preview.todayNonVegSales || 0) / totalDietarySales) * 100);
  const eggPct = 100 - vegPct - nonVegPct;

  // Payment percentages
  const totalPayments = (data.cashCollected || 0) + (data.upiCollected || 0) + (data.cardCollected || 0) || 1;
  const cashPct = Math.round(((data.cashCollected || 0) / totalPayments) * 100);
  const upiPct = Math.round(((data.upiCollected || 0) / totalPayments) * 100);
  const cardPct = 100 - cashPct - upiPct;

  return (
    <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 text-slate-800">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-[#ff5722] text-sm font-bold animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-[#ff5722] shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HEADER BANNER */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              📅 {todayDate}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isTamil ? "நாள் முடிவு மற்றும் கணக்கு சமரசம்" : "Day Closing & Night Settlement"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {isTamil ? "இன்றைய மொத்த விற்பனை, பணப் பெட்டி சமரசம் மற்றும் வாட்ஸ்அப் அறிக்கை அனுப்புதல்." : "Reconcile daily sales, collections, cash drawer balance, and dispatch automated WhatsApp report."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Owner Phone Setting Button */}
          <button
            type="button"
            onClick={() => setShowPhoneModal(true)}
            className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
            title="Configure Owner WhatsApp Phone Number"
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>
              {ownerPhone ? `+91 ${ownerPhone.slice(-10)}` : (isTamil ? "எண் மாற்ற" : "Set Owner Phone")}
            </span>
            <Settings className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* 1-Click Direct WhatsApp API Dispatch */}
          <button
            type="button"
            onClick={handleSendViaApi}
            disabled={isSendingApi}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-black text-xs rounded-2xl shadow-md shadow-emerald-600/20 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
            title="Send Night Closing Report directly via WhatsApp API to owner mobile"
          >
            <Send className={`w-3.5 h-3.5 ${isSendingApi ? "animate-spin" : ""}`} />
            <span>{isSendingApi ? "Sending..." : (isTamil ? "வாட்ஸ்அப் அறிக்கை அனுப்பு" : "⚡ Send to Owner WhatsApp")}</span>
          </button>

          {isClosed ? (
            <div className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 text-emerald-800 font-black text-xs rounded-2xl border border-emerald-200 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{isTamil ? "கணக்கு முடிக்கப்பட்டது" : "SETTLED & CLOSED"}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-50 text-amber-800 font-black text-xs rounded-2xl border border-amber-200 shadow-2xs">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>{isTamil ? "நடப்பில் உள்ளது" : "ACTIVE (OPEN)"}</span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FOUR CORE METRIC CARDS (Clean Solid White Luxury Styling) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Sales */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              {isTamil ? "மொத்த விற்பனை (செலுத்தப்பட்டது)" : "Total Sales (Paid)"}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {formatCurrency(data.totalSales)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{data.paidBills} {isTamil ? "முடிக்கப்பட்ட பில்கள்" : "Completed Bills"}</span>
            </div>
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              {isTamil ? "வசூலான வருமானம்" : "Total Collected"}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-teal-600 tracking-tight">
              {formatCurrency(data.totalCollected)}
            </div>
            <div className="text-[11px] font-semibold text-slate-400 mt-1">
              {isTamil ? "பெறப்பட்ட தொகை" : "Actual Money Received"}
            </div>
          </div>
        </div>

        {/* Outstanding Unpaid */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber-300 transition-all group flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              {isTamil ? "நிலுவைத் தொகை" : "Outstanding Unpaid"}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-amber-600 tracking-tight">
              {formatCurrency(data.outstandingAmount)}
            </div>
            <div className="text-[11px] font-bold text-amber-700 mt-1">
              {data.unpaidBills} {isTamil ? "நிலுவை ஆர்டர்கள்" : "Unpaid Orders"}
            </div>
          </div>
        </div>

        {/* Cancelled / Void */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-rose-300 transition-all group flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              {isTamil ? "ரத்து செய்யப்பட்டவை" : "Cancelled / Void"}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Ban className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-rose-600 tracking-tight">
              {formatCurrency(data.cancelledAmount)}
            </div>
            <div className="text-[11px] font-bold text-rose-700 mt-1">
              {data.cancelledBills} {isTamil ? "ரத்து செய்யப்பட்ட ஆர்டர்கள்" : "Cancelled Orders"}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. PAYMENT RECONCILIATION & DIETARY SPLIT (Two-Column Balanced Cards) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Payment Channels Reconciliation Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                <Banknote className="w-4 h-4" />
              </div>
              <h2 className="text-base font-black text-slate-900">
                {isTamil ? "பண வரவு சமரசம்" : "Payment Channels Reconciliation"}
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isTamil ? "நேரடிப் பிரிவு" : "Real-time Split"}
            </span>
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
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-[#ff5722]"></span>
                <span>{isTamil ? "ரொக்கம்" : "Cash in Till"}</span>
              </div>
              <div className="text-xl font-black text-slate-900">{formatCurrency(data.cashCollected)}</div>
              <div className="text-[10px] text-slate-400 font-semibold">{cashPct}% share</div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                <span>{isTamil ? "UPI / QR" : "UPI / Online"}</span>
              </div>
              <div className="text-xl font-black text-slate-900">{formatCurrency(data.upiCollected)}</div>
              <div className="text-[10px] text-slate-400 font-semibold">{upiPct}% share</div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>{isTamil ? "கார்டு" : "Card POS"}</span>
              </div>
              <div className="text-xl font-black text-slate-900">{formatCurrency(data.cardCollected)}</div>
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
              {isTamil ? "சமையலறை கணக்கு" : "Kitchen Breakdown"}
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
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-600 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{isTamil ? "சைவம்" : "Pure Veg"}</span>
              </div>
              <div className="text-xl font-black text-slate-900">{formatCurrency(preview.todayVegSales || 0)}</div>
              <div className="text-[10px] text-emerald-600 font-bold">{preview.todayVegCount || 0} {isTamil ? "ஆர்டர்கள்" : "portions"}</div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-600 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>{isTamil ? "அசைவம்" : "Non-Veg"}</span>
              </div>
              <div className="text-xl font-black text-slate-900">{formatCurrency(preview.todayNonVegSales || 0)}</div>
              <div className="text-[10px] text-rose-600 font-bold">{preview.todayNonVegCount || 0} {isTamil ? "ஆர்டர்கள்" : "portions"}</div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-600 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>{isTamil ? "முட்டை" : "Egg"}</span>
              </div>
              <div className="text-xl font-black text-slate-900">{formatCurrency(preview.todayEggSales || 0)}</div>
              <div className="text-[10px] text-amber-700 font-bold">{preview.todayEggCount || 0} {isTamil ? "ஆர்டர்கள்" : "portions"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CLOSING INVENTORY SNAPSHOT & FINAL SETTLEMENT ACTION */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Closing Stock Snapshot */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-black text-slate-900">
                {isTamil ? "முடிவு இருப்புப் பட்டியல்" : "Closing Inventory Snapshot"}
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              {preview.stockSnapshot.length} Dishes
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto pr-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-black uppercase tracking-wider">
                  <th className="p-3">Food Item</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Closing Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {preview.stockSnapshot.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">
                      <div>{getFoodName({ name: item.foodName })}</div>
                    </td>
                    <td className="p-3 text-slate-500 font-semibold">{getCategoryName({ name: item.category })}</td>
                    <td className="p-3">
                      {item.dietary === "NON_VEG" ? (
                        <span className="inline-flex items-center text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                          {language === "ta" ? "🔴 அசைவம்" : "🔴 Non-Veg"}
                        </span>
                      ) : item.dietary === "EGG" ? (
                        <span className="inline-flex items-center text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          {language === "ta" ? "🟡 முட்டை" : "🟡 Egg"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {language === "ta" ? "🟢 சைவம்" : "🟢 Veg"}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-black text-slate-900 font-mono text-sm">
                      {formatHumanStock(item.quantity, item.unitName)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Day Closing Action Box */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <Lock className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-black text-slate-900">
                {isTamil ? "நாள் முடிவு பூட்டுதல்" : "End of Day Settlement"}
              </h2>
            </div>

            {isClosed ? (
              <div className="p-5 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl space-y-3 text-xs text-emerald-950 shadow-2xs">
                <div className="flex items-center gap-2 font-black text-sm text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Settlement Complete</span>
                </div>
                <div className="font-semibold">
                  Closed by: <strong className="text-slate-900">{todayClosing?.closedBy.name}</strong> on{" "}
                  <span className="font-mono">{formatDateTime(todayClosing?.closedAt)}</span>
                </div>
                {todayClosing?.notes && (
                  <div className="p-3 bg-white/90 rounded-xl border border-emerald-200/80 italic text-slate-700">
                    "{todayClosing.notes}"
                  </div>
                )}
                <div className="text-[11px] text-emerald-800 pt-1 font-bold">
                  🔒 Day closing is locked to prevent accidental double-settlement.
                </div>
              </div>
            ) : (
              <form onSubmit={handleCloseDay} className="space-y-4">
                <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl text-xs text-amber-900 font-bold flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    {isTamil ? "நாள் முடிவு செய்வதன் மூலம் இன்றைய விற்பனை, வரவு மற்றும் இருப்பு நிலவரம் நிரந்தரமாக சேமிக்கப்படும்." : "Closing the business day creates an immutable snapshot of today's revenue, collections, and closing stock."}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    {isTamil ? "குறிப்புகள் (விருப்பத்தேர்வு)" : "Closing Notes (Optional)"}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={isTamil ? "எ.கா. பெட்டிப் பணம் மற்றும் கணக்கு சரிபார்க்கப்பட்டது." : "e.g. Cash counted and matched with register."}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 via-[#ff5722] to-amber-500 hover:from-orange-600 hover:to-orange-700 text-white font-black rounded-2xl shadow-lg shadow-orange-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-white" />
                  <span>{loading ? "Closing Day..." : (isTamil ? `நாள் முடிவு செய் (${todayDate})` : `Finalize & Close Day (${todayDate})`)}</span>
                </button>
              </form>
            )}
          </div>

          <div className="text-center text-[11px] text-slate-400 font-bold pt-2">
            Hotel POS &bull; End-of-Day Ledger &amp; Inventory Integrity
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. PAST DAY CLOSINGS AUDIT HISTORY */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-6 sm:p-7">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-black text-slate-900">
              {isTamil ? "முந்தைய நாள் முடிவு வரலாறு" : "Past Day Closings History"}
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            {history.length} Closings Logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 uppercase font-black text-slate-500 tracking-wider">
                <th className="p-3.5">Closing Date</th>
                <th className="p-3.5">Total Sales</th>
                <th className="p-3.5">Total Collected</th>
                <th className="p-3.5">Cash / UPI / Card</th>
                <th className="p-3.5">Closed By</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5 text-right">Stock Snapshot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/80 transition-colors font-medium">
                  <td className="p-3.5 font-black text-slate-900 font-mono">{h.closingDate}</td>
                  <td className="p-3.5 font-bold text-slate-800">{formatCurrency(h.totalSales)}</td>
                  <td className="p-3.5 font-black text-emerald-700">{formatCurrency(h.totalCollected)}</td>
                  <td className="p-3.5 text-slate-600 font-mono text-[11px]">
                    C: {formatCurrency(h.cashCollected)} | U: {formatCurrency(h.upiCollected)} | Cd: {formatCurrency(h.cardCollected)}
                  </td>
                  <td className="p-3.5 font-bold text-slate-800">{h.closedBy.name}</td>
                  <td className="p-3.5 text-slate-400 font-mono text-[11px]">{formatDateTime(h.closedAt)}</td>
                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedHistory(h)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black rounded-xl transition-all border border-slate-300 shadow-2xs cursor-pointer"
                    >
                      View Snapshot
                    </button>
                  </td>
                </tr>
              ))}

              {history.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                    No past day closings recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Snapshot Modal */}
      {selectedHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  Closing Stock Snapshot: {selectedHistory.closingDate}
                </h3>
                <div className="text-xs text-slate-500 font-semibold">
                  Closed by {selectedHistory.closedBy.name} &bull; {formatDateTime(selectedHistory.closedAt)}
                </div>
              </div>
              <button
                onClick={() => setSelectedHistory(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 text-xs">
              {(() => {
                try {
                  const items: StockSnapshotItem[] = JSON.parse(selectedHistory.closingStockJson);
                  return items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="font-bold text-slate-800">{getFoodName({ name: item.foodName })} <span className="text-slate-400 font-normal">({getCategoryName({ name: item.category })})</span></span>
                      <span className="font-black text-slate-900 font-mono">{formatHumanStock(item.quantity, item.unitName)}</span>
                    </div>
                  ));
                } catch {
                  return <div className="text-slate-400 font-bold">No snapshot data available</div>;
                }
              })()}
            </div>

            <div className="pt-4 mt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedHistory(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 font-black text-xs text-slate-800 rounded-xl border border-slate-300 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Owner WhatsApp Number Config Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Owner WhatsApp Mobile
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    Receive 1-Click Night Closing reports automatically
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPhoneModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePhone} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Owner WhatsApp Mobile (10 Digits):
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-xs font-mono font-black text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={tempPhone}
                    onChange={(e) => setTempPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono tracking-wider"
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-semibold mt-1.5">
                  This phone number is saved securely in your browser and used for instant WhatsApp dispatches.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPhoneModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 font-black text-xs rounded-xl text-slate-700 border border-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-black text-xs text-white rounded-xl shadow-glow-emerald active:scale-95 transition-all cursor-pointer"
                >
                  Save &amp; Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
