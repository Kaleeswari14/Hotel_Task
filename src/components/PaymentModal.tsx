"use client";

import React, { useState } from "react";
import {
  Banknote,
  QrCode,
  CreditCard,
  X,
  CheckCircle2,
  IndianRupee,
  Receipt,
  AlertCircle,
  Calculator,
  ArrowRight
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { sendWhatsAppBillAndOffer } from "@/lib/whatsapp";

interface PaymentModalProps {
  bill: {
    id: string;
    billNumber: number;
    orderReference: string;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
  };
  initialPaymentMethod?: "CASH" | "UPI" | "CARD";
  onClose: () => void;
  onPaymentSuccess: (updatedBill: any, payment: any) => void;
}

export default function PaymentModal({
  bill,
  initialPaymentMethod = "CASH",
  onClose,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD">(initialPaymentMethod);
  const [tenderAmount, setTenderAmount] = useState<string>(String(bill.balanceAmount));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const balance = bill.balanceAmount;
  const tenderVal = parseFloat(tenderAmount) || 0;
  const changeReturn = paymentMethod === "CASH" ? Math.max(0, tenderVal - balance) : 0;

  // Quick Tender Presets
  const quickPresets = [
    { label: "Exact", val: balance },
    { label: "₹100", val: Math.ceil(balance / 100) * 100 || 100 },
    { label: "₹200", val: 200 },
    { label: "₹500", val: 500 },
  ];

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (tenderVal <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    const payAmount = paymentMethod === "CASH" ? Math.min(tenderVal, balance) : balance;

    setLoading(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billId: bill.id,
          amount: payAmount,
          paymentMethod,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");

      // Auto-send WhatsApp Bill & Offer if customer phone is provided
      if (data.bill?.customerPhone) {
        sendWhatsAppBillAndOffer(data.bill);
      }

      onPaymentSuccess(data.bill, data.payment);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 my-8 animate-scale-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Bill #{bill.billNumber} &bull; {bill.orderReference}
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-1">Collect Payment</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-xl flex items-center gap-2 text-xs text-red-700 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleConfirmPayment} className="space-y-5">
          {/* Amount Due Big Banner */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between shadow-inner">
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Total Balance Due
              </div>
              <div className="text-3xl font-black text-emerald-400 mt-0.5">
                {formatCurrency(balance)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] bg-emerald-900/60 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30 font-bold">
                100% Secure
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("CASH");
                  setTenderAmount(String(balance));
                }}
                className={`py-3 px-3 rounded-2xl border-2 font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === "CASH"
                    ? "bg-emerald-50 border-emerald-600 text-emerald-900 shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Banknote className="w-6 h-6 text-emerald-600" />
                <span>💵 CASH</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("UPI");
                  setTenderAmount(String(balance));
                }}
                className={`py-3 px-3 rounded-2xl border-2 font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === "UPI"
                    ? "bg-blue-50 border-blue-600 text-blue-900 shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <QrCode className="w-6 h-6 text-blue-600" />
                <span>📱 UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("CARD");
                  setTenderAmount(String(balance));
                }}
                className={`py-3 px-3 rounded-2xl border-2 font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === "CARD"
                    ? "bg-purple-50 border-purple-600 text-purple-900 shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <CreditCard className="w-6 h-6 text-purple-600" />
                <span>💳 CARD</span>
              </button>
            </div>
          </div>

          {/* Cash Tender & Change Calculator (Shown when CASH is selected) */}
          {paymentMethod === "CASH" && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  Cash Received (Tender)
                </span>

                {/* Quick amount chips */}
                <div className="flex items-center gap-1">
                  {quickPresets.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTenderAmount(String(p.val))}
                      className="px-2 py-0.5 bg-white hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded border border-slate-300"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={tenderAmount}
                  onChange={(e) => setTenderAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Change Return Display */}
              <div className="flex items-center justify-between p-3 bg-emerald-100/70 border border-emerald-300 rounded-xl text-emerald-950">
                <span className="text-xs font-bold uppercase">Change to Return:</span>
                <span className="text-lg font-black text-emerald-900">
                  {formatCurrency(changeReturn)}
                </span>
              </div>
            </div>
          )}

          {/* UPI or Card Details / Notes */}
          {paymentMethod === "UPI" && (
            <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 text-center space-y-2">
              <QrCode className="w-12 h-12 text-blue-600 mx-auto" />
              <div className="text-xs font-bold text-blue-900">
                Scan Hotel UPI QR Code &amp; Confirm Payment
              </div>
              <div className="text-[11px] text-blue-700">
                Amount to receive: <strong>{formatCurrency(balance)}</strong>
              </div>
            </div>
          )}

          {paymentMethod === "CARD" && (
            <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200 text-center space-y-2">
              <CreditCard className="w-12 h-12 text-purple-600 mx-auto" />
              <div className="text-xs font-bold text-purple-900">
                Swipe / Dip Card on POS Card Terminal
              </div>
              <div className="text-[11px] text-purple-700">
                Amount to charge: <strong>{formatCurrency(balance)}</strong>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg shadow-emerald-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {loading ? (
                <span>Confirming Transaction...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Confirm &amp; Mark PAID ({formatCurrency(balance)})</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center text-[10px] text-slate-400 font-medium">
            🔒 Transaction Rule: Confirming payment executes atomic stock reduction and records sales.
          </div>
        </form>
      </div>
    </div>
  );
}
