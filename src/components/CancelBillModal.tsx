"use client";

import React, { useState } from "react";
import { Ban, AlertTriangle, X, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface CancelBillModalProps {
  bill: {
    id: string;
    billNumber: number;
    orderReference: string;
    totalAmount: number;
  };
  onClose: () => void;
  onCancelSuccess: (cancelledBillId: string) => void;
}

export default function CancelBillModal({
  bill,
  onClose,
  onCancelSuccess,
}: CancelBillModalProps) {
  const [reason, setReason] = useState("Customer cancelled");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reasons = [
    "Customer cancelled",
    "Wrong order / Staff mistake",
    "Duplicate bill",
    "Item unavailable in kitchen",
    "Customer left without waiting",
    "Other",
  ];

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    setLoading(true);
    try {
      const res = await fetch(`/api/bills/${bill.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reason === "Other" && notes ? `Other: ${notes}` : reason,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel bill");

      onCancelSuccess(bill.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-scale-up">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <Ban className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900">Cancel Bill #{bill.billNumber}</h3>
              <div className="text-xs text-slate-500">{bill.orderReference} &bull; {formatCurrency(bill.totalAmount)}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-700 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleCancelSubmit} className="space-y-4">
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Audit Notice:</strong> Cancelled bills are permanently logged for the Owner's audit and will NOT be counted in daily collected income.
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Select Reason for Cancellation *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            >
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Table changed their mind before cooking"
              rows={2}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>{loading ? "Cancelling..." : "Confirm Cancellation"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
