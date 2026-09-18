"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Utensils,
  UtensilsCrossed,
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Layers,
  Percent,
  Tag,
  Zap,
  Banknote,
  QrCode,
  CreditCard,
  Printer,
  Check,
  Image as ImageIcon,
  User,
  Phone,
  Languages
} from "lucide-react";
import { formatCurrency, formatHumanStock } from "@/lib/format";
import ThermalReceipt from "@/components/ThermalReceipt";
import PaymentModal from "@/components/PaymentModal";
import { sendWhatsAppBillAndOffer } from "@/lib/whatsapp";
import { useLanguage } from "@/context/LanguageContext";


interface Portion {
  id: string;
  portionName: string;
  portionNameTamil?: string | null;
  unitMultiplier: number;
  price: number;
  packingCharge?: number;
}

interface FoodItem {
  id: string;
  name: string;
  nameTamil?: string | null;
  categoryId: string;
  description: string | null;
  imageUrl: string | null;
  dietary?: string;
  mealTime?: string;
  stockType?: "EXACT_COUNT" | "BATCH_ESTIMATE" | "NO_TRACKING" | string;
  category: { id: string; name: string; nameTamil?: string | null };
  portions: Portion[];
  stock: {
    currentQuantity: number;
    unitName: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
  nameTamil?: string | null;
}

interface CartItem {
  foodItemId: string;
  foodName: string;
  foodNameTamil?: string | null;
  portionId: string;
  portionName: string;
  portionNameTamil?: string | null;
  unitMultiplier: number;
  unitPrice: number;
  quantity: number;
}

interface PosTerminalProps {
  categories: Category[];
  foods: FoodItem[];
  userName: string;
  userRole: string;
}

function getCurrentSession(): "ALL" | "MORNING" | "AFTERNOON" | "SNACKS" | "NIGHT" {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 11.5) return "MORNING";
  if (hour >= 11.5 && hour < 16) return "AFTERNOON";
  if (hour >= 16 && hour < 19) return "SNACKS";
  return "NIGHT";
}

