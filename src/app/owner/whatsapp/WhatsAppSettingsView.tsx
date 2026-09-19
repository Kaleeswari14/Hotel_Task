"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Zap,
  CheckCircle2,
  AlertCircle,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  RefreshCw,
  QrCode,
  LogOut,
  Wifi,
  WifiOff,
  Users,
  Tag,
  Image as ImageIcon,
  Check,
  Eye,
  Play,
  Flame,
  Utensils,
  Percent,
  Clock,
  ExternalLink
} from "lucide-react";

interface CustomerAudience {
  phone: string;
  name: string;
  visitCount: number;
  lastVisit: string;
}

const OFFER_TEMPLATES = [
  {
    id: "biriyani_fest",
    title: "🍗 Weekend Biriyani Fest (15% OFF)",
    badge: "Most Popular",
    badgeColor: "bg-amber-500",
    posterUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
    message: `✨ *HOTEL JB — Weekend Biriyani Fest!* 🍗🔥
━━━━━━━━━━━━━━━━━━
Dear {customer_name},

Enjoy a *15% direct discount* on all Seeraga Samba & Basmati Biriyanis this Saturday & Sunday at *HOTEL JB*! 🥘

🏷️ Coupon Code: *BIRIYANI15*
📍 Location: HOTEL JB, Main Road
📞 Orders & Booking: 9876543210

Bring your family and taste the freshness! 🙏✨`,
  },
  {
    id: "meals_special",
    title: "🍱 Special Meal Discount (₹50 OFF)",
    badge: "Lunch Rush",
    badgeColor: "bg-orange-600",
    posterUrl: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80",
    message: `✨ *HOTEL JB — Lunch Special Meal Discount!* 🍱
━━━━━━━━━━━━━━━━━━
Hello {customer_name}!

Enjoy a special *₹50 discount* on our traditional banana leaf lunch meals today! 🍛

🏷️ Coupon Code: *LUNCH50*
🕒 Timing: 12:00 PM to 3:30 PM
📍 Location: HOTEL JB

Visit us today for hot and fresh food! 🙏`,
  },
  {
    id: "new_dish",
    title: "🍄 New Dish Launch — Mushroom Biriyani",
    badge: "New Launch",
    badgeColor: "bg-purple-600",
    posterUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
    message: `🍄 *HOTEL JB — Special Mushroom Biriyani Launch!* ✨
━━━━━━━━━━━━━━━━━━
Dear {customer_name},

We have newly launched Chettinad Style *Special Mushroom Biriyani (Kalan Biriyani)* in our menu!

🎁 *Launch Offer:*
First 50 customers get a *10% Discount* + Free Sweet!

🏷️ Promo Code: *KALAN10*
Visit us today and share your feedback! 🌟`,
  },
  {
    id: "flat_promo",
    title: "🎁 General 10% Discount (HOTEL10)",
    badge: "All Customers",
    badgeColor: "bg-blue-600",
    posterUrl: "",
    message: `✨ *HOTEL JB — Special 10% Discount Coupon for You!* 🎁
━━━━━━━━━━━━━━━━━━
Hello {customer_name}!

Thank you for being a valued customer at HOTEL JB. Use this coupon on your next billing to receive a *10% discount*!

🏷️ Promo Code: *HOTEL10*
📆 Validity: All this week

Thank you! Visit again! 🙏`,
  },
];

