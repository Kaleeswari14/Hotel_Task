"use client";

import React, { useState } from "react";
import { Printer, X } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { useLanguage } from "@/context/LanguageContext";

interface BillItem {
  id: string;
  foodName: string;
  portionName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  createdAt: string;
}

interface BillData {
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
  balanceAmount?: number;
  status: string;
  createdAt: string;
  items: BillItem[];
  payments?: Payment[];
  createdBy?: { name: string };
}

interface ThermalReceiptProps {
  bill: BillData;
  initialMode?: "ORDER_SLIP" | "PAYMENT_RECEIPT";
  isReprint?: boolean;
  autoPrint?: boolean;
  onClose: () => void;
}

export default function ThermalReceipt({

  bill,
  initialMode,
  isReprint = false,
  autoPrint = false,
  onClose,
}: ThermalReceiptProps) {
  // Determine default receipt mode based on bill status if not explicitly passed
  const defaultMode = initialMode || (bill.status === "PAID" ? "PAYMENT_RECEIPT" : "ORDER_SLIP");
  const { isTamil, language } = useLanguage();
  const [receiptMode, setReceiptMode] = useState<"ORDER_SLIP" | "PAYMENT_RECEIPT">(defaultMode);
  const [paperWidth, setPaperWidth] = useState<"58mm" | "80mm">("80mm");

  const hotelName = process.env.NEXT_PUBLIC_HOTEL_NAME || "HOTEL JB";
  const hotelAddress = process.env.NEXT_PUBLIC_HOTEL_ADDRESS || "Main Road, City Center";
  const hotelPhone = process.env.NEXT_PUBLIC_HOTEL_PHONE || "+91 98765 43210";

  const handlePrint = () => {
    window.print();
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const printedRef = React.useRef(false);

  // Auto-trigger print dialog EXACTLY ONCE if autoPrint is true
  React.useEffect(() => {
    if (autoPrint && !printedRef.current) {
      printedRef.current = true;
      const timer = setTimeout(() => {
        window.print();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  // Keyboard shortcut: Escape to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const primaryPayment = bill.payments && bill.payments.length > 0 ? bill.payments[0] : null;
  const totalItemCount = bill.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:fixed">
      {/* Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-5 sm:p-6 my-8 animate-scale-up print:m-0 print:p-0 print:border-none print:shadow-none print:w-full">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="pb-3 border-b border-slate-100 mb-4 print:hidden flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase">Size:</span>
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setPaperWidth("58mm")}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  paperWidth === "58mm" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                }`}
              >
                58mm
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth("80mm")}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  paperWidth === "80mm" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                }`}
              >
                80mm
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* THERMAL RECEIPT PAPER LAYOUT */}
        {/* ========================================================================= */}
        <div
          id="thermal-receipt"
          className={`mx-auto bg-white font-mono text-slate-900 p-4 border border-dashed border-slate-300 rounded-xl shadow-inner print:border-none print:shadow-none print:p-0 ${
            paperWidth === "58mm" ? "max-w-[240px] text-[11px]" : "max-w-[340px] text-xs"
          }`}
        >
          {/* Header */}
          <div className="text-center pb-2 border-b border-dashed border-slate-400">
            <h2 className="font-black text-sm sm:text-base uppercase tracking-wider">{hotelName}</h2>
            <div className="text-[10px] leading-tight text-slate-600 mt-0.5">{hotelAddress}</div>
            <div className="text-[10px] text-slate-600">Ph: {hotelPhone}</div>

            {/* Slip Type Header Badge */}
            {receiptMode === "ORDER_SLIP" ? (
              <div className="mt-1.5 inline-block px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded border border-amber-300 uppercase">
                📋 ORDER SLIP / KOT (TOKEN COPY)
              </div>
            ) : (
              <div className="mt-1.5 inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-black rounded border border-emerald-300 uppercase">
                💳 TAX INVOICE / PAID RECEIPT
              </div>
            )}

            {isReprint && (
              <div className="mt-1 block text-[10px] font-black text-slate-500">
                ** DUPLICATE / REPRINT **
              </div>
            )}
          </div>

          {/* Bill Info */}
          <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
            <div className="flex items-center justify-between font-bold gap-1">
              <span className="shrink-0">BILL #{bill.billNumber}</span>
              <span className="uppercase text-slate-900 font-black bg-amber-50 px-1 py-0.2 rounded border border-amber-200 text-right truncate">
                {bill.orderReference}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 text-[10px] gap-1">
              <span className="truncate">Date: {formatDateTime(bill.createdAt)}</span>
              <span className="font-bold shrink-0">{bill.orderType}</span>
            </div>
            {(bill.customerName || bill.customerPhone) && (
              <div className="flex items-center justify-between text-slate-800 text-[10px] font-bold border-t border-dashed border-slate-300 pt-1 mt-0.5 gap-1">
                <span className="truncate">Cust: {bill.customerName || "Walk-in"}</span>
                {bill.customerPhone && <span className="shrink-0 font-mono">📞 {bill.customerPhone}</span>}
              </div>
            )}
            {bill.createdBy && (
              <div className="text-[10px] text-slate-600">Taken by: {bill.createdBy.name}</div>
            )}
          </div>

          {/* Itemized Table */}
          <div className="py-2 border-b border-dashed border-slate-400">
            {/* Table Header Columns */}
            <div className="flex justify-between font-bold pb-1 text-[10px] uppercase border-b border-dashed border-slate-300 gap-1">
              <span className="flex-1 text-left truncate">{isTamil ? "உணவு (அளவு)" : "ITEM (PORTION)"}</span>
              {receiptMode === "PAYMENT_RECEIPT" && <span className="w-12 text-right shrink-0">{isTamil ? "விலை" : "RATE"}</span>}
              <span className="w-8 text-right shrink-0">{isTamil ? "எண்" : "QTY"}</span>
              <span className="w-14 text-right shrink-0">{isTamil ? "தொகை" : "TOTAL"}</span>
            </div>

            {/* Line Items */}
            <div className="space-y-1.5 mt-1.5">
              {bill.items.map((item) => (
                <div key={item.id} className="text-[11px]">
                  <div className="font-bold leading-tight break-words">{item.foodName}</div>
                  <div className="flex justify-between text-slate-700 text-[10px] gap-1">
                    <span className="flex-1 text-slate-500 italic pl-1 truncate">
                      {item.portionName}
                    </span>
                    {receiptMode === "PAYMENT_RECEIPT" && (
                      <span className="w-12 text-right font-mono shrink-0">
                        ₹{item.unitPrice.toFixed(0)}
                      </span>
                    )}
                    <span className="w-8 text-right font-black shrink-0">
                      {item.quantity}
                    </span>
                    <span className="w-14 text-right font-black text-slate-900 font-mono shrink-0">
                      ₹{item.subtotal.toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Section */}
          <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600 gap-1">
              <span className="truncate">Item Total ({totalItemCount} items):</span>
              <span className="font-mono shrink-0">₹{bill.subtotal.toFixed(0)}</span>
            </div>
            {bill.discount > 0 && (
              <div className="flex justify-between text-slate-600 gap-1">
                <span className="truncate">Discount:</span>
                <span className="font-mono shrink-0">-₹{bill.discount.toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline text-sm font-black pt-1 border-t border-dashed border-slate-400 gap-1">
              <span className="shrink-0">{receiptMode === "ORDER_SLIP" ? "EST. TOTAL:" : "GRAND TOTAL:"}</span>
              <span className="font-mono text-base font-black shrink-0">₹{bill.totalAmount.toFixed(0)}</span>
            </div>

            {/* Status / Payment Section */}
            {receiptMode === "ORDER_SLIP" ? (
              <div className="mt-1 p-1.5 bg-amber-50 border border-dashed border-amber-300 rounded text-center">
                <div className="text-[10px] font-black text-amber-900 uppercase">
                  ⚠️ {isTamil ? "ஆர்டர் சீட்டு (UNPAID)" : "UNPAID ORDER SLIP"}
                </div>
                <div className="text-[9px] text-amber-700">
                  {isTamil ? "பணத்தை கேஷ் கவுண்டரில் செலுத்தவும்." : "Please show this slip & pay at the cash counter."}
                </div>
              </div>
            ) : (
              <div className="pt-0.5 space-y-0.5">
                <div className="flex justify-between text-[11px] font-black text-emerald-800 gap-1">
                  <span className="truncate">
                    {isTamil ? "செலுத்திய முறை (" : "PAID VIA "}
                    {primaryPayment?.paymentMethod || "CASH"}
                    {isTamil ? "):" : ":"}
                  </span>
                  <span className="font-mono shrink-0">
                    ₹{(bill.paidAmount > 0 ? bill.paidAmount : bill.totalAmount).toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] font-black text-emerald-700">
                  <span>{isTamil ? "பில் நிலை:" : "STATUS:"}</span>
                  <span className="uppercase">{isTamil ? "முழுவதும் செலுத்தப்பட்டது (PAID)" : "PAID IN FULL"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="text-center pt-2.5 text-[10px] text-slate-600 space-y-0.5">
            {receiptMode === "ORDER_SLIP" ? (
              <>
                <div className="font-black text-xs uppercase tracking-wider">*** KITCHEN &amp; TOKEN COPY ***</div>
                <div>Food will be prepared against this token</div>
              </>
            ) : (
              <>
                <div className="font-black text-xs uppercase tracking-wider">*** THANK YOU ***</div>
                <div>PLEASE VISIT AGAIN!</div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons (Hidden during actual print) */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-all"
          >
            Close (Esc)
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className={`flex-1 py-3 px-4 text-white font-black rounded-xl shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm ${
              receiptMode === "ORDER_SLIP"
                ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/20"
                : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>
              {receiptMode === "ORDER_SLIP" ? "Print Order Slip (KOT)" : "Print Payment Bill (Receipt)"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
