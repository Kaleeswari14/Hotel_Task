import React from "react";
import prisma from "@/lib/prisma";
import { Ban, AlertCircle, Clock, User } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/format";

export default async function CancelledBillsPage() {
  const cancellations = await prisma.cancellation.findMany({
    include: {
      bill: {
        include: {
          items: true,
          createdBy: { select: { name: true, username: true } },
        },
      },
      cancelledBy: { select: { name: true, username: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalCancelledAmount = cancellations.reduce((sum, c) => sum + c.bill.totalAmount, 0);

  return (
    <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">Cancelled Bills Audit</h1>
            <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-300">
              {cancellations.length} Cancelled
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Complete audit trail of cancelled orders. Total Void Amount:{" "}
            <span className="font-extrabold text-red-600">{formatCurrency(totalCancelledAmount)}</span> (Excluded from income).
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                <th className="p-4">Bill No & Ref</th>
                <th className="p-4">Items Summary</th>
                <th className="p-4">Void Amount</th>
                <th className="p-4">Cancellation Reason</th>
                <th className="p-4">Cancelled By</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {cancellations.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <div className="font-extrabold text-slate-900">
                      Bill #{c.bill.billNumber}
                    </div>
                    <div className="text-xs text-slate-500">{c.bill.orderReference}</div>
                  </td>

                  <td className="p-4">
                    <div className="text-xs text-slate-700 max-w-xs line-clamp-2">
                      {c.bill.items
                        .map((i) => `${i.foodName} (${i.portionName}) x ${i.quantity}`)
                        .join(", ")}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="font-extrabold text-red-600">
                      {formatCurrency(c.bill.totalAmount)}
                    </div>
                  </td>

                  <td className="p-4">
                    <span className="inline-block px-2.5 py-1 bg-red-50 text-red-800 text-xs font-bold rounded-lg border border-red-200">
                      {c.reason}
                    </span>
                    {c.notes && (
                      <div className="text-[11px] text-slate-400 mt-1 italic">
                        "{c.notes}"
                      </div>
                    )}
                  </td>

                  <td className="p-4">
                    <div className="font-bold text-slate-800 text-xs">
                      {c.cancelledBy.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      ({c.cancelledBy.role})
                    </div>
                  </td>

                  <td className="p-4 text-xs text-slate-500 font-mono">
                    {formatDateTime(c.createdAt)}
                  </td>
                </tr>
              ))}

              {cancellations.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <Ban className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <div className="font-bold text-slate-700 text-base">No Cancelled Bills</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      All created orders are currently active or successfully paid.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
