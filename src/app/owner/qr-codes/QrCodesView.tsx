"use client";

import React, { useState, useEffect } from "react";
import { QrCode, Printer, Wifi, Globe, Copy, Check, ExternalLink, Info } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function QrCodesView() {
  const { isTamil } = useLanguage();
  const [tableCount, setTableCount] = useState(12);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Initialize baseUrl with host LAN IP or origin
  const [hostUrl, setHostUrl] = useState("http://192.168.1.9:3000");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : "";
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        setHostUrl(`http://192.168.1.9${port || ":3000"}`);
      } else {
        setHostUrl(`${window.location.protocol}//${hostname}${port}`);
      }
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const copyToClipboard = (url: string, idx: number) => {
    navigator.clipboard.writeText(url);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                  : "Print and place these QR stickers on tables to allow customer self-ordering from their phones."}
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

        {/* Host IP Configuration & Mobile Wifi Guidance */}
        <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-orange-600 shrink-0" />
              <span className="text-xs font-black text-orange-950">
                {isTamil ? "மொபைல் ஸ்கேன் செய்ய வேண்டிய சர்வர் IP (Host URL):" : "Server Host IP for Mobile QR Scanning:"}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-md">
              <input
                type="text"
                value={hostUrl}
                onChange={(e) => setHostUrl(e.target.value)}
                placeholder="http://192.168.1.9:3000"
                className="flex-1 px-3 py-1.5 bg-white border border-orange-300 rounded-xl font-mono text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => setHostUrl("http://192.168.1.9:3000")}
                className="px-2.5 py-1.5 bg-orange-200/70 hover:bg-orange-200 text-orange-900 rounded-xl text-[11px] font-black transition-all"
              >
                192.168.1.9
              </button>
              <button
                type="button"
                onClick={() => setHostUrl("http://localhost:3000")}
                className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-[11px] font-black transition-all"
              >
                Localhost
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 text-[11px] text-orange-800 bg-white/80 p-2.5 rounded-xl border border-orange-100">
            <Info className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {isTamil ? (
                <span>
                  <strong>முக்கிய குறிப்பு:</strong> மொபைலில் QR ஸ்கேன் செய்யும்போது <code>localhost</code> வேலை செய்யாது. எனவே இந்த கம்ப்யூட்டரும் மொபைலும் ஒரே Wi-Fi இல் இணைக்கப்பட்டிருக்க வேண்டும், மேலும் லிங்க் <strong>{hostUrl}/order/1</strong> வடிவில் இருக்க வேண்டும்.
                </span>
              ) : (
                <span>
                  <strong>Important Note:</strong> Mobile QR scanning will not connect to <code>localhost</code>. Ensure both PC and mobile are on the same Wi-Fi network and the URL starts with your LAN IP (e.g. <strong>{hostUrl}/order/1</strong>).
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* QR Code Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: tableCount }).map((_, idx) => {
          const tableNum = idx + 1;
          const cleanHost = hostUrl.replace(/\/+$/, "");
          const orderUrl = `${cleanHost}/order/${tableNum}`;
          const qrImageApi = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(orderUrl)}&color=ea580c`;

          return (
            <div
              key={tableNum}
              className="bg-white p-5 rounded-3xl border-2 border-orange-200/80 shadow-sm text-center space-y-3 print:border-2 print:border-black print:rounded-2xl print:break-inside-avoid relative group"
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
                  className="w-36 h-36 mx-auto rounded-xl shadow-xs"
                />
              </div>

              <div>
                <div className="text-lg font-black text-slate-900 font-mono uppercase tracking-wider">
                  TABLE {tableNum}
                </div>
                <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                  {isTamil ? "போனில் ஸ்கேன் செய்து ஆர்டர் செய்" : "Scan to View Menu & Order"}
                </div>
                <div className="text-[9px] font-mono text-slate-400 mt-1 truncate px-1" title={orderUrl}>
                  {orderUrl}
                </div>
              </div>

              {/* Action Buttons (Hidden when printing) */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 print:hidden">
                <button
                  type="button"
                  onClick={() => copyToClipboard(orderUrl, tableNum)}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all"
                  title="Copy Link"
                >
                  {copiedIdx === tableNum ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600">{isTamil ? "நகலெடுக்கப்பட்டது" : "Copied"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-500" />
                      <span>{isTamil ? "லிங்க் காப்பி" : "Copy Link"}</span>
                    </>
                  )}
                </button>

                <a
                  href={orderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all"
                  title="Open Link"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>{isTamil ? "திறக்க" : "Open"}</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