export default function WhatsAppSettingsView() {
  const [activeTab, setActiveTab] = useState<"connection" | "broadcast">("connection");

  // WhatsApp Connection State
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test send state
  const [testPhone, setTestPhone] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Broadcast & Marketing State
  const [audience, setAudience] = useState<CustomerAudience[]>([]);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(OFFER_TEMPLATES[0].id);
  const [broadcastMessage, setBroadcastMessage] = useState<string>(OFFER_TEMPLATES[0].message);
  const [posterUrl, setPosterUrl] = useState<string>(OFFER_TEMPLATES[0].posterUrl);
  const [broadcastTestPhone, setBroadcastTestPhone] = useState<string>("");
  const [isSendingBroadcastTest, setIsSendingBroadcastTest] = useState<boolean>(false);
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [broadcastProgress, setBroadcastProgress] = useState<{
    sent: number;
    failed: number;
    total: number;
    done: boolean;
  } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showAudienceModal, setShowAudienceModal] = useState<boolean>(false);

  const pollTimerRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchStatus = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/whatsapp/qr");
      if (res.ok) {
        const data = await res.json();
        setIsConnected(Boolean(data.isConnected));
        setQrCode(data.qrCode || null);
        setPhoneNumber(data.phoneNumber || null);
        setError(null);
      }
    } catch (e: any) {
      setError("Failed to check WhatsApp status");
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  const fetchAudience = async () => {
    setAudienceLoading(true);
    try {
      const res = await fetch("/api/whatsapp/broadcast");
      if (res.ok) {
        const data = await res.json();
        setAudience(data.customers || []);
      }
    } catch (e) {
      console.error("Failed to load audience", e);
    } finally {
      setAudienceLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchAudience();

    // Poll status every 2.5 seconds while not connected or when waiting for QR scan
    pollTimerRef.current = setInterval(() => {
      fetchStatus();
    }, 2500);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const handleManualRefreshQR = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/whatsapp/qr", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setIsConnected(Boolean(data.isConnected));
        setQrCode(data.qrCode || null);
        setPhoneNumber(data.phoneNumber || null);
      }
    } catch (e) {
      setError("Failed to refresh QR Code");
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to disconnect this WhatsApp number?")) return;
    setLoggingOut(true);
    try {
      const res = await fetch("/api/whatsapp/logout", { method: "POST" });
      if (res.ok) {
        setIsConnected(false);
        setPhoneNumber(null);
        setQrCode(null);
        setTimeout(() => fetchStatus(true), 1500);
      }
    } catch (e) {
      alert("Failed to disconnect WhatsApp");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!testPhone.trim() || testPhone.replace(/\D/g, "").length < 10) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }

    if (!isConnected) {
      alert("Please scan the QR code to connect WhatsApp first!");
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: testPhone.trim(),
          customerName: "Test Customer",
          billNumber: 9999,
          message: `✨ *HOTEL JB - TEST MESSAGE* ✨\n━━━━━━━━━━━━━━━━━━\n🎉 வாழ்த்துகள்! உங்கள் HOTEL JB WhatsApp Engine வெற்றிகரமாக இணைக்கப்பட்டுவிட்டது!\n\n🧾 Test Bill: #9999\n💰 Status: 100% Free Background Dispatch\n\n⭐ Ready for Super-Fast Rush Hour Billing! ⭐`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: `✅ Test message delivered instantly in the background to +91 ${testPhone.slice(-10)}!`,
        });
      } else {
        throw new Error(data.error || "Failed to send message");
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `❌ ${err.message || "Sending failed. Make sure WhatsApp is connected."}`,
      });
    } finally {
      setTesting(false);
    }
  };

  // Manual Offer Form Builder State
  const [offerForm, setOfferForm] = useState({
    title: "வார இறுதி சிறப்பு பிரியாணி திருவிழா! 🍗🔥",
    discountType: "PERCENT" as "PERCENT" | "FLAT" | "FREE" | "CUSTOM",
    discountValue: "15",
    couponCode: "BIRIYANI15",
    validity: "இந்த சனி & ஞாயிறு மட்டும் (Sat & Sun)",
    notes: "அனைத்து வகையான சீரக சம்பா & பாசுமதி பிரியாணிகளுக்கும் பொருந்தும்.",
    hotelPhone: "9876543210",
    posterUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
  });

  const [editorMode, setEditorMode] = useState<"form" | "raw">("form");
  const [autoSyncMessage, setAutoSyncMessage] = useState(true);

  // Helper to build formatted message from manual form inputs
  const buildMessageFromForm = (f: typeof offerForm) => {
    const hotelName = process.env.NEXT_PUBLIC_HOTEL_NAME || "HOTEL JB";
    let discountLine = "";
    if (f.discountType === "PERCENT") {
      discountLine = `*${f.discountValue}% நேரடி தள்ளுபடி (Flat ${f.discountValue}% OFF)*! 🥘`;
    } else if (f.discountType === "FLAT") {
      discountLine = `*₹${f.discountValue} உடனடி தள்ளுபடி (Flat ₹${f.discountValue} OFF)*! 🍛`;
    } else if (f.discountType === "FREE") {
      discountLine = `இலவச சலுகை: *${f.discountValue}*! 🎁`;
    } else {
      discountLine = `சிறப்பு சலுகை: *${f.discountValue}*! ✨`;
    }

    return `✨ *${hotelName} — ${f.title || "சிறப்பு சலுகை!"}* ✨
━━━━━━━━━━━━━━━━━━
அன்பான {customer_name},

உங்கள் *${hotelName}*-ல் உங்களுக்காக ${discountLine}
${f.notes ? `\n📌 ${f.notes}` : ""}
${f.couponCode ? `\n🏷️ Coupon / Promo Code: *${f.couponCode.toUpperCase()}*` : ""}
${f.validity ? `\n📆 சலுகை காலம்: *${f.validity}*` : ""}
📍 இடம்: ${hotelName}, Main Road
${f.hotelPhone ? `📞 பார்சல் & முன்பதிவுக்கு: ${f.hotelPhone}` : ""}

குடும்பத்துடன் வந்து சுவைத்து மகிழுங்கள்! 🙏✨`;
  };

  const handleUpdateFormField = (field: keyof typeof offerForm, value: string) => {
    const updated = { ...offerForm, [field]: value };
    setOfferForm(updated);
    if (field === "posterUrl") {
      setPosterUrl(value);
    }
    if (autoSyncMessage) {
      setBroadcastMessage(buildMessageFromForm(updated));
    }
  };

  const handleCreateBlankOffer = () => {
    setSelectedTemplateId("custom_blank");
    const blank = {
      title: "",
      discountType: "PERCENT" as const,
      discountValue: "10",
      couponCode: "OFFER10",
      validity: "இன்று மட்டும்",
      notes: "அனைத்து உணவுகளுக்கும் பொருந்தும்",
      hotelPhone: "9876543210",
      posterUrl: "",
    };
    setOfferForm(blank);
    setPosterUrl("");
    setBroadcastMessage(buildMessageFromForm(blank));
    setEditorMode("form");
    showToast("✍️ Fresh manual offer builder ready! Fill in your details below.");
  };

  const handleSelectTemplate = (tmpl: typeof OFFER_TEMPLATES[0]) => {
    setSelectedTemplateId(tmpl.id);
    setBroadcastMessage(tmpl.message);
    setPosterUrl(tmpl.posterUrl);

    // Extract details to form
    if (tmpl.id === "biriyani_fest") {
      setOfferForm({
        title: "வார இறுதி சிறப்பு பிரியாணி திருவிழா! 🍗🔥",
        discountType: "PERCENT",
        discountValue: "15",
        couponCode: "BIRIYANI15",
        validity: "இந்த சனி & ஞாயிறு மட்டும்",
        notes: "அனைத்து வகையான பிரியாணிக்கும் பொருந்தும்.",
        hotelPhone: "9876543210",
        posterUrl: tmpl.posterUrl,
      });
    } else if (tmpl.id === "meals_special") {
      setOfferForm({
        title: "மதிய சைவ & அசைவ சாப்பாடு தள்ளுபடி! 🍱",
        discountType: "FLAT",
        discountValue: "50",
        couponCode: "LUNCH50",
        validity: "12:00 PM முதல் 3:30 PM வரை",
        notes: "தலைவாழை இலை சாப்பாட்டிற்கு பொருந்தும்.",
        hotelPhone: "9876543210",
        posterUrl: tmpl.posterUrl,
      });
    } else if (tmpl.id === "new_dish") {
      setOfferForm({
        title: "புதிய ஸ்பெஷல் காளான் பிரியாணி அறிமுகம்! 🍄",
        discountType: "PERCENT",
        discountValue: "10",
        couponCode: "KALAN10",
        validity: "முதல் 50 வாடிக்கையாளர்களுக்கு மட்டும்",
        notes: "இலவச இனிப்புடன் வழங்கப்படும்.",
        hotelPhone: "9876543210",
        posterUrl: tmpl.posterUrl,
      });
    } else {
      setOfferForm({
        title: "சிறப்பு 10% தள்ளுபடி கூப்பன்! 🎁",
        discountType: "PERCENT",
        discountValue: "10",
        couponCode: "HOTEL10",
        validity: "இந்த வாரம் முழுவதும்",
        notes: "அனைத்து பில்லிங்கிற்கும் பொருந்தும்.",
        hotelPhone: "9876543210",
        posterUrl: "",
      });
    }
  };

  // Test Offer message to a single number
  const handleSendBroadcastTest = async () => {
    const cleanPhone = broadcastTestPhone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number for test preview");
      return;
    }

    if (!isConnected) {
      alert("Please connect WhatsApp before testing promotional broadcast!");
      return;
    }

    setIsSendingBroadcastTest(true);
    try {
      const sampleText = broadcastMessage.replace(/\{customer_name\}/g, "Valued Customer");
      const fullMsg = posterUrl.trim()
        ? `[🖼️ Poster Image: ${posterUrl.trim()}]\n\n${sampleText}`
        : sampleText;

      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          customerName: "Valued Customer",
          billNumber: 0,
          message: fullMsg,
        }),
      });

      const result = await res.json();
      if (result.success) {
        showToast(`🧪 Test offer message delivered to +91 ${cleanPhone.slice(-10)}!`);
      } else {
        throw new Error(result.error || "Delivery failed");
      }
    } catch (err: any) {
      alert(`Test Send Failed: ${err.message}`);
    } finally {
      setIsSendingBroadcastTest(false);
    }
  };

  // 1-Click Broadcast to All Customers
  const handleStartBroadcast = async () => {
    if (!isConnected) {
      alert("Please connect WhatsApp before launching promotional broadcast!");
      return;
    }

    if (audience.length === 0) {
      alert("No previous customer phone numbers found in order history to broadcast to.");
      return;
    }

    setShowConfirmModal(false);
    setIsBroadcasting(true);
    setBroadcastProgress({
      sent: 0,
      failed: 0,
      total: audience.length,
      done: false,
    });

    try {
      const res = await fetch("/api/whatsapp/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: broadcastMessage,
          posterUrl: posterUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setBroadcastProgress({
          sent: data.sentCount,
          failed: data.failedCount,
          total: data.totalTargets,
          done: true,
        });
        showToast(`🎉 Broadcast Complete! Sent: ${data.sentCount} / ${data.totalTargets}`);
      } else {
        throw new Error(data.error || "Broadcast encountered an error");
      }
    } catch (err: any) {
      alert(`Broadcast Error: ${err.message}`);
      setBroadcastProgress(null);
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-orange-400 text-sm font-semibold animate-slide-up">
          <Check className="w-5 h-5" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 flex-wrap">
              <span>WhatsApp Automation &amp; Marketing Hub</span>
              <span className="px-2.5 py-0.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-black rounded-full uppercase tracking-wider shadow-sm shadow-orange-500/20">
                100% Free / ₹0 API
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live background bill dispatches, night closing reports, and 1-click customer offer broadcasts.
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2 rounded-2xl shadow-xs">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div className="text-xs font-black uppercase">
                🟢 Connected {phoneNumber && `(+${phoneNumber})`}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-900 px-4 py-2 rounded-2xl shadow-xs">
              <WifiOff className="w-4 h-4 text-amber-600 animate-pulse" />
              <div className="text-xs font-black uppercase">🟡 Scan QR to Connect</div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("connection")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === "connection"
              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20"
              : "bg-white text-slate-600 hover:bg-orange-50 hover:text-orange-600 border border-slate-200"
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>1. WhatsApp Pairing &amp; QR Setup</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("broadcast");
            fetchAudience();
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === "broadcast"
              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20"
              : "bg-white text-slate-600 hover:bg-orange-50 hover:text-orange-600 border border-slate-200"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>2. Customer Offer Broadcast &amp; Marketing</span>
          <span className="bg-orange-100 text-orange-900 px-2 py-0.5 rounded-full text-[10px] font-black">
            {audience.length} Customers
          </span>
        </button>
      </div>

      {/* TAB 1: CONNECTION & QR SETUP */}
      {activeTab === "connection" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: QR Code / Connected Status */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-slate-700" />
                <span>Device Pairing &amp; Status</span>
              </h2>
              <button
                type="button"
                onClick={handleManualRefreshQR}
                disabled={refreshing}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
                title="Refresh QR / Status"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>

            {isConnected ? (
              /* Connected State Card */
              <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-200 text-center space-y-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-orange-500/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    WhatsApp Linked &amp; Ready! 🎉
                  </h3>
                  <p className="text-xs text-orange-700 font-bold mt-1">
                    Connected Phone: <span className="font-mono font-bold text-sm">+{phoneNumber}</span>
                  </p>
                  <p className="text-[11px] text-slate-600 mt-2 max-w-sm mx-auto">
                    POS பில்லிங்கில் நீங்கள் <b>ENTER</b> தட்டியதும், எந்தவித தாமதமுமின்றி 0.5 நொடியில் வாடிக்கையாளருக்கு பில் பின்னணியில் தானாகச் செல்லும்!
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="px-4 py-2 bg-white hover:bg-red-50 text-red-700 font-bold text-xs rounded-xl border border-red-200 shadow-xs flex items-center gap-1.5 mx-auto transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{loggingOut ? "Disconnecting..." : "Disconnect WhatsApp"}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* QR Code Scanner Card */
              <div className="space-y-4">
                <div className="text-center bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-300">
                  {qrCode ? (
                    <div className="inline-block p-3 bg-white rounded-2xl shadow-md border border-slate-200 animate-scale-up">
                      <img
                        src={qrCode}
                        alt="WhatsApp Pairing QR Code"
                        className="w-56 h-56 mx-auto rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="w-56 h-56 mx-auto rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
                      <span className="text-xs font-bold text-slate-600">Generating QR Code...</span>
                    </div>
                  )}

                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-900 rounded-full text-xs font-black">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Point phone camera at this QR code</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Instant Test Sender & Scan Guide */}
          <div className="lg:col-span-5 space-y-6">
            {/* Test Sender Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                <Send className="w-4 h-4 text-orange-500" />
                <span>Test Instant Send (சோதனை)</span>
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number to Test:
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full pl-12 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendTestMessage}
                  disabled={testing || !isConnected}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Send className={`w-3.5 h-3.5 ${testing ? "animate-spin" : ""}`} />
                  <span>{testing ? "Sending in Background..." : "Send Test WhatsApp Message"}</span>
                </button>

                {testResult && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold ${
                      testResult.success
                        ? "bg-emerald-50 text-emerald-900 border border-emerald-300"
                        : "bg-red-50 text-red-900 border border-red-300"
                    }`}
                  >
                    {testResult.message}
                  </div>
                )}
              </div>
            </div>

            {/* Step-by-Step Scan Instructions Card */}
            <div className="bg-white p-6 rounded-3xl border border-orange-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-orange-600 text-xs font-black uppercase tracking-wider pb-2 border-b border-orange-100">
                <Smartphone className="w-4 h-4" />
                <span>இணைக்கும் வழிமுறை (How to Scan)</span>
              </div>

              <ol className="text-xs space-y-2.5 text-slate-700">
                <li className="flex items-start gap-2.5 bg-orange-50/60 p-3 rounded-2xl border border-orange-100">
                  <span className="w-5 h-5 rounded-full bg-orange-500 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    1
                  </span>
                  <span className="leading-relaxed">
                    உங்கள் போனில் WhatsApp திறந்து, மேல் மூலையில் உள்ள <b className="text-slate-900">3 புள்ளிகள் (Menu)</b> அல்லது <b className="text-slate-900">Settings</b> கிளிக் செய்யவும்.
                  </span>
                </li>
                <li className="flex items-start gap-2.5 bg-orange-50/60 p-3 rounded-2xl border border-orange-100">
                  <span className="w-5 h-5 rounded-full bg-orange-500 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    2
                  </span>
                  <span className="leading-relaxed">
                    <b className="text-slate-900">Linked Devices</b> (இணைக்கப்பட்ட சாதனங்கள்) → <b className="text-slate-900">Link a Device</b> என்பதைத் தேர்ந்தெடுக்கவும்.
                  </span>
                </li>
                <li className="flex items-start gap-2.5 bg-orange-50/60 p-3 rounded-2xl border border-orange-100">
                  <span className="w-5 h-5 rounded-full bg-orange-500 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    3
                  </span>
                  <span className="leading-relaxed">
                    இடப்பக்கத்தில் உள்ள <b className="text-orange-600 font-bold">QR Code-ஐ ஸ்கேன் செய்யவும்</b>. 1 நொடியில் 🟢 <b className="text-emerald-700">Connected</b> ஆகிவிடும்!
                  </span>
                </li>
              </ol>

              <div className="pt-2 border-t border-orange-100 flex items-center justify-between text-[11px] text-slate-500 font-bold">
                <span className="text-orange-600">⚡ 100% Free Lifetime</span>
                <span className="text-slate-500">🔒 End-to-End Secure</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 1-CLICK CUSTOMER OFFER BROADCAST */}
      {activeTab === "broadcast" && (
        <div className="space-y-6 animate-fade-in">
          {/* Audience Overview Bar */}
          <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white p-6 rounded-3xl shadow-lg shadow-orange-500/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-white/20 text-white border border-white/30 text-[11px] font-black rounded-full uppercase">
                  1-Click Marketing Campaign
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  Direct WhatsApp Dispatch
                </span>
              </div>
              <h2 className="text-xl font-black text-white">
                Promote New Offers &amp; Dishes to All Past Customers
              </h2>
              <p className="text-xs text-slate-300">
                வாடிக்கையாளர்களின் மொபைல் எண்களுக்கு புதிய சலுகைகள், தள்ளுபடி கூப்பன்கள் மற்றும் போஸ்டர்களை 1-கிளிக்கில் அனுப்பவும்.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-xs shrink-0">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-white leading-none">
                  {audience.length}
                </div>
                <div className="text-[11px] text-orange-100 font-semibold mt-0.5">
                  Unique Customers
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAudienceModal(true)}
                className="ml-2 px-3 py-1.5 bg-white text-orange-600 font-bold text-xs rounded-xl shadow-xs hover:bg-orange-50 transition-all"
              >
                View List
              </button>
            </div>
          </div>

          {/* Offer Mode Selection & Quick Templates Bar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-black text-slate-900">
                  Offer Creation Mode (ஆஃபர் உருவாக்கும் முறை)
                </h3>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleCreateBlankOffer}
                  className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-800 font-bold text-xs rounded-xl border border-orange-200 flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  <span>➕ Create Custom Offer (புதிய ஆஃபர்)</span>
                </button>
              </div>
            </div>

            {/* Quick Template Selector Carousel */}
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Or Load Quick Presets (ரெடிமேட் டெம்ப்ளேட்கள்):</span>
                <span className="text-[10px] text-slate-400 font-normal">Click any template to auto-fill form</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {OFFER_TEMPLATES.map((tmpl) => {
                  const isSelected = selectedTemplateId === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tmpl)}
                      className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between gap-2.5 ${
                        isSelected
                          ? "border-orange-500 bg-orange-50/80 shadow-md ring-2 ring-orange-500/20"
                          : "border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-black text-white rounded-md mb-1.5 ${tmpl.badgeColor}`}
                        >
                          {tmpl.badge}
                        </span>
                        <h4 className="font-black text-xs text-slate-900 leading-snug">
                          {tmpl.title}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-bold text-orange-600 pt-1.5 border-t border-slate-200/60">
                        <span>{isSelected ? "✓ Active Preset" : "Load Preset"}</span>
                        {tmpl.posterUrl && <ImageIcon className="w-3.5 h-3.5 text-slate-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Editor & Live Preview Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Manual Offer Form Builder & Raw Message Editor (7 cols) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              {/* Mode Toggle Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setEditorMode("form")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      editorMode === "form"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    📝 Manual Form Builder
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode("raw")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      editorMode === "raw"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    ✏️ Full Raw Message Editor
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-slate-500 flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoSyncMessage}
                      onChange={(e) => setAutoSyncMessage(e.target.checked)}
                      className="rounded text-orange-500 focus:ring-orange-500 w-3.5 h-3.5"
                    />
                    <span>Auto-Sync</span>
                  </label>
                </div>
              </div>

              {/* MODE 1: FORM INPUTS BUILDER */}
              {editorMode === "form" && (
                <div className="space-y-4 animate-fade-in">
                  {/* Field 1: Offer Title */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      1. Offer Title / Dish Name (ஆஃபர் பெயர்):
                    </label>
                    <input
                      type="text"
                      value={offerForm.title}
                      onChange={(e) => handleUpdateFormField("title", e.target.value)}
                      placeholder="e.g. Sunday Special Biriyani Fest / ஞாயிறு பிரியாணி திருவிழா"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Field 2: Discount Type & Amount */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6 space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        2. Discount Type:
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateFormField("discountType", "PERCENT")}
                          className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                            offerForm.discountType === "PERCENT"
                              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          % Percentage OFF
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateFormField("discountType", "FLAT")}
                          className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                            offerForm.discountType === "FLAT"
                              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          ₹ Flat Cash OFF
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateFormField("discountType", "FREE")}
                          className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                            offerForm.discountType === "FREE"
                              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          🎁 Free Item / Buy 1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateFormField("discountType", "CUSTOM")}
                          className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                            offerForm.discountType === "CUSTOM"
                              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          ⭐ Special Deal
                        </button>
                      </div>
                    </div>

                    <div className="sm:col-span-6 space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        Discount Value / Offer Text:
                      </label>
                      <input
                        type="text"
                        value={offerForm.discountValue}
                        onChange={(e) => handleUpdateFormField("discountValue", e.target.value)}
                        placeholder="e.g. 15 or 50 or Free Payasam"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <p className="text-[10px] text-slate-400">
                        {offerForm.discountType === "PERCENT" && "Example: 15 (for 15% OFF)"}
                        {offerForm.discountType === "FLAT" && "Example: 50 (for ₹50 OFF)"}
                        {offerForm.discountType === "FREE" && "Example: Free Gulab Jamun on ₹300+ bills"}
                        {offerForm.discountType === "CUSTOM" && "Example: Combo Meals at just ₹120"}
                      </p>
                    </div>
                  </div>

                  {/* Field 3: Coupon Code & Validity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        3. Coupon / Promo Code:
                      </label>
                      <input
                        type="text"
                        value={offerForm.couponCode}
                        onChange={(e) => handleUpdateFormField("couponCode", e.target.value.toUpperCase())}
                        placeholder="e.g. BIRIYANI15 / HOTEL10"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-slate-900 font-mono tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        4. Validity / Timings (காலம்):
                      </label>
                      <input
                        type="text"
                        value={offerForm.validity}
                        onChange={(e) => handleUpdateFormField("validity", e.target.value)}
                        placeholder="e.g. இந்த சனி & ஞாயிறு மட்டும் (Sat & Sun)"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  {/* Field 4: Highlights / Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      5. Offer Notes / Highlights (கூடுதல் விவரங்கள்):
                    </label>
                    <input
                      type="text"
                      value={offerForm.notes}
                      onChange={(e) => handleUpdateFormField("notes", e.target.value)}
                      placeholder="e.g. அனைத்து வகையான பிரியாணிக்கும் பொருந்தும் / முதல் 50 பேருக்கு மட்டும்"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Field 5: Phone & Poster URL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        6. Contact / Booking Phone:
                      </label>
                      <input
                        type="tel"
                        value={offerForm.hotelPhone}
                        onChange={(e) => handleUpdateFormField("hotelPhone", e.target.value)}
                        placeholder="9876543210"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        7. Poster / Banner Image Link:
                      </label>
                      <input
                        type="url"
                        value={offerForm.posterUrl}
                        onChange={(e) => handleUpdateFormField("posterUrl", e.target.value)}
                        placeholder="https://example.com/poster.jpg"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  {/* Quick Poster Image Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Quick Images:</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateFormField(
                          "posterUrl",
                          "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80"
                        )
                      }
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg"
                    >
                      🍗 Biriyani
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateFormField(
                          "posterUrl",
                          "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80"
                        )
                      }
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg"
                    >
                      🍱 Meals
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateFormField(
                          "posterUrl",
                          "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80"
                        )
                      }
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg"
                    >
                      🍄 Kalan Dish
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateFormField("posterUrl", "")}
                      className="px-2 py-1 bg-slate-100 hover:bg-red-50 text-red-600 text-[10px] font-bold rounded-lg"
                    >
                      ❌ No Image
                    </button>
                  </div>
                </div>
              )}

              {/* MODE 2: RAW TEXT EDITOR */}
              {editorMode === "raw" && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Custom WhatsApp Message Text:
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      {broadcastMessage.length} chars
                    </span>
                  </div>

                  <textarea
                    rows={10}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Type customized offer message..."
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-sans leading-relaxed"
                  />

                  {/* Variable Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Insert:</span>
                    <button
                      type="button"
                      onClick={() => setBroadcastMessage((prev) => prev + " {customer_name}")}
                      className="px-2 py-1 bg-orange-100 hover:bg-orange-200 text-orange-800 text-[10px] font-bold rounded-lg"
                    >
                      + {"{customer_name}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBroadcastMessage((prev) => prev + " *Bold Text*")}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg"
                    >
                      + *Bold*
                    </button>
                    <button
                      type="button"
                      onClick={() => setBroadcastMessage((prev) => prev + " 🏷️ Coupon: ")}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg"
                    >
                      + 🏷️ Coupon
                    </button>
                    <button
                      type="button"
                      onClick={() => setBroadcastMessage((prev) => prev + " 📞 9876543210")}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg"
                    >
                      + 📞 Phone
                    </button>
                  </div>
                </div>
              )}

              {/* Test Phone Input & Single Test Sender */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2.5">
                <div className="relative flex-1 w-full">
                  <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={broadcastTestPhone}
                    onChange={(e) => setBroadcastTestPhone(e.target.value)}
                    placeholder="Enter test mobile number"
                    className="w-full pl-12 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendBroadcastTest}
                  disabled={isSendingBroadcastTest || !isConnected}
                  className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-40 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shrink-0 transition-all shadow-sm shadow-orange-500/20 active:scale-[0.98]"
                >
                  <Send className={`w-3.5 h-3.5 ${isSendingBroadcastTest ? "animate-spin" : ""}`} />
                  <span>{isSendingBroadcastTest ? "Testing..." : "🧪 Test Send"}</span>
                </button>
              </div>
            </div>

            {/* Right: Live WhatsApp Simulation Preview (5 cols) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-orange-500" />
                    <span>Live WhatsApp Screen</span>
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full">
                    Customer Screen
                  </span>
                </div>

                {/* WhatsApp Chat Screen Mockup */}
                <div className="mt-3 rounded-2xl border border-slate-300 bg-[#EFEAE2] p-3 shadow-inner max-w-sm mx-auto overflow-hidden">
                  {/* Chat Top Bar */}
                  <div className="bg-[#075E54] text-white p-2.5 rounded-t-xl -m-3 mb-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-200 text-emerald-950 font-black text-xs flex items-center justify-center">
                      JB
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">HOTEL JB</div>
                      <div className="text-[9px] text-emerald-200 leading-tight">Official Restaurant</div>
                    </div>
                  </div>

                  {/* Message Bubble */}
                  <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-xs space-y-2 border border-slate-200/60">
                    {/* Optional Image Banner */}
                    {posterUrl.trim() && (
                      <div className="rounded-xl overflow-hidden border border-slate-200 max-h-40 bg-slate-100">
                        <img
                          src={posterUrl.trim()}
                          alt="Offer Poster"
                          className="w-full h-36 object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}

                    {/* Formatted Text */}
                    <div className="text-[11px] text-slate-900 whitespace-pre-line leading-relaxed font-sans">
                      {broadcastMessage.replace(/\{customer_name\}/g, "சரவணன்")}
                    </div>

                    {/* Timestamp & double ticks */}
                    <div className="text-right text-[9px] text-slate-400 flex items-center justify-end gap-1 font-mono pt-1">
                      <span>12:45 PM</span>
                      <span className="text-blue-500 font-bold">✓✓</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1-Click Launch Button */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isBroadcasting || audience.length === 0 || !isConnected}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    {isBroadcasting
                      ? "Broadcasting to Customers..."
                      : `🚀 1-Click Broadcast (${audience.length} Customers)`}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Broadcast Live Progress / Result Banner */}
          {broadcastProgress && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  {broadcastProgress.done ? (
                    <CheckCircle2 className="w-5 h-5 text-orange-500" />
                  ) : (
                    <RefreshCw className="w-5 h-5 text-orange-500 animate-spin" />
                  )}
                  <span>
                    {broadcastProgress.done
                      ? "Offer Broadcast Complete! 🎉"
                      : "Sending WhatsApp Promotional Messages..."}
                  </span>
                </h4>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {broadcastProgress.sent + broadcastProgress.failed} / {broadcastProgress.total} processed
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                <div
                  className="bg-gradient-to-r from-orange-500 to-amber-500 h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      ((broadcastProgress.sent + broadcastProgress.failed) / broadcastProgress.total) * 100
                    )}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold pt-2">
                <div className="p-2.5 bg-orange-50 text-orange-900 rounded-xl border border-orange-200">
                  ✅ Sent: {broadcastProgress.sent}
                </div>
                <div className="p-2.5 bg-rose-50 text-rose-900 rounded-xl border border-rose-200">
                  ❌ Failed: {broadcastProgress.failed}
                </div>
                <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl border border-slate-200">
                  👥 Total: {broadcastProgress.total}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-scale-up space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-500 shrink-0">
                <Sparkles className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900">
                  Confirm Promotional Broadcast
                </h3>
                <p className="text-[11px] text-slate-500">
                  Send to {audience.length} previous customer WhatsApp numbers
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="font-semibold text-slate-900">
                🚀 Ready to dispatch offer to <b>{audience.length} unique customers</b>?
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pt-1 text-[11px]">
                <li>Each customer receives their personalized name replacement.</li>
                <li>Messages are spaced with a safe delay to prevent WhatsApp anti-spam flags.</li>
                <li>You can track the live progress in real-time.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 font-bold text-xs rounded-xl text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartBroadcast}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-black text-xs text-white rounded-xl shadow-md active:scale-[0.98] transition-all"
              >
                Yes, Launch Broadcast Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audience List Modal */}
      {showAudienceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Previous Customer Audience ({audience.length})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Extracted and deduplicated from registered bill transactions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAudienceModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto pr-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <th className="p-2.5">Customer Name</th>
                    <th className="p-2.5">Mobile Number</th>
                    <th className="p-2.5 text-center">Total Visits</th>
                    <th className="p-2.5 text-right">Last Visit Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {audience.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">
                        {c.name || "Customer"}
                      </td>
                      <td className="p-2.5 font-mono text-orange-600 font-bold">
                        +91 {c.phone}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-bold rounded-md">
                          {c.visitCount} visits
                        </span>
                      </td>
                      <td className="p-2.5 text-right text-slate-500 font-mono">
                        {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}

                  {audience.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400">
                        No previous customer bills recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAudienceModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
