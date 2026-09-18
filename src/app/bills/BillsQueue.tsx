"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  Search,
  Plus,
  Receipt,
  User,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  UtensilsCrossed,
  RefreshCw,
  Ban,
  ArrowRight,
  Filter,
  Eye,
  Check,
  X,
  Printer,
  MoreHorizontal,
  Banknote,
  QrCode,
  ShoppingBag,
  Edit2,
  ShieldAlert,
  KeyRound
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { useLanguage } from "@/context/LanguageContext";
import PaymentModal from "@/components/PaymentModal";
import ThermalReceipt from "@/components/ThermalReceipt";
import CancelBillModal from "@/components/CancelBillModal";
import EditBillModal from "@/components/EditBillModal";
import OwnerPermissionModal from "@/components/OwnerPermissionModal";

interface BillItem {
  id: string;
  foodItemId: string;
  foodName: string;
  portionId?: string | null;
  portionName: string;
  unitMultiplier: number;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface Bill {
  id: string;
  billNumber: number;
  orderType: string;
  orderReference: string;
  customerName?: string | null;
  customerPhone?: string | null;
  subtotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: "UNPAID" | "PARTIAL" | "PAID" | "CANCELLED";
  createdAt: string;
  createdBy: {
    name: string;
    username: string;
  };
  items: BillItem[];
  payments: any[];
}

interface BillsQueueProps {
  initialBills: Bill[];
  userRole: string;
}

// Live Elapsed Time Helper with color-coding
function getElapsedInfo(createdAt: string, nowTime: number, isTamil: boolean) {
  const created = new Date(createdAt).getTime();
  const diffMs = Math.max(0, nowTime - created);
  const diffMins = Math.floor(diffMs / 60000);

  let text = "";
  if (diffMins < 1) {
    text = isTamil ? "இப்போதுதான்" : "< 1m ago";
  } else if (diffMins === 1) {
    text = isTamil ? "1 நிமிடம் முன்பு" : "1m ago";
  } else if (diffMins < 60) {
    text = isTamil ? `${diffMins} நிமி முன்பு` : `${diffMins}m ago`;
  } else {
    const hrs = Math.floor(diffMins / 60);
    const rem = diffMins % 60;
    text = isTamil ? `${hrs} மணி ${rem} நிமி` : `${hrs}h ${rem}m ago`;
  }

  let status: "fresh" | "warning" | "urgent" = "fresh";
  if (diffMins >= 30) {
    status = "urgent"; // Red alert (> 30 mins)
  } else if (diffMins >= 15) {
    status = "warning"; // Amber warning (15 - 30 mins)
  }

  return { text, status, mins: diffMins };
}

// Table & Order Type Badge Helper with high contrast styling
function getOrderBadge(orderType: string, orderReference: string, isTamil: boolean) {
  const refLower = (orderReference || "").toLowerCase();
  const typeLower = (orderType || "").toLowerCase();
  const isParcel = typeLower === "parcel" || refLower.includes("parcel") || refLower.includes("takeaway") || refLower.includes("பார்சல்");
  const isToken = typeLower === "token" || refLower.includes("token") || refLower.includes("டோக்கன்");

  if (isParcel) {
    return {
      type: "PARCEL",
      icon: "🥡",
      title: isTamil ? "பார்சல் / Parcel" : "Takeaway / Parcel",
      subText: orderReference && orderReference !== "Parcel" && orderReference !== "Takeaway" ? orderReference : null,
      pillClass: "bg-amber-500 text-slate-950 border border-amber-400 font-black shadow-xs",
    };
  }

  if (isToken) {
    return {
      type: "TOKEN",
      icon: "🎟️",
      title: orderReference || (isTamil ? "டோக்கன்" : "Token"),
      subText: null,
      pillClass: "bg-purple-950 text-purple-200 border border-purple-700 font-black shadow-xs",
    };
  }

  // Default: Table
  return {
    type: "TABLE",
    icon: "🪑",
    title: orderReference || (isTamil ? "டேபிள்" : "Table"),
    subText: null,
    pillClass: "bg-slate-950 text-emerald-400 border border-slate-700 font-black shadow-xs",
  };
}

export default function BillsQueue({ initialBills, userRole }: BillsQueueProps) {
  const { language, setLanguage, isTamil, t } = useLanguage();
  const [bills, setBills] = useState<Bill[]>(initialBills);
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "PAID" | "CANCELLED" | "ALL">("ACTIVE");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "TABLE" | "TOKEN" | "PARCEL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Live timer tick for dynamic elapsed time
  const [nowTime, setNowTime] = useState<number>(Date.now());
  const [activeDropdownBillId, setActiveDropdownBillId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"CASH" | "UPI" | "CARD">("CASH");

  // Modals state
  const [viewBill, setViewBill] = useState<Bill | null>(null);
  const [paymentBill, setPaymentBill] = useState<Bill | null>(null);
  const [editBill, setEditBill] = useState<Bill | null>(null);
  const [receiptBill, setReceiptBill] = useState<Bill | null>(null);
  const [receiptInitialMode, setReceiptInitialMode] = useState<"ORDER_SLIP" | "PAYMENT_RECEIPT">("PAYMENT_RECEIPT");
  const [isReprint, setIsReprint] = useState(false);
  const [cancelBill, setCancelBill] = useState<Bill | null>(null);
  const [permissionModal, setPermissionModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onAuthorized: () => void;
  } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Real-Time Live Queue Polling: auto-refreshes every 3 seconds & timer tick every 15 seconds
  React.useEffect(() => {
    const queueInterval = setInterval(refreshBills, 3000);
    const timerInterval = setInterval(() => setNowTime(Date.now()), 15000);
    const handleWindowClick = () => setActiveDropdownBillId(null);

    window.addEventListener("focus", refreshBills);
    window.addEventListener("click", handleWindowClick);

    return () => {
      clearInterval(queueInterval);
      clearInterval(timerInterval);
      window.removeEventListener("focus", refreshBills);
      window.removeEventListener("click", handleWindowClick);
    };
  }, []);

  // Refresh Bills
  const refreshBills = async () => {
    try {
      const res = await fetch("/api/bills?status=ALL");
      if (res.ok) {
        const data = await res.json();
        setBills(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Permission Guard for Editing Bill
  const requestEditBill = (bill: Bill) => {
    if (userRole === "OWNER") {
      setEditBill(bill);
    } else {
      setPermissionModal({
        isOpen: true,
        title: `Authorize Edit Bill #${bill.billNumber}`,
        description: `Editing active Bill #${bill.billNumber} (${bill.orderReference}) requires Owner authorization password.`,
        onAuthorized: () => {
          setPermissionModal(null);
          setEditBill(bill);
        },
      });
    }
  };

  // Permission Guard for Cancelling/Deleting Bill
  const requestCancelBill = (bill: Bill) => {
    if (userRole === "OWNER") {
      setCancelBill(bill);
    } else {
      setPermissionModal({
        isOpen: true,
        title: `Authorize Cancel Bill #${bill.billNumber}`,
        description: `Cancelling/deleting Bill #${bill.billNumber} (${bill.orderReference}) requires Owner authorization password.`,
        onAuthorized: () => {
          setPermissionModal(null);
          setCancelBill(bill);
        },
      });
    }
  };

  // On bill edit success
  const handleEditSuccess = (updatedBill: any) => {
    setEditBill(null);
    showToast(`Bill #${updatedBill.billNumber} updated successfully!`);
    setBills((prev) => prev.map((b) => (b.id === updatedBill.id ? updatedBill : b)));
    if (viewBill && viewBill.id === updatedBill.id) {
      setViewBill(updatedBill);
    }
  };

  // On payment success: update state, show toast & launch Thermal Receipt
  const handlePaymentSuccess = (updatedBill: Bill, payment: any) => {
    setPaymentBill(null);
    showToast(`Payment of ${formatCurrency(payment.amount)} confirmed! Bill #${updatedBill.billNumber} is PAID.`);
    setBills((prev) => prev.map((b) => (b.id === updatedBill.id ? updatedBill : b)));
    setReceiptInitialMode("PAYMENT_RECEIPT");
    setReceiptBill(updatedBill);
    setIsReprint(false);
  };

  // On cancel success
  const handleCancelSuccess = (cancelledBillId: string) => {
    setCancelBill(null);
    showToast("Bill cancelled successfully.");
    setBills((prev) =>
      prev.map((b) => (b.id === cancelledBillId ? { ...b, status: "CANCELLED" as const } : b))
    );
    if (viewBill && viewBill.id === cancelledBillId) {
      setViewBill(null);
    }
  };

  // Filtered Bills
  const filteredBills = bills.filter((b) => {
    const matchesStatus =
      statusFilter === "ACTIVE"
        ? b.status === "UNPAID" || b.status === "PARTIAL"
        : statusFilter === "ALL"
        ? true
        : b.status === statusFilter;

    const matchesType = typeFilter === "ALL" ? true : b.orderType === typeFilter;

    const matchesSearch =
      !searchQuery.trim() ||
      String(b.billNumber).includes(searchQuery.trim()) ||
      b.orderReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.createdBy.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesType && matchesSearch;
  });

  const activeUnpaidCount = bills.filter((b) => b.status === "UNPAID" || b.status === "PARTIAL").length;
  const activeUnpaidTotal = bills
    .filter((b) => b.status === "UNPAID" || b.status === "PARTIAL")
    .reduce((sum, b) => sum + b.balanceAmount, 0);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-500 text-sm font-semibold animate-slide-up">
          <Check className="w-5 h-5" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">{isTamil ? "ரசீதுகள் & நிலுவைப் பட்டியல்" : "Active & Unpaid Bills Queue"}</h1>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
              {activeUnpaidCount} {isTamil ? "நிலுவை" : "Pending"}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Orders waiting for payment confirmation. Outstanding total:{" "}
            <span className="font-extrabold text-amber-700">{formatCurrency(activeUnpaidTotal)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={refreshBills}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 transition-all"
            title="Refresh Queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            href="/pos"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{isTamil ? "+ புதிய பில் போடு" : "+ Create New Bill"}</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setStatusFilter("ACTIVE")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
              statusFilter === "ACTIVE"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            ⏳ Unpaid / Active ({activeUnpaidCount})
          </button>
          <button
            onClick={() => setStatusFilter("PAID")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
              statusFilter === "PAID"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            ✅ Paid Bills ({bills.filter((b) => b.status === "PAID").length})
          </button>
          <button
            onClick={() => setStatusFilter("CANCELLED")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
              statusFilter === "CANCELLED"
                ? "bg-red-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            🚫 {isTamil ? "ரத்து செய்தவை" : "Cancelled"} ({bills.filter((b) => b.status === "CANCELLED").length})
          </button>
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
              statusFilter === "ALL"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {isTamil ? "அனைத்து பில்கள்" : "All Bills"} ({bills.length})
          </button>
        </div>

        {/* Search & Type filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Types</option>
            <option value="TABLE">🪑 Tables</option>
            <option value="TOKEN">🎟️ Tokens</option>
            <option value="PARCEL">🥡 Parcels</option>
          </select>

          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Bill # or Table..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Bills Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBills.map((bill) => {
          const isUnpaid = bill.status === "UNPAID";
          const isPartial = bill.status === "PARTIAL";
          const isPaid = bill.status === "PAID";
          const isCancelled = bill.status === "CANCELLED";

          const orderBadge = getOrderBadge(bill.orderType, bill.orderReference, isTamil);
          const elapsed = getElapsedInfo(bill.createdAt, nowTime, isTamil);

          return (
            <div
              key={bill.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between group ${
                isUnpaid || isPartial
                  ? elapsed.status === "urgent"
                    ? "border-rose-300 ring-1 ring-rose-200"
                    : elapsed.status === "warning"
                    ? "border-amber-300"
                    : "border-slate-200 hover:border-slate-300"
                  : isPaid
                  ? "border-emerald-200/80 bg-gradient-to-b from-white to-emerald-50/20"
                  : "border-slate-200 opacity-75"
              }`}
            >
              <div>
                {/* 1. TOP ROW: Bill Number, Table / Order Type Badge & Live Elapsed Timer */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-black text-slate-900 tracking-tight">
                      #{bill.billNumber}
                    </span>

                    {/* High-Contrast Table / Order Type Pill Badge */}
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full ${orderBadge.pillClass}`}
                    >
                      <span>{orderBadge.icon}</span>
                      <span>{orderBadge.title}</span>
                    </span>

                    {orderBadge.subText && (
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {orderBadge.subText}
                      </span>
                    )}
                  </div>

                  {/* 2. Live Elapsed Timer or Completed Status */}
                  <div>
                    {isUnpaid || isPartial ? (
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border transition-colors ${
                          elapsed.status === "urgent"
                            ? "bg-rose-100 text-rose-800 border-rose-300 animate-pulse"
                            : elapsed.status === "warning"
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        }`}
                        title={`Created: ${formatDateTime(bill.createdAt)}`}
                      >
                        <Clock
                          className={`w-3.5 h-3.5 ${
                            elapsed.status === "urgent"
                              ? "text-rose-600"
                              : elapsed.status === "warning"
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }`}
                        />
                        <span>{elapsed.text}</span>
                      </div>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          isPaid
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-red-100 text-red-800 border border-red-300"
                        }`}
                      >
                        {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                        <span>{bill.status}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Metadata Row */}
                <div className="text-[11px] text-slate-400 flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
                  <span className="font-mono">{formatDateTime(bill.createdAt)}</span>
                  <span>By: <strong className="text-slate-600 font-semibold">{bill.createdBy.name}</strong></span>
                </div>

                {/* Customer Details Row (if present) */}
                {(bill.customerName || bill.customerPhone) && (
                  <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl px-2.5 py-1.5 mb-3 text-xs flex items-center justify-between gap-2 text-emerald-950 font-bold">
                    <span className="truncate flex items-center gap-1">
                      👤 {bill.customerName || "Customer"}
                    </span>
                    {bill.customerPhone && (
                      <span className="font-mono text-[11px] bg-emerald-100 px-1.5 py-0.5 rounded-lg border border-emerald-300 text-emerald-900 shrink-0">
                        📞 {bill.customerPhone}
                      </span>
                    )}
                  </div>
                )}

                {/* Ordered Items List */}
                <div className="space-y-1.5 mb-4">
                  {bill.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-slate-50 rounded-xl border border-slate-100/80"
                    >
                      <div className="font-semibold text-slate-800">
                        {item.foodName}{" "}
                        <span className="text-emerald-700 font-bold">({item.portionName})</span>{" "}
                        &times; <strong className="text-slate-900">{item.quantity}</strong>
                      </div>
                      <div className="font-black text-slate-800">
                        {formatCurrency(item.subtotal)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. BOTTOM TOTALS & STREAMLINED ACTIONS */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    {bill.discount > 0 && (
                      <div className="text-[11px] text-amber-700 font-bold">
                        Disc: -{formatCurrency(bill.discount)}
                      </div>
                    )}
                    <div className="text-xs font-semibold text-slate-500">
                      {isUnpaid ? (isTamil ? "செலுத்த வேண்டிய பாக்கி:" : "Balance Due:") : (isTamil ? "பில் மொத்தம்:" : "Bill Total:")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-slate-900">
                      {formatCurrency(isUnpaid ? bill.balanceAmount : bill.totalAmount)}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {isUnpaid || isPartial ? (
                    <>
                      {/* Primary Quick Collect Actions */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPaymentMethod("CASH");
                            setPaymentBill(bill);
                          }}
                          className="flex-1 py-3 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 active:scale-[0.98]"
                        >
                          <IndianRupee className="w-4 h-4" />
                          <span>{isTamil ? `பணம் வசூல் (${formatCurrency(bill.balanceAmount)})` : `Collect (${formatCurrency(bill.balanceAmount)})`}</span>
                        </button>

                        {/* Quick UPI Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPaymentMethod("UPI");
                            setPaymentBill(bill);
                          }}
                          className="py-3 px-3 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-black rounded-xl text-xs flex items-center gap-1 shadow-2xs active:scale-[0.98] transition-all"
                          title="Quick Pay with UPI / QR"
                        >
                          <QrCode className="w-4 h-4 text-blue-600" />
                          <span className="hidden sm:inline">UPI</span>
                        </button>
                      </div>

                      {/* Secondary Clean Actions Row: Slip (Print), Edit, and Safe (•••) Dropdown */}
                      <div className="flex items-center justify-between gap-1.5 text-xs pt-0.5">
                        {/* 1. Slip (Print) */}
                        <button
                          type="button"
                          onClick={() => {
                            setReceiptInitialMode("ORDER_SLIP");
                            setReceiptBill(bill);
                            setIsReprint(false);
                          }}
                          className="flex-1 py-2 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-xl flex items-center justify-center gap-1.5 border border-amber-200/80 active:scale-[0.98] transition-all"
                          title="Print Kitchen / Token Order Slip"
                        >
                          <Receipt className="w-3.5 h-3.5 text-amber-700" />
                          <span>{isTamil ? "ஸ்லிப்" : "Slip"}</span>
                        </button>

                        {/* 2. Edit (Owner Protected) */}
                        <button
                          type="button"
                          onClick={() => requestEditBill(bill)}
                          className="flex-1 py-2 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl flex items-center justify-center gap-1.5 border border-indigo-200/80 active:scale-[0.98] transition-all"
                          title="Edit Bill Items / Quantities"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>{isTamil ? "மாற்றுக" : "Edit"}</span>
                        </button>

                        {/* 3. Safe Options Dropdown (•••) */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownBillId(activeDropdownBillId === bill.id ? null : bill.id);
                            }}
                            className={`p-2 rounded-xl font-black border transition-all ${
                              activeDropdownBillId === bill.id
                                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                            }`}
                            title="More Options"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {activeDropdownBillId === bill.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 z-30 animate-scale-up space-y-1"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveDropdownBillId(null);
                                  setViewBill(bill);
                                }}
                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition-colors"
                              >
                                <Eye className="w-4 h-4 text-slate-500" />
                                <span>{isTamil ? "விவரங்கள் பார்க்க" : "View Full Details"}</span>
                              </button>

                              <div className="h-px bg-slate-100 my-1"></div>

                              {/* Dangerous Action: Cancel Bill with Protection */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveDropdownBillId(null);
                                  requestCancelBill(bill);
                                }}
                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                              >
                                <Ban className="w-4 h-4 text-rose-600" />
                                <span>{isTamil ? "பில் ரத்து செய்க" : "Cancel / Void Bill"}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : isPaid ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setViewBill(bill)}
                        className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isTamil ? "விவரங்கள்" : "View Details"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setReceiptInitialMode("PAYMENT_RECEIPT");
                          setReceiptBill(bill);
                          setIsReprint(true);
                        }}
                        className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98]"
                      >
                        <Printer className="w-4 h-4 text-emerald-400" />
                        <span>{isTamil ? "ரசீது அச்சிடு" : "Reprint Receipt"}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 bg-red-50 rounded-xl border border-red-200 text-xs">
                      <span className="font-bold text-red-700">{isTamil ? "ரத்து செய்யப்பட்ட பில்" : "Cancelled Bill"}</span>
                      <button
                        type="button"
                        onClick={() => setViewBill(bill)}
                        className="px-2.5 py-1 bg-white hover:bg-red-100 text-red-800 font-bold rounded-lg border border-red-300 text-[11px]"
                      >
                        {isTamil ? "காரணம் பார்க்க" : "View Reason"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredBills.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-slate-700 text-base">{isTamil ? "பில்கள் எதுவும் இல்லை" : "No bills found in this view"}</h3>
            <p className="text-xs text-slate-400 mt-1">
              {statusFilter === "ACTIVE"
                ? (isTamil ? "தற்போது நிலுவையில் உள்ள பில்கள் எதுவும் இல்லை." : "There are currently no unpaid bills waiting in queue.")
                : (isTamil ? "வேறு வடிகட்டி அல்லது தேடலை முயற்சிக்கவும்." : "Try changing your filter or search query.")}
            </p>
          </div>
        )}
      </div>

      {/* Collect Payment Modal */}
      {paymentBill && (
        <PaymentModal
          bill={paymentBill}
          initialPaymentMethod={selectedPaymentMethod}
          onClose={() => setPaymentBill(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Edit Bill Modal */}
      {editBill && (
        <EditBillModal
          bill={editBill as any}
          onClose={() => setEditBill(null)}
          onSaveSuccess={handleEditSuccess}
        />
      )}

      {/* Owner Permission Modal */}
      {permissionModal && permissionModal.isOpen && (
        <OwnerPermissionModal
          title={permissionModal.title}
          actionDescription={permissionModal.description}
          userRole={userRole}
          onAuthorized={permissionModal.onAuthorized}
          onClose={() => setPermissionModal(null)}
        />
      )}

      {/* Thermal Receipt Print Modal */}
      {receiptBill && (
        <ThermalReceipt
          bill={receiptBill as any}
          initialMode={receiptInitialMode}
          isReprint={isReprint}
          onClose={() => setReceiptBill(null)}
        />
      )}

      {/* Cancel Bill Modal */}
      {cancelBill && (
        <CancelBillModal
          bill={cancelBill}
          onClose={() => setCancelBill(null)}
          onCancelSuccess={handleCancelSuccess}
        />
      )}

      {/* Detailed View Bill Modal */}
      {viewBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-scale-up my-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-2xl text-slate-900">
                    Bill #{viewBill.billNumber}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                      viewBill.status === "PAID"
                        ? "bg-emerald-100 text-emerald-800"
                        : viewBill.status === "UNPAID"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {viewBill.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {viewBill.orderReference} &bull; {viewBill.orderType} &bull; {formatDateTime(viewBill.createdAt)}
                </p>
                {viewBill.createdBy && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Created by: {viewBill.createdBy.name}
                  </p>
                )}

                {(viewBill.customerName || viewBill.customerPhone) && (
                  <div className="mt-2.5 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1 text-xs text-emerald-950 font-bold">
                    <span>👤 {viewBill.customerName || "Customer"}</span>
                    {viewBill.customerPhone && (
                      <span className="font-mono bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300 text-emerald-900 text-[11px]">
                        📞 {viewBill.customerPhone}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => setViewBill(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Line Items Table */}
            <div className="py-4 border-b border-slate-100">
              <div className="text-xs font-bold text-slate-500 uppercase pb-2 flex justify-between">
                <span>Items ({viewBill.items.length})</span>
                <span>Amount</span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {viewBill.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{item.foodName}</div>
                      <div className="text-[11px] text-slate-500">
                        {item.portionName} &bull; {formatCurrency(item.unitPrice)} &times; {item.quantity}
                      </div>
                    </div>
                    <div className="font-black text-slate-900 text-sm">
                      {formatCurrency(item.subtotal)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Summary */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs my-4">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(viewBill.subtotal)}</span>
              </div>
              {viewBill.discount > 0 && (
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>Discount:</span>
                  <span>-{formatCurrency(viewBill.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Total Amount:</span>
                <span className="text-emerald-700 text-base">{formatCurrency(viewBill.totalAmount)}</span>
              </div>
              {viewBill.status === "UNPAID" && (
                <div className="flex justify-between text-xs font-black text-amber-800 pt-1">
                  <span>Balance Due:</span>
                  <span>{formatCurrency(viewBill.balanceAmount)}</span>
                </div>
              )}
            </div>

            {/* View Modal Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => setViewBill(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
              >
                Close
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {viewBill.status === "UNPAID" && (
                  <>
                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const b = viewBill;
                        setViewBill(null);
                        requestEditBill(b);
                      }}
                      className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-indigo-200"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Bill</span>
                    </button>

                    {/* Cancel Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const b = viewBill;
                        setViewBill(null);
                        requestCancelBill(b);
                      }}
                      className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-red-200"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Cancel Bill</span>
                    </button>

                    {/* Collect Payment */}
                    <button
                      type="button"
                      onClick={() => {
                        const b = viewBill;
                        setViewBill(null);
                        setPaymentBill(b);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
                    >
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>Pay Now</span>
                    </button>
                  </>
                )}

                {viewBill.status === "PAID" && (
                  <button
                    type="button"
                    onClick={() => {
                      const b = viewBill;
                      setViewBill(null);
                      setReceiptInitialMode("PAYMENT_RECEIPT");
                      setReceiptBill(b);
                      setIsReprint(true);
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Print Receipt</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
