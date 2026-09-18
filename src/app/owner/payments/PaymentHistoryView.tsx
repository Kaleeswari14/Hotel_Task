"use client";

import React, { useState } from "react";
import {
  IndianRupee,
  Banknote,
  QrCode,
  CreditCard,
  Search,
  Filter,
  Receipt,
  User,
  Clock,
  Calendar,
  RefreshCw,
  Printer
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import ThermalReceipt from "@/components/ThermalReceipt";

interface PaymentItem {
  id: string;
  billId: string;
  amount: number;
  paymentMethod: "CASH" | "UPI" | "CARD" | string;
  notes: string | null;
  createdAt: string;
  bill: {
    id: string;
    billNumber: number;
    orderReference: string;
    totalAmount: number;
    paidAmount: number;
    subtotal: number;
    discount: number;
    status: string;
    createdAt: string;
    items: any[];
    createdBy: { name: string };
  };
  receivedBy: {
    name: string;
    username: string;
    role: string;
  };
}

interface PaymentHistoryViewProps {
  initialPayments: PaymentItem[];
}

export default function PaymentHistoryView({ initialPayments }: PaymentHistoryViewProps) {
  const [payments, setPayments] = useState<PaymentItem[]>(initialPayments);
  const [methodFilter, setMethodFilter] = useState<"ALL" | "CASH" | "UPI" | "CARD">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Receipt Modal
  const [receiptBill, setReceiptBill] = useState<any | null>(null);

  const refreshPayments = async () => {
    try {
      const res = await fetch("/api/payments");
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Metrics
  const totalCollection = payments.reduce((sum, p) => sum + p.amount, 0);
  const cashTotal = payments
    .filter((p) => p.paymentMethod === "CASH")
    .reduce((sum, p) => sum + p.amount, 0);
  const upiTotal = payments
    .filter((p) => p.paymentMethod === "UPI")
    .reduce((sum, p) => sum + p.amount, 0);
  const cardTotal = payments
    .filter((p) => p.paymentMethod === "CARD")
    .reduce((sum, p) => sum + p.amount, 0);

  // Filtered List
  const filteredList = payments.filter((p) => {
    const matchesMethod = methodFilter === "ALL" ? true : p.paymentMethod === methodFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      String(p.bill.billNumber).includes(searchQuery.trim()) ||
      p.bill.orderReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.receivedBy.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMethod && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">Payment Collection History</h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
              {payments.length} Transactions
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Audit log of all money received across Cash, UPI, and Card channels.
          </p>
        </div>

        <button
          onClick={refreshPayments}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 transition-all self-start sm:self-auto"
          title="Refresh History"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Collection
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {formatCurrency(totalCollection)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{payments.length} Payments</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        {/* Cash */}
        <div
          onClick={() => setMethodFilter(methodFilter === "CASH" ? "ALL" : "CASH")}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            methodFilter === "CASH"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
              : "bg-white text-slate-900 border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
              Cash Collection
            </span>
            <Banknote className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black mt-1">{formatCurrency(cashTotal)}</div>
          <div className="text-[11px] opacity-70 mt-0.5">Physical Tender</div>
        </div>

        {/* UPI */}
        <div
          onClick={() => setMethodFilter(methodFilter === "UPI" ? "ALL" : "UPI")}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            methodFilter === "UPI"
              ? "bg-blue-600 text-white border-blue-600 shadow-md"
              : "bg-white text-slate-900 border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
              UPI / QR Collection
            </span>
            <QrCode className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black mt-1">{formatCurrency(upiTotal)}</div>
          <div className="text-[11px] opacity-70 mt-0.5">Direct Bank / QR</div>
        </div>

        {/* Card */}
        <div
          onClick={() => setMethodFilter(methodFilter === "CARD" ? "ALL" : "CARD")}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            methodFilter === "CARD"
              ? "bg-purple-600 text-white border-purple-600 shadow-md"
              : "bg-white text-slate-900 border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
              Card Collection
            </span>
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black mt-1">{formatCurrency(cardTotal)}</div>
          <div className="text-[11px] opacity-70 mt-0.5">Swipe / POS Terminal</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Method Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setMethodFilter("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              methodFilter === "ALL" ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All Methods ({payments.length})
          </button>
          <button
            onClick={() => setMethodFilter("CASH")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              methodFilter === "CASH" ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            💵 Cash
          </button>
          <button
            onClick={() => setMethodFilter("UPI")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              methodFilter === "UPI" ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            📱 UPI / QR
          </button>
          <button
            onClick={() => setMethodFilter("CARD")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              methodFilter === "CARD" ? "bg-purple-600 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            💳 Card
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Bill # or Staff..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                <th className="p-4">Bill No & Table</th>
                <th className="p-4">Amount Paid</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4">Staff / Cashier</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredList.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <div className="font-extrabold text-slate-900">
                      Bill #{p.bill.billNumber}
                    </div>
                    <div className="text-xs text-slate-500">{p.bill.orderReference}</div>
                  </td>

                  <td className="p-4">
                    <div className="font-black text-emerald-700 text-base">
                      {formatCurrency(p.amount)}
                    </div>
                  </td>

                  <td className="p-4">
                    {p.paymentMethod === "CASH" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Banknote className="w-3.5 h-3.5" />
                        CASH
                      </span>
                    )}
                    {p.paymentMethod === "UPI" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        <QrCode className="w-3.5 h-3.5" />
                        UPI
                      </span>
                    )}
                    {p.paymentMethod === "CARD" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
                        <CreditCard className="w-3.5 h-3.5" />
                        CARD
                      </span>
                    )}
                  </td>

                  <td className="p-4">
                    <div className="font-bold text-slate-800 text-xs">{p.receivedBy.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      ({p.receivedBy.role})
                    </div>
                  </td>

                  <td className="p-4 text-xs text-slate-500 font-mono">
                    {formatDateTime(p.createdAt)}
                  </td>

                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => setReceiptBill(p.bill)}
                      className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all border border-slate-200 inline-flex items-center gap-1.5 text-xs font-bold"
                      title="Reprint Receipt"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Receipt</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <IndianRupee className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <div className="font-bold text-slate-700 text-base">No payments found</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Payments will automatically appear here once staff collects bill payments.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Thermal Receipt Modal */}
      {receiptBill && (
        <ThermalReceipt
          bill={receiptBill}
          isReprint={true}
          onClose={() => setReceiptBill(null)}
        />
      )}
    </div>
  );
}
