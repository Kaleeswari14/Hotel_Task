"use client";

import React, { useState } from "react";
import { QrCode, Printer, Sparkles, Download, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function QrCodesView() {
  const { isTamil } = useLanguage();
  const [tableCount, setTableCount] = useState(12);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-orange-500/20">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>{isTamil ? "டேபிள் QR கோடு ஸ்டிக்கர்கள்" : "Table QR Code Generator"}</span>
              <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-black rounded-full uppercase tracking-wider">
                Self-Order Ready
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isTamil 
                ? "இந்த QR ஸ்டிக்கர்களை பிரிண்ட் செய்து டேபிள்களில் ஒட்டினால் வாடிக்கையாளர்கள் தங்கள் போனிலேயே ஆர்டர் செய்வார்கள்."
                : "Print and place these QR stickers on tables to allow customer self-ordering."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <span>{isTamil ? "டேபிள்கள் எண்ணிக்கை:" : "Tables count:"}</span>
            <input
              type="number"
              min="1"
              max="50"
              value={tableCount}
              onChange={(e) => setTableCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-16 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 font-mono text-center"
            />
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-2xl shadow-md shadow-orange-500/20 flex items-center gap-2 transition-all active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" />
            <span>{isTamil ? "ஸ்டிக்கர் பிரிண்ட் செய்" : "Print All Stickers"}</span>
          </button>
        </div>
      </div>

      {/* QR Code Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: tableCount }).map((_, idx) => {
          const tableNum = idx + 1;
          const orderUrl = `${baseUrl}/order/${tableNum}`;
          const qrImageApi = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(orderUrl)}&color=ea580c`;

          return (
            <div
              key={tableNum}
              className="bg-white p-5 rounded-3xl border-2 border-orange-200/80 shadow-sm text-center space-y-3 print:border-2 print:border-black print:rounded-2xl print:break-inside-avoid"
            >
              <div className="flex items-center justify-center gap-1.5 text-orange-600 font-black text-sm">
                <span className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center text-xs">
                  JB
                </span>
                <span>HOTEL JB</span>
              </div>

              <div className="bg-orange-50/50 p-2.5 rounded-2xl border border-orange-100 inline-block">
                <img
                  src={qrImageApi}
                  alt={`QR Code Table ${tableNum}`}
                  className="w-36 h-36 mx-auto rounded-xl"
                />
              </div>

              <div>
                <div className="text-lg font-black text-slate-900 font-mono uppercase tracking-wider">
                  TABLE {tableNum}
                </div>
                <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                  {isTamil ? "போனில் ஸ்கேன் செய்து ஆர்டர் செய்" : "Scan to View Menu & Order"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
