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
  Settings
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
  const { language, getFoodName, getCategoryName } = useLanguage();
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

  // Build Night Summary text (Pure English)
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

  // 1. Direct API Send to Owner WhatsApp
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

  // 2. Manual WhatsApp Web Share Link (Fallback)
  const generateWhatsAppSummary = () => {
    const text = buildNightSummaryText();
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
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

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-500 text-sm font-semibold animate-slide-up">
          <Check className="w-5 h-5" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200/90 shadow-luxury">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Day Closing &amp; Night Summary
            </h1>
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-glow-emerald tracking-wider uppercase">
              📅 {todayDate}
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm font-semibold">
            Reconcile daily sales, collections, cash drawer balance, and dispatch automated WhatsApp report to owner.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Owner Phone Setting Button */}
          <button
            type="button"
            onClick={() => setShowPhoneModal(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl border border-slate-300 flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
            title="Configure Owner WhatsApp Phone Number"
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>
              {ownerPhone ? `+91 ${ownerPhone.slice(-10)}` : "Set Owner Phone"}
            </span>
            <Settings className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* 1-Click Direct WhatsApp API Dispatch */}
          <button
            type="button"
            onClick={handleSendViaApi}
            disabled={isSendingApi}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black text-xs rounded-2xl shadow-glow-emerald flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
            title="Send Night Closing Report directly via WhatsApp API to owner mobile"
          >
            <Send className={`w-3.5 h-3.5 ${isSendingApi ? "animate-spin" : ""}`} />
            <span>{isSendingApi ? "Sending API..." : "⚡ Send to Owner WhatsApp"}</span>
          </button>

          {isClosed ? (
            <div className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 text-emerald-800 font-black text-xs rounded-2xl border border-emerald-200 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>SETTLED &amp; CLOSED</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-50 text-amber-800 font-black text-xs rounded-2xl border border-amber-200 shadow-2xs">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>ACTIVE (OPEN)</span>
            </div>
          )}
        </div>
      </div>

      {/* Today Settlement Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Sales */}
        <div className="luxury-card p-5 rounded-3xl border border-slate-200/90 shadow-luxury flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
              Total Sales (Paid)
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {formatCurrency(isClosed && todayClosing ? todayClosing.totalSales : preview.totalSales)}
            </div>
            <div className="text-[11px] text-slate-500 font-bold mt-1">
              {isClosed && todayClosing ? todayClosing.paidBills : preview.paidBills} Completed Bills
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-glow-emerald">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        {/* Collected Income */}
        <div className="luxury-card p-5 rounded-3xl border border-slate-200/90 shadow-luxury flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
              Total Collected
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {formatCurrency(isClosed && todayClosing ? todayClosing.totalCollected : preview.totalCollected)}
            </div>
            <div className="text-[11px] text-emerald-700 font-bold mt-1">Actual Money Received</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-white flex items-center justify-center shadow-md">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Outstanding Unpaid */}
        <div className="luxury-card p-5 rounded-3xl border border-slate-200/90 shadow-luxury flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
              Outstanding Unpaid
            </span>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {formatCurrency(isClosed && todayClosing ? todayClosing.outstandingAmount : preview.outstandingAmount)}
            </div>
            <div className="text-[11px] text-amber-700 font-bold mt-1">
              {isClosed && todayClosing ? todayClosing.unpaidBills : preview.unpaidBills} Unpaid Orders
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center shadow-glow-amber">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Cancelled / Void */}
        <div className="luxury-card p-5 rounded-3xl border border-slate-200/90 shadow-luxury flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
              Cancelled / Void
            </span>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {formatCurrency(isClosed && todayClosing ? todayClosing.cancelledAmount : preview.cancelledAmount)}
            </div>
            <div className="text-[11px] text-rose-700 font-bold mt-1">
              {isClosed && todayClosing ? todayClosing.cancelledBills : preview.cancelledBills} Cancelled Orders
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 text-white flex items-center justify-center shadow-md">
            <Ban className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Payment Channels Reconciliation */}
      <div className="luxury-card p-6 rounded-3xl border border-slate-200/90 shadow-luxury space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-emerald-600" />
            Payment Channels Reconciliation
          </h2>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Real-time Split</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-xs font-black text-emerald-900 uppercase tracking-wider">💵 Cash In Drawer</div>
              <div className="text-2xl font-black text-emerald-800 mt-1">
                {formatCurrency(isClosed && todayClosing ? todayClosing.cashCollected : preview.cashCollected)}
              </div>
              <div className="text-[11px] text-emerald-700 font-bold mt-0.5">Physical Cash in Till</div>
            </div>
            <Banknote className="w-9 h-9 text-emerald-600 opacity-60" />
          </div>

          <div className="p-4.5 rounded-2xl bg-blue-50/70 border border-blue-200/90 flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-xs font-black text-blue-900 uppercase tracking-wider">📱 UPI / QR In Bank</div>
              <div className="text-2xl font-black text-blue-800 mt-1">
                {formatCurrency(isClosed && todayClosing ? todayClosing.upiCollected : preview.upiCollected)}
              </div>
              <div className="text-[11px] text-blue-700 font-bold mt-0.5">Direct Bank Settlement</div>
            </div>
            <QrCode className="w-9 h-9 text-blue-600 opacity-60" />
          </div>

          <div className="p-4.5 rounded-2xl bg-purple-50/70 border border-purple-200/90 flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-xs font-black text-purple-900 uppercase tracking-wider">💳 Card Swipes</div>
              <div className="text-2xl font-black text-purple-800 mt-1">
                {formatCurrency(isClosed && todayClosing ? todayClosing.cardCollected : preview.cardCollected)}
              </div>
              <div className="text-[11px] text-purple-700 font-bold mt-0.5">POS Machine EDC</div>
            </div>
            <CreditCard className="w-9 h-9 text-purple-600 opacity-60" />
          </div>
        </div>
      </div>

      {/* Dietary Classification Sales Breakdown */}
      <div className="luxury-card p-6 rounded-3xl border border-slate-200/90 shadow-luxury space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
            Dietary Category Breakdown
          </h2>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Menu Portions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 flex items-center justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-glow-emerald"></span>
                <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">🟢 Pure Veg Sales</span>
              </div>
              <div className="text-2xl font-black text-emerald-800 mt-1">
                {formatCurrency(preview.todayVegSales || 0)}
              </div>
              <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                {preview.todayVegCount || 0} Portions Sold
              </div>
            </div>
            <div className="text-3xl opacity-90">🥗</div>
          </div>

          <div className="p-4.5 rounded-2xl bg-rose-50/70 border border-rose-200/90 flex items-center justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shadow-xs"></span>
                <span className="text-xs font-black text-rose-900 uppercase tracking-wider">🔴 Non-Veg Sales</span>
              </div>
              <div className="text-2xl font-black text-rose-800 mt-1">
                {formatCurrency(preview.todayNonVegSales || 0)}
              </div>
              <div className="text-[11px] text-rose-700 font-bold mt-0.5">
                {preview.todayNonVegCount || 0} Portions Sold
              </div>
            </div>
            <div className="text-3xl opacity-90">🍗</div>
          </div>

          <div className="p-4.5 rounded-2xl bg-amber-50/70 border border-amber-200/90 flex items-center justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-glow-amber"></span>
                <span className="text-xs font-black text-amber-900 uppercase tracking-wider">🟡 Egg Sales</span>
              </div>
              <div className="text-2xl font-black text-amber-800 mt-1">
                {formatCurrency(preview.todayEggSales || 0)}
              </div>
              <div className="text-[11px] text-amber-700 font-bold mt-0.5">
                {preview.todayEggCount || 0} Portions Sold
              </div>
            </div>
            <div className="text-3xl opacity-90">🍳</div>
          </div>
        </div>
      </div>

      {/* Closing Stock Inventory Snapshot & Closure Action Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Closing Stock Snapshot */}
        <div className="lg:col-span-7 luxury-card p-6 rounded-3xl border border-slate-200/90 shadow-luxury space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-emerald-600" />
              Closing Inventory Snapshot
            </h2>
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
        <div className="lg:col-span-5 luxury-card p-6 rounded-3xl border border-slate-200/90 shadow-luxury flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <Lock className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-black text-slate-900">End of Day Settlement</h2>
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
                    Closing the business day creates an immutable snapshot of today's revenue, collections, and closing stock.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Closing Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Cash counted and matched with register."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-4 bg-slate-950 hover:bg-slate-900 text-white font-black rounded-2xl shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>{loading ? "Closing Day..." : `Finalize & Close Day (${todayDate})`}</span>
                </button>
              </form>
            )}
          </div>

          <div className="text-center text-[11px] text-slate-400 font-bold pt-2">
            Hotel POS &bull; End-of-Day Ledger &amp; Inventory Integrity
          </div>
        </div>
      </div>

      {/* Past Day Closings Audit History */}
      <div className="luxury-card rounded-3xl border border-slate-200/90 shadow-luxury overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-700" />
            Past Day Closings History
          </h2>
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