export default function PosTerminal({
  categories,
  foods,
  userName,
  userRole,
}: PosTerminalProps) {
  const router = useRouter();

  // Live Food List State with Automatic Real-Time Background Sync
  const [foodList, setFoodList] = useState<FoodItem[]>(foods);

  // Background Live Sync function
  const refreshFoods = async () => {
    try {
      const res = await fetch("/api/foods");
      if (res.ok) {
        const data = await res.json();
        setFoodList(data);
      }
    } catch (err) {
      // silent background fail
    }
  };

  // Real-Time Background Poller: syncs every 2.5s and on window focus
  React.useEffect(() => {
    const interval = setInterval(refreshFoods, 2500);
    window.addEventListener("focus", refreshFoods);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refreshFoods);
    };
  }, []);

  // Language state from global context
  const { language: lang, setLanguage: setLang, isTamil, t } = useLanguage();

  // Order Type & Reference State (Defaulted for direct fast counter billing)
  const [orderType] = useState<"TABLE" | "TOKEN" | "PARCEL">("TOKEN");
  const [orderReference] = useState("Counter");

  // Customer Info State (Optional for billing & WhatsApp thank you message)
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Filtering State: Meal Sessions, Categories & Dietary Classification
  const [selectedMealSession, setSelectedMealSession] = useState<"ALL" | "MORNING" | "AFTERNOON" | "SNACKS" | "NIGHT">("ALL");
  const [selectedCatId, setSelectedCatId] = useState<string>("all");
  const [selectedDietary, setSelectedDietary] = useState<"ALL" | "VEG" | "NON_VEG" | "EGG">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<string>("0");
  const [submitting, setSubmitting] = useState(false);

  // Success & Modal states
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [paymentBill, setPaymentBill] = useState<any | null>(null);
  const [receiptBill, setReceiptBill] = useState<any | null>(null);
  const [receiptInitialMode, setReceiptInitialMode] = useState<"ORDER_SLIP" | "PAYMENT_RECEIPT">("ORDER_SLIP");
  const [receiptAutoPrint, setReceiptAutoPrint] = useState(true);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Switch Language & update all existing items in cart
  const handleLangChange = (newLang: "ta" | "en") => {
    setLang(newLang);
  };

  // Automatically sync cart item names whenever global language changes
  React.useEffect(() => {
    setCart((prev) =>
      prev.map((item) => {
        const food = foodList.find((f) => f.id === item.foodItemId);
        const portion = food?.portions.find((p) => p.id === item.portionId);
        const newFoodName =
          lang === "ta"
            ? (food?.nameTamil || item.foodNameTamil || item.foodName)
            : (food?.name || item.foodName);
        const newPortionName =
          lang === "ta"
            ? (portion?.portionNameTamil || item.portionNameTamil || item.portionName)
            : (portion?.portionName || item.portionName);
        return {
          ...item,
          foodName: newFoodName,
          portionName: newPortionName,
        };
      })
    );
  }, [lang, foodList]);

  // Add portion to cart (Strictly pure Tamil in "ta" mode, strictly pure English in "en" mode)
  const addToCart = (food: FoodItem, portion: Portion) => {
    // Check if food item is Out of Stock (0 quantity, skipped for NO_TRACKING)
    if (food.stockType !== "NO_TRACKING" && food.stock && food.stock.currentQuantity <= 0) {
      showToast(
        lang === "ta"
          ? `🚫 "${food.nameTamil || food.name}" இருப்பு முடிந்துவிட்டது! சமையலறையில் புது Batch சேர்க்கவும்.`
          : `🚫 "${food.name}" is Out of Stock! Please prepare a new batch.`
      );
      return;
    }

    const displayName =
      lang === "ta"
        ? (food.nameTamil || food.name)
        : food.name;
    const displayPortion =
      lang === "ta"
        ? (portion.portionNameTamil || portion.portionName)
        : portion.portionName;

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.foodItemId === food.id && item.portionId === portion.id
      );

      if (existingIdx > -1) {
        return prev.map((item, idx) =>
          idx === existingIdx
            ? {
                ...item,
                quantity: item.quantity + 1,
                foodName: displayName,
                portionName: displayPortion,
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            foodItemId: food.id,
            foodName: displayName,
            foodNameTamil: food.nameTamil,
            portionId: portion.id,
            portionName: displayPortion,
            portionNameTamil: portion.portionNameTamil,
            unitMultiplier: portion.unitMultiplier,
            unitPrice: portion.price,
            quantity: 1,
          },
        ];
      }
    });
  };

  // Adjust cart item quantity
  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const currentItem = prev[index];
      if (!currentItem) return prev;
      const newQty = currentItem.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      return prev.map((item, i) =>
        i === index ? { ...item, quantity: newQty } : item
      );
    });
  };

  // Remove single line from cart
  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // Clear entire cart
  const clearCart = () => {
    setCart([]);
    setDiscount("0");
    setCustomerName("");
    setCustomerPhone("");
  };

  // Totals calculations
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountVal = Math.min(subtotal, Math.max(0, parseFloat(discount) || 0));
  const grandTotal = Math.max(0, subtotal - discountVal);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Prepare bill items strictly matching active language mode
  const prepareBillItems = () => {
    return cart.map((item) => {
      const food = foodList.find((f) => f.id === item.foodItemId);
      const portion = food?.portions.find((p) => p.id === item.portionId);
      const foodName =
        lang === "ta"
          ? (food?.nameTamil || item.foodNameTamil || item.foodName)
          : (food?.name || item.foodName);
      const portionName =
        lang === "ta"
          ? (portion?.portionNameTamil || item.portionNameTamil || item.portionName)
          : (portion?.portionName || item.portionName);
      return {
        foodItemId: item.foodItemId,
        foodName,
        portionId: item.portionId,
        portionName,
        unitMultiplier: item.unitMultiplier,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      };
    });
  };

  // 1. INSTANT PAY & AUTO-PRINT (1-CLICK / ENTER KEY CHECKOUT)
  const handleInstantPayAndPrint = async (method: "CASH" | "UPI" = "CASH") => {
    if (cart.length === 0) {
      alert("Please add at least one food item to the bill");
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: Create Bill
      const billRes = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType: "TOKEN",
          orderReference: "Counter",
          customerName: customerName.trim() || null,
          customerPhone: customerPhone.trim() || null,
          items: prepareBillItems(),
          discount: discountVal,
        }),
      });

      const bill = await billRes.json();
      if (!billRes.ok) throw new Error(bill.error || "Failed to create bill");

      // Step 2: Pay Bill Instantly
      const payRes = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billId: bill.id,
          amount: bill.totalAmount,
          paymentMethod: method,
          amountTendered: bill.totalAmount,
        }),
      });

      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.error || "Failed to record payment");

      showToast(`⚡ Bill #${bill.billNumber} PAID via ${method} (${formatCurrency(bill.totalAmount)})! Printing Receipt...`);
      
      const finalPaidBill = {
        ...payData.bill,
        customerName: payData.bill?.customerName || customerName.trim() || null,
        customerPhone: payData.bill?.customerPhone || customerPhone.trim() || null,
      };

      // Auto-send WhatsApp Bill & Special Offer if customer phone is provided
      if (finalPaidBill.customerPhone) {
        sendWhatsAppBillAndOffer(finalPaidBill);
      }

      setReceiptInitialMode("PAYMENT_RECEIPT");
      setReceiptAutoPrint(true);
      setReceiptBill(finalPaidBill);
      clearCart();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Create UNPAID Bill & Print Order Slip (KOT / Token Bill)
  const handleSaveAndPrintOrderSlip = async () => {
    if (cart.length === 0) {
      alert("Please add at least one food item to the bill");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType: "TOKEN",
          orderReference: "Counter",
          customerName: customerName.trim() || null,
          customerPhone: customerPhone.trim() || null,
          items: prepareBillItems(),
          discount: discountVal,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create bill");

      const finalOrderBill = {
        ...data,
        customerName: data.customerName || customerName.trim() || null,
        customerPhone: data.customerPhone || customerPhone.trim() || null,
      };

      setReceiptInitialMode("ORDER_SLIP");
      setReceiptAutoPrint(true);
      setReceiptBill(finalOrderBill);
      clearCart();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Create UNPAID Bill silently without printing
  const handleCreateUnpaidBill = async () => {
    if (cart.length === 0) {
      alert("Please add at least one food item to the bill");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType: "TOKEN",
          orderReference: "Counter",
          customerName: customerName.trim() || null,
          customerPhone: customerPhone.trim() || null,
          items: prepareBillItems(),
          discount: discountVal,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create bill");

      showToast(`✅ Bill #${data.billNumber} saved to UNPAID queue! Ready for next order.`);
      clearCart();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Open Detailed Payment Modal (For change calculation or split)
  const handleOpenDetailedPayment = async () => {
    if (cart.length === 0) {
      alert("Please add at least one food item to the bill");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType,
          orderReference: orderReference.trim(),
          customerName: customerName.trim() || null,
          customerPhone: customerPhone.trim() || null,
          items: prepareBillItems(),
          discount: discountVal,
        }),
      });

      const bill = await res.json();
      if (!res.ok) throw new Error(bill.error || "Failed to create bill");

      setPaymentBill(bill);
      clearCart();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // On payment success from modal
  const handlePaymentComplete = (updatedBill: any, payment: any) => {
    setPaymentBill(null);
    showToast(`🎉 Payment of ${formatCurrency(payment.amount)} confirmed for Bill #${updatedBill.billNumber}!`);
    
    // Auto-send WhatsApp Bill & Special Offer if customer phone is provided
    if (updatedBill?.customerPhone) {
      sendWhatsAppBillAndOffer(updatedBill);
    }

    setReceiptInitialMode("PAYMENT_RECEIPT");
    setReceiptAutoPrint(true);
    setReceiptBill(updatedBill);
  };

  // Keyboard Shortcuts: Enter = Instant Cash & Print; Shift+Enter = Order Slip
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) {
        return;
      }

      if (e.key === "Enter") {
        if (e.shiftKey) {
          e.preventDefault();
          if (cart.length > 0 && !submitting) {
            handleSaveAndPrintOrderSlip();
          }
        } else {
          e.preventDefault();
          if (cart.length > 0 && !submitting) {
            handleInstantPayAndPrint("CASH");
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, submitting, orderType, orderReference, discountVal]);

  // Filtered Food Items (Matches English & Tamil Names + Meal Timing Session + Dietary)
  const filteredFoods = foodList.filter((f) => {
    const matchesCategory = selectedCatId === "all" || f.categoryId === selectedCatId;
    const matchesMealSession =
      selectedMealSession === "ALL" ||
      !f.mealTime ||
      f.mealTime === "ALL" ||
      f.mealTime.includes(selectedMealSession);
    const matchesDietary =
      selectedDietary === "ALL" ||
      (f.dietary || "VEG") === selectedDietary;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      f.name.toLowerCase().includes(query) ||
      (Boolean(f.nameTamil) && f.nameTamil!.toLowerCase().includes(query)) ||
      f.category.name.toLowerCase().includes(query) ||
      (Boolean(f.category.nameTamil) && f.category.nameTamil!.toLowerCase().includes(query));
    return matchesCategory && matchesMealSession && matchesDietary && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto w-full p-2 sm:p-4 lg:p-6 space-y-4">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-emerald-500 text-sm font-bold animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Grid: Left = Food Catalog / Categories, Right = Live Order Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: Food Catalog (7 cols on lg, 8 on xl) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">

          {/* ========================================================================= */}
          {/* MEAL SESSION TIMING BAR (Morning / Afternoon / Evening / Night / All) */}
          {/* ========================================================================= */}
          <div className="bg-slate-900 text-white p-2.5 sm:p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full sm:w-auto">
              <span className="text-[11px] font-black uppercase text-emerald-400 mr-1 flex items-center gap-1 shrink-0">
                <Clock className="w-3.5 h-3.5" />
                <span>{lang === "ta" ? "நேரம்:" : "Session:"}</span>
              </span>

              <button
                type="button"
                onClick={() => setSelectedMealSession("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                  selectedMealSession === "ALL"
                    ? "bg-emerald-500 text-slate-950 shadow-sm"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                🍽️ {lang === "ta" ? "அனைத்து உணவுகள்" : "All Menu"}
              </button>

              <button
                type="button"
                onClick={() => setSelectedMealSession("MORNING")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1 ${
                  selectedMealSession === "MORNING"
                    ? "bg-amber-400 text-slate-950 shadow-sm"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span>🌅</span>
                <span>{lang === "ta" ? "காலை உணவு" : "Breakfast"}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMealSession("AFTERNOON")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1 ${
                  selectedMealSession === "AFTERNOON"
                    ? "bg-amber-400 text-slate-950 shadow-sm"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span>☀️</span>
                <span>{lang === "ta" ? "மதிய உணவு" : "Lunch"}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMealSession("SNACKS")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1 ${
                  selectedMealSession === "SNACKS"
                    ? "bg-amber-400 text-slate-950 shadow-sm"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span>☕</span>
                <span>{lang === "ta" ? "மாலை / டீ" : "Snacks & Tea"}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMealSession("NIGHT")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1 ${
                  selectedMealSession === "NIGHT"
                    ? "bg-amber-400 text-slate-950 shadow-sm"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span>🌙</span>
                <span>{lang === "ta" ? "இரவு உணவு" : "Dinner"}</span>
              </button>
            </div>

            <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-400 font-bold">
              <span>Current Time:</span>
              <span className="text-emerald-400 capitalize">{getCurrentSession().toLowerCase()}</span>
            </div>
          </div>

          {/* Instant Food Search & Dietary Filter Bar */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            {/* Full-Width Fast Food Search Box */}
            <div className="relative w-full">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === "ta"
                    ? "🔍 உணவு பெயரை தட்டச்சு செய்து உடனே தேடுக (எ.கா: இட்லி, தோசை, பிரியாணி, காபி)..."
                    : "🔍 Search any food item instantly (e.g., Dosa, Biriyani, Parotta, Coffee)..."
                }
                className="w-full pl-10 sm:pl-11 pr-9 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-300 focus:border-emerald-500 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 hover:text-slate-700 bg-slate-200 hover:bg-slate-300 w-5 h-5 rounded-full flex items-center justify-center transition-all"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dietary Type Filter Bar (Pure Veg / Non-Veg / Egg) */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto scrollbar-none">
              <span className="text-[11px] font-black uppercase text-slate-400 shrink-0">
                {lang === "ta" ? "வகை:" : "Diet:"}
              </span>
              <button
                type="button"
                onClick={() => setSelectedDietary("ALL")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedDietary === "ALL"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {lang === "ta" ? "அனைத்தும்" : "All Items"}
              </button>
              <button
                type="button"
                onClick={() => setSelectedDietary("VEG")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  selectedDietary === "VEG"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                <span>🟢</span>
                <span>{lang === "ta" ? "சைவம் (Pure Veg)" : "Pure Veg"}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedDietary("NON_VEG")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  selectedDietary === "NON_VEG"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100"
                }`}
              >
                <span>🔴</span>
                <span>{lang === "ta" ? "அசைவம் (Non-Veg)" : "Non-Veg"}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedDietary("EGG")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  selectedDietary === "EGG"
                    ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                    : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                }`}
              >
                <span>🟡</span>
                <span>{lang === "ta" ? "முட்டை (Egg)" : "Egg"}</span>
              </button>
            </div>
          </div>

          {/* Food Items Selection Grid (With Images & Tamil Names) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredFoods.map((food) => {
              const isNoTracking = food.stockType === "NO_TRACKING";
              const isOut = !isNoTracking && food.stock ? food.stock.currentQuantity <= 0 : false;
              const isLow = !isNoTracking && food.stock ? food.stock.currentQuantity > 0 && food.stock.currentQuantity <= 10 : false;
              const diet = food.dietary || "VEG";

              return (
              <div
                key={food.id}
                className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-all flex flex-col justify-between group ${
                  isOut
                    ? "border-red-200 opacity-80"
                    : isLow
                    ? "border-amber-300 hover:border-amber-500 hover:shadow-md"
                    : "border-slate-200 hover:border-emerald-400 hover:shadow-md"
                }`}
              >
                {/* Food Image Banner or Aesthetic Gradient Fallback */}
                <div className="h-28 w-full relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                  {food.imageUrl ? (
                    <img
                      src={food.imageUrl}
                      alt={food.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/80 p-3">
                      <UtensilsCrossed className="w-8 h-8 text-emerald-400 mb-1 opacity-80" />
                      <span className="text-xs font-bold text-slate-200">{food.name}</span>
                    </div>
                  )}

                  {/* Category & Dietary Badges */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className="text-[10px] font-black uppercase text-white bg-slate-900/85 backdrop-blur-xs px-2 py-0.5 rounded-md shadow-xs">
                      {lang === "ta" ? (food.category.nameTamil || food.category.name) : food.category.name}
                    </span>
                    {diet === "NON_VEG" ? (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-xs bg-rose-600 text-white backdrop-blur-xs">
                        🔴 Non-Veg
                      </span>
                    ) : diet === "EGG" ? (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-xs bg-amber-400 text-slate-950 backdrop-blur-xs">
                        🟡 Egg
                      </span>
                    ) : (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-xs bg-emerald-600 text-white backdrop-blur-xs">
                        🟢 Veg
                      </span>
                    )}
                  </div>

                  {isNoTracking ? (
                    <span className="absolute bottom-2 right-2 text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs bg-sky-700/90 text-white backdrop-blur-xs">
                      {lang === "ta" ? "♾️ அன்லிமிடெட்" : "♾️ Unlimited"}
                    </span>
                  ) : food.stock ? (
                    <span className={`absolute bottom-2 right-2 text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs ${
                      isOut
                        ? "bg-red-600 text-white"
                        : isLow
                        ? "bg-amber-400 text-slate-950 font-black"
                        : "bg-white/95 text-slate-900"
                    }`}>
                      {isOut
                        ? (lang === "ta" ? "🚫 இருப்பு இல்லை (0)" : "🚫 Out of Stock (0)")
                        : isLow
                        ? `⚠️ ${formatHumanStock(food.stock.currentQuantity, food.stock.unitName)} (Low)`
                        : `Stock: ${formatHumanStock(food.stock.currentQuantity, food.stock.unitName)}`}
                    </span>
                  ) : null}
                </div>

                {/* Content */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm leading-snug">
                      {lang === "ta" ? (food.nameTamil || food.name) : food.name}
                    </h3>
                  </div>

                  {/* Portion Action Buttons (1-click add to cart) */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {lang === "ta" ? "அளவு / போஷன் தேர்வு:" : "Select Portion to Add:"}
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {food.portions.map((portion) => (
                        <button
                          key={portion.id}
                          type="button"
                          onClick={() => addToCart(food, portion)}
                          disabled={isOut}
                          className={`w-full flex items-center justify-between px-3 py-1.5 font-bold rounded-xl border transition-all active:scale-[0.98] group/btn ${
                            isOut
                              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
                              : "bg-emerald-50/70 hover:bg-emerald-600 hover:text-white text-emerald-950 border-emerald-200/80 hover:border-emerald-600"
                          }`}
                        >
                          <span className="text-xs">
                            {lang === "ta" ? (portion.portionNameTamil || portion.portionName) : portion.portionName}
                            {isOut && <span className="ml-1 text-[10px] text-red-500 font-extrabold">({lang === "ta" ? "முடிந்தது" : "Out"})</span>}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black">{formatCurrency(portion.price)}</span>
                            {!isOut && <Plus className="w-3.5 h-3.5 opacity-70 group-hover/btn:opacity-100" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              );
            })}

            {foodList.length === 0 ? (
              <div className="col-span-full bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-500 space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                  <Utensils className="w-8 h-8" />
                </div>
                <div>
                  <div className="font-black text-slate-900 text-lg">
                    {lang === "ta" ? "உணவுகள் இன்னும் சேர்க்கப்படவில்லை" : "No Dishes Added Yet"}
                  </div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    {lang === "ta"
                      ? "உரிமையாளர் மெனு மேலாளருக்குச் சென்று புதிய உணவுகள் மற்றும் வகைகளை சேர்க்கலாம்."
                      : "Owner can go to the Menu Manager to add new categories and dishes to start billing."}
                  </p>
                </div>
                <a
                  href="/owner/menu"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-700/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === "ta" ? "உணவுகளை சேர்க்க (Go to Menu Manager)" : "Go to Menu Manager"}</span>
                </a>
              </div>
            ) : filteredFoods.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <div className="font-bold text-slate-600 text-sm">
                  {lang === "ta" ? "உணவுகள் எதுவும் கிடைக்கவில்லை" : "No dishes found"}
                </div>
                <div className="text-xs mt-0.5">
                  {lang === "ta" ? "வேறு பெயரை தட்டச்சு செய்து பார்க்கவும்" : "Try searching with another name."}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Order Cart & Bill Generator (5 cols on lg, 4 on xl) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl sticky top-20 flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
            {/* Cart Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="font-extrabold text-sm sm:text-base leading-none">{lang === "ta" ? "தேர்ந்தெடுத்த பில் பட்டியல்" : "Current Bill Cart"}</div>
                  <div className="text-[11px] text-emerald-300 font-semibold mt-0.5">
                    {totalItemsCount} {lang === "ta" ? "உணவு பொருட்கள்" : "Items in Cart"}
                  </div>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-red-300 hover:text-red-100 bg-red-900/40 hover:bg-red-900/60 px-2.5 py-1 rounded-lg border border-red-500/30 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{lang === "ta" ? "அழி" : "Clear"}</span>
                </button>
              )}
            </div>

            {/* Customer Information (Optional - Name & Phone for WhatsApp Bill & Offers) */}
            <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-200 grid grid-cols-2 gap-2 shrink-0">
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && cart.length > 0 && !submitting) {
                      e.preventDefault();
                      handleInstantPayAndPrint("CASH");
                    }
                  }}
                  placeholder={lang === "ta" ? "வாடிக்கையாளர் பெயர்" : "Customer Name"}
                  className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 placeholder:text-slate-400"
                />
              </div>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && cart.length > 0 && !submitting) {
                      e.preventDefault();
                      handleInstantPayAndPrint("CASH");
                    }
                  }}
                  placeholder={lang === "ta" ? "WhatsApp எண் (Enter ↵)" : "WhatsApp Number (Enter ↵)"}
                  maxLength={10}
                  className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Cart Items List (Scrollable - Maximized Height & High Visibility) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cart.map((item, idx) => (
                <div
                  key={`${item.foodItemId}-${item.portionId}`}
                  className="bg-slate-50 hover:bg-slate-100/80 p-2.5 rounded-xl border border-slate-200 transition-all shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-slate-900 text-sm leading-tight">
                        {item.foodName}
                      </div>
                      <div className="text-xs font-bold text-emerald-700 mt-0.5">
                        {item.portionName} &bull; {formatCurrency(item.unitPrice)}
                      </div>
                    </div>

                    <div className="text-right font-black text-slate-900 text-sm shrink-0">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </div>
                  </div>

                  {/* Quantity Stepper & Quick Remove */}
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/60">
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-300 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => updateQuantity(idx, -1)}
                        className="w-6 h-6 rounded bg-slate-100 text-slate-800 hover:bg-slate-200 flex items-center justify-center font-black text-xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center font-black text-xs text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(idx, 1)}
                        className="w-6 h-6 rounded bg-slate-100 text-slate-800 hover:bg-slate-200 flex items-center justify-center font-black text-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(idx)}
                      className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <UtensilsCrossed className="w-10 h-10 text-slate-300 mb-2" />
                  <div className="font-bold text-slate-700 text-sm">{lang === "ta" ? "கூடை காலியாக உள்ளது" : "Cart is empty"}</div>
                  <div className="text-xs text-slate-400 mt-0.5 max-w-[200px]">
                    {lang === "ta" ? "இடப்பக்கத்தில் உள்ள உணவை கிளிக் செய்து சேர்க்கவும்." : "Click any food item on the left to add it to this bill."}
                  </div>
                </div>
              )}
            </div>

            {/* Cart Footer: Compact Summary & Sleek 2-Button Action Bar */}
            <div className="p-3 bg-white border-t border-slate-200 shrink-0 space-y-2.5">
              {/* Discount & Totals Row */}
              <div className="flex items-center justify-between text-xs gap-2 pb-1 border-b border-slate-100">
                <div className="flex items-center gap-1 text-slate-600 font-semibold">
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span>{lang === "ta" ? "தள்ளுபடி:" : "Discount:"}</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && cart.length > 0 && !submitting) {
                        e.preventDefault();
                        handleInstantPayAndPrint("CASH");
                      }
                    }}
                    placeholder="0"
                    className="w-14 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-center font-bold text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">{lang === "ta" ? `மொத்தம் (${totalItemsCount}):` : `Total (${totalItemsCount}):`}</span>
                  <span className="text-base font-black text-emerald-700">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

              {/* ONLY 2 COMPACT ACTION BUTTONS: Instant Cash & Order Slip */}
              <div className="grid grid-cols-2 gap-2">
                {/* 1. Instant Cash & Print (Primary / Enter) */}
                <button
                  type="button"
                  onClick={() => handleInstantPayAndPrint("CASH")}
                  disabled={submitting || cart.length === 0}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xs active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 text-xs sm:text-sm border border-emerald-500"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>{lang === "ta" ? "ரொக்கம் & பில்" : "Cash & Print"}</span>
                  <span className="text-[10px] bg-emerald-900/70 px-1 py-0.2 rounded font-mono font-bold">↵</span>
                </button>

                {/* 2. Instant Order Slip (KOT / Shift+Enter) */}
                <button
                  type="button"
                  onClick={handleSaveAndPrintOrderSlip}
                  disabled={submitting || cart.length === 0}
                  className="py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-xs active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 text-xs sm:text-sm border border-amber-400"
                >
                  <Receipt className="w-3.5 h-3.5 text-slate-950" />
                  <span>{lang === "ta" ? "ஆர்டர் சீட்டு (KOT)" : "Order Slip"}</span>
                  <span className="text-[10px] bg-amber-700/30 px-1 py-0.2 rounded font-mono font-bold">⇧↵</span>
                </button>
              </div>

              <div className="text-center text-[10px] text-slate-400 font-medium">
                ⌨️ <kbd className="px-1 py-0.2 bg-slate-100 border border-slate-200 text-slate-700 rounded font-mono font-bold">ENTER</kbd> = {lang === "ta" ? "ரொக்க பில்" : "Cash Bill"} &bull; <kbd className="px-1 py-0.2 bg-slate-100 border border-slate-200 text-slate-700 rounded font-mono font-bold">Shift+ENTER</kbd> = {lang === "ta" ? "ஆர்டர் சீட்டு" : "Order Slip"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {paymentBill && (
        <PaymentModal
          bill={paymentBill}
          onClose={() => setPaymentBill(null)}
          onPaymentSuccess={handlePaymentComplete}
        />
      )}

      {/* Thermal Receipt Modal */}
      {receiptBill && (
        <ThermalReceipt
          bill={receiptBill}
          initialMode={receiptInitialMode}
          autoPrint={receiptAutoPrint}
          isReprint={false}
          onClose={() => setReceiptBill(null)}
        />
      )}
    </div>
  );
}
