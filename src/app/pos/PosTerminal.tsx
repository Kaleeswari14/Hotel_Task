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
  User,
  Phone,
  Coffee,
  CupSoda,
  Flame,
  LayoutGrid,
  ChefHat
} from "lucide-react";
import { formatCurrency, formatHumanStock } from "@/lib/format";
import ThermalReceipt from "@/components/ThermalReceipt";
import PaymentModal from "@/components/PaymentModal";
import { sendWhatsAppBillAndOffer } from "@/lib/whatsapp";
import { useLanguage } from "@/context/LanguageContext";

interface Portion {
  id: string;
  portionName: string;
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

// Category Icon Resolver
function getCategoryIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("drink") || n.includes("juice") || n.includes("tea") || n.includes("coffee") || n.includes("பான")) {
    return Coffee;
  }
  if (n.includes("biriyani") || n.includes("பிரியாணி") || n.includes("rice") || n.includes("சாதம்")) {
    return Flame;
  }
  if (n.includes("tiffin") || n.includes("idly") || n.includes("dosa") || n.includes("சிற்றுண்டி")) {
    return Utensils;
  }
  if (n.includes("dessert") || n.includes("sweet") || n.includes("snack") || n.includes("இனிப்பு")) {
    return CupSoda;
  }
  return UtensilsCrossed;
}

// Visual food graphic placeholder
function getFoodEmoji(name: string) {
  const n = name.toLowerCase();
  if (n.includes("tea") || n.includes("coffee")) return "☕";
  if (n.includes("juice") || n.includes("shake")) return "🧃";
  if (n.includes("biriyani") || n.includes("briyani")) return "🍲";
  if (n.includes("rice") || n.includes("meals")) return "🍛";
  if (n.includes("idly") || n.includes("dosa") || n.includes("roast")) return "🥞";
  if (n.includes("chicken") || n.includes("mutton") || n.includes("fish")) return "🍗";
  if (n.includes("ice cream") || n.includes("dessert")) return "🍨";
  return "🍽️";
}

export default function PosTerminal({
  categories,
  foods,
  userName,
  userRole,
}: PosTerminalProps) {
  const router = useRouter();
  const { language, setLanguage, isTamil, t, getFoodName, getCategoryName, getPortionName } = useLanguage();

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

  // Order Type & Reference State
  const [orderType, setOrderType] = useState<"TOKEN" | "TABLE" | "PARCEL">("TOKEN");
  const [tableNumber, setTableNumber] = useState("01");

  // Customer Info State (Optional for billing & WhatsApp receipt)
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Filtering State: Meal Sessions, Categories & Dietary Classification
  const [selectedMealSession, setSelectedMealSession] = useState<"ALL" | "MORNING" | "AFTERNOON" | "SNACKS" | "NIGHT">("ALL");
  const [selectedCatId, setSelectedCatId] = useState<string>("all");
  const [selectedDietary, setSelectedDietary] = useState<"ALL" | "VEG" | "NON_VEG" | "EGG">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Selected portion per food for cards with multiple portions
  const [selectedPortionMap, setSelectedPortionMap] = useState<Record<string, string>>({});

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

  // Add portion to cart
  const addToCart = (food: FoodItem, portion: Portion) => {
    // Check if food item is Out of Stock (0 quantity, skipped for NO_TRACKING)
    if (food.stockType !== "NO_TRACKING" && food.stock && food.stock.currentQuantity <= 0) {
      showToast(`🚫 "${getFoodName(food)}" is Out of Stock!`);
      return;
    }

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
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            foodItemId: food.id,
            foodName: food.name,
            foodNameTamil: food.nameTamil,
            portionId: portion.id,
            portionName: portion.portionName,
            unitMultiplier: portion.unitMultiplier,
            unitPrice: portion.price,
            quantity: 1,
          },
        ];
      }
    });
  };

  // Get total quantity of food currently in cart
  const getFoodCartQuantity = (foodId: string, portionId?: string) => {
    if (portionId) {
      const item = cart.find((c) => c.foodItemId === foodId && c.portionId === portionId);
      return item ? item.quantity : 0;
    }
    return cart.filter((c) => c.foodItemId === foodId).reduce((sum, c) => sum + c.quantity, 0);
  };

  // Decrement food quantity directly from card
  const handleCardDecrement = (food: FoodItem, portion: Portion) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.foodItemId === food.id && item.portionId === portion.id
      );
      if (existingIdx === -1) return prev;
      const currentQty = prev[existingIdx].quantity;
      if (currentQty <= 1) {
        return prev.filter((_, i) => i !== existingIdx);
      }
      return prev.map((item, idx) =>
        idx === existingIdx ? { ...item, quantity: item.quantity - 1 } : item
      );
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

  // Prepare bill items
  const prepareBillItems = () => {
    return cart.map((item) => ({
      foodItemId: item.foodItemId,
      foodName: item.foodName,
      foodNameTamil: item.foodNameTamil,
      portionId: item.portionId,
      portionName: item.portionName,
      unitMultiplier: item.unitMultiplier,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
    }));
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
          orderType: orderType === "TABLE" ? "TABLE" : "TOKEN",
          orderReference: orderType === "TABLE" ? `Table ${tableNumber}` : "Counter",
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
          orderType: orderType === "TABLE" ? "TABLE" : "TOKEN",
          orderReference: orderType === "TABLE" ? `Table ${tableNumber}` : "Counter",
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
  }, [cart, submitting, discountVal]);

  // Filtered Food Items
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
      (f.nameTamil && f.nameTamil.toLowerCase().includes(query)) ||
      f.category.name.toLowerCase().includes(query) ||
      (f.category.nameTamil && f.category.nameTamil.toLowerCase().includes(query));
    return matchesCategory && matchesMealSession && matchesDietary && matchesSearch;
  });

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#fafaf8] p-3 sm:p-5 flex gap-4 xl:gap-5 select-none">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-orange-500 text-sm font-bold animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. LEFT SLIM CATEGORY RAIL (Orange & White Vertical Sidebar) */}
      {/* ========================================================================= */}
      <aside className="w-20 sm:w-24 shrink-0 flex flex-col justify-between items-center bg-white rounded-3xl p-2.5 sm:p-3 border border-orange-100/90 shadow-sm">
        {/* Category Icons List */}
        <div className="w-full flex flex-col items-center gap-2.5 overflow-y-auto scrollbar-none py-1">
          {/* "All" Category Rail Item */}
          <button
            type="button"
            onClick={() => setSelectedCatId("all")}
            className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer ${
              selectedCatId === "all"
                ? "bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 text-white shadow-md shadow-orange-500/30 font-black scale-102"
                : "bg-orange-50/40 text-slate-600 hover:bg-orange-100/60 hover:text-orange-950 border border-orange-100/70"
            }`}
          >
            <LayoutGrid className="w-5 h-5 mb-1 shrink-0" />
            <span className="text-[10px] font-bold leading-tight line-clamp-1">
              {t("pos.allCategories")}
            </span>
          </button>

          {/* Dynamic Category Items */}
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.name);
            const isSelected = selectedCatId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCatId(cat.id)}
                className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 text-white shadow-md shadow-orange-500/30 font-black scale-102"
                    : "bg-orange-50/40 text-slate-600 hover:bg-orange-100/60 hover:text-orange-950 border border-orange-100/70"
                }`}
              >
                <Icon className="w-5 h-5 mb-1 shrink-0" />
                <span className="text-[10px] font-bold leading-tight line-clamp-1">
                  {getCategoryName(cat)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Rail Utility: Order Mode / Table Switcher */}
        <div className="w-full pt-2 border-t border-orange-100">
          <button
            type="button"
            onClick={() => setOrderType(orderType === "TOKEN" ? "TABLE" : "TOKEN")}
            className={`w-full p-2 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              orderType === "TABLE"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black shadow-sm"
                : "bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200/60"
            }`}
            title="Toggle Token / Table Mode"
          >
            <ChefHat className="w-4 h-4 mb-0.5" />
            <span className="text-[9px] font-black uppercase">
              {orderType === "TABLE" ? `T-${tableNumber}` : isTamil ? "டோக்கன்" : "Token"}
            </span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. CENTER MAIN HUB: Header, Orange Pills, Search & Product Cards Grid */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col min-w-0 space-y-3 sm:space-y-4">
        {/* Top Header & Orange Pills Navigation */}
        <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-orange-100/90 shadow-sm space-y-3">
          {/* Top Row: Brand, Search Bar, and Top Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Title & Brand Badge */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 via-orange-600 to-amber-400 flex items-center justify-center text-white font-black text-xs shadow-glow-orange">
                JB
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Hotel JB <span className="text-orange-500 font-mono text-sm uppercase">POS</span>
              </h1>
            </div>

            {/* Search Input Box */}
            <div className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 text-orange-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isTamil ? "உணவின் பெயர் அல்லது எண் தேடுங்கள்..." : "Search food items, codes or categories..."}
                className="w-full pl-10 pr-9 py-2 bg-[#fbfbfa] border border-orange-200/80 rounded-full text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-orange-200 text-orange-800 text-[10px] font-bold flex items-center justify-center cursor-pointer hover:bg-orange-300"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Top Right Utilities: Dietary & New Order / Clear */}
            <div className="flex items-center gap-2">
              {/* Dietary Filter Pills */}
              <div className="hidden sm:flex items-center bg-orange-50/50 p-1 rounded-full border border-orange-100">
                <button
                  type="button"
                  onClick={() => setSelectedDietary("ALL")}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    selectedDietary === "ALL"
                      ? "bg-slate-900 text-white shadow-xs font-black"
                      : "text-slate-600 hover:text-orange-950"
                  }`}
                >
                  {isTamil ? "அனைத்தும்" : "All"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDietary("VEG")}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    selectedDietary === "VEG"
                      ? "bg-emerald-600 text-white shadow-xs font-black"
                      : "text-emerald-800 hover:bg-emerald-50"
                  }`}
                >
                  🟢 {t("dietary.veg")}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDietary("NON_VEG")}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    selectedDietary === "NON_VEG"
                      ? "bg-rose-600 text-white shadow-xs font-black"
                      : "text-rose-800 hover:bg-rose-50"
                  }`}
                >
                  🔴 {t("dietary.nonVeg")}
                </button>
              </div>

              {/* "+ New Order" / Clear Button */}
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="px-3.5 py-2 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-full shadow-md shadow-orange-500/25 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>+ {isTamil ? "புதிய ஆர்டர்" : "New Order"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Secondary Filter: Orange Active Session Pills (All, Morning, Afternoon, Snacks, Night) */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
            <button
              type="button"
              onClick={() => setSelectedMealSession("ALL")}
              className={`px-4 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                selectedMealSession === "ALL"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/25"
                  : "bg-orange-50/60 text-slate-700 hover:bg-orange-100/80 border border-orange-100/60"
              }`}
            >
              🍽️ {t("pos.allSessions")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedMealSession("MORNING")}
              className={`px-4 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                selectedMealSession === "MORNING"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/25"
                  : "bg-orange-50/60 text-slate-700 hover:bg-orange-100/80 border border-orange-100/60"
              }`}
            >
              🌅 {t("pos.morning")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedMealSession("AFTERNOON")}
              className={`px-4 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                selectedMealSession === "AFTERNOON"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/25"
                  : "bg-orange-50/60 text-slate-700 hover:bg-orange-100/80 border border-orange-100/60"
              }`}
            >
              ☀️ {t("pos.afternoon")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedMealSession("SNACKS")}
              className={`px-4 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                selectedMealSession === "SNACKS"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/25"
                  : "bg-orange-50/60 text-slate-700 hover:bg-orange-100/80 border border-orange-100/60"
              }`}
            >
              ☕ {t("pos.snacks")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedMealSession("NIGHT")}
              className={`px-4 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                selectedMealSession === "NIGHT"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/25"
                  : "bg-orange-50/60 text-slate-700 hover:bg-orange-100/80 border border-orange-100/60"
              }`}
            >
              🌙 {t("pos.night")}
            </button>
          </div>
        </div>

        {/* Product / Dish Grid (Orange & White Floating Dish Style) */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredFoods.map((food) => {
              const isNoTracking = food.stockType === "NO_TRACKING";
              const isOut = !isNoTracking && food.stock ? food.stock.currentQuantity <= 0 : false;
              const diet = food.dietary || "VEG";

              // Determine active portion for multi-portion food
              const currentPortionId = selectedPortionMap[food.id] || food.portions[0]?.id;
              const activePortion = food.portions.find((p) => p.id === currentPortionId) || food.portions[0];
              const portionQty = activePortion ? getFoodCartQuantity(food.id, activePortion.id) : 0;

              return (
                <div
                  key={food.id}
                  className={`bg-white rounded-3xl p-4 border border-orange-100/80 shadow-sm hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-400 transition-all flex flex-col justify-between group ${
                    isOut ? "opacity-60 bg-slate-50" : ""
                  }`}
                >
                  {/* Card Top: Visual Food Graphic & Badges */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase text-orange-700 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200/60">
                        {getCategoryName(food.category)}
                      </span>
                      {diet === "NON_VEG" ? (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700">
                          🔴
                        </span>
                      ) : diet === "EGG" ? (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800">
                          🟡
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                          🟢
                        </span>
                      )}
                    </div>

                    {/* Food Graphic Center */}
                    <div className="w-20 h-20 mx-auto my-1 rounded-2xl bg-orange-50/50 border border-orange-100 flex items-center justify-center text-4xl shadow-inner group-hover:scale-105 transition-transform">
                      {getFoodEmoji(food.name)}
                    </div>

                    {/* Dish Title */}
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base text-center mt-2 leading-tight line-clamp-1 group-hover:text-orange-600 transition-colors">
                      {getFoodName(food)}
                    </h3>

                    {/* Portion Selector Pill if multiple portions exist */}
                    {food.portions.length > 1 && (
                      <div className="flex items-center justify-center gap-1 mt-2 flex-wrap">
                        {food.portions.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedPortionMap((prev) => ({ ...prev, [food.id]: p.id }))}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                              activePortion?.id === p.id
                                ? "bg-orange-600 text-white font-black shadow-xs"
                                : "bg-orange-50 text-orange-800 hover:bg-orange-100"
                            }`}
                          >
                            {getPortionName(p.portionName)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Price and Interactive Stepper */}
                  <div className="mt-4 pt-2.5 border-t border-orange-100 flex items-center justify-between gap-2">
                    {/* Price in Orange */}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">
                        {activePortion ? getPortionName(activePortion.portionName) : "Price"}
                      </span>
                      <span className="text-base font-black text-orange-600">
                        {formatCurrency(activePortion ? activePortion.price : 0)}
                      </span>
                    </div>

                    {/* Stepper Controls (- [Qty] +) */}
                    {isOut ? (
                      <span className="text-xs font-black text-rose-500 bg-rose-50 px-2.5 py-1 rounded-xl">
                        {isTamil ? "தீர்ந்தது" : "Out of Stock"}
                      </span>
                    ) : portionQty > 0 ? (
                      <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 p-0.5 rounded-xl text-white shadow-sm shadow-orange-500/25">
                        <button
                          type="button"
                          onClick={() => handleCardDecrement(food, activePortion)}
                          className="w-6 h-6 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center font-black text-xs cursor-pointer active:scale-95"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-black text-xs">
                          {portionQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => addToCart(food, activePortion)}
                          className="w-6 h-6 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center font-black text-xs cursor-pointer active:scale-95"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addToCart(food, activePortion)}
                        className="w-8 h-8 rounded-xl bg-orange-50 hover:bg-gradient-to-r hover:from-orange-500 hover:to-amber-500 text-orange-700 hover:text-white border border-orange-200/80 hover:border-orange-500 flex items-center justify-center font-black transition-all cursor-pointer shadow-xs active:scale-95"
                        title="Add to cart"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredFoods.length === 0 && (
              <div className="col-span-full bg-white rounded-3xl border border-orange-100 p-12 text-center text-slate-400">
                <UtensilsCrossed className="w-12 h-12 text-orange-300 mx-auto mb-2" />
                <div className="font-bold text-slate-600 text-sm">
                  {isTamil ? "உணவுகள் எதுவும் கிடைக்கவில்லை" : "No dishes found"}
                </div>
                <div className="text-xs mt-0.5">
                  {isTamil ? "வேறு பெயரில் தேடவும் அல்லது வகை மாற்றவும்." : "Try searching with another food name or selecting a different category."}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 3. RIGHT INVOICE & ORDER SUMMARY PANEL (Orange & White Style) */}
      {/* ========================================================================= */}
      <aside className="w-80 sm:w-96 shrink-0 bg-white rounded-3xl border border-orange-100/90 shadow-sm p-4 sm:p-5 flex flex-col justify-between h-[calc(100vh-6rem)] sticky top-20">
        <div>
          {/* Invoice Top Header */}
          <div className="flex items-center justify-between pb-3 border-b border-orange-100">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-900 text-sm sm:text-base">
                  {t("cart.currentOrder")}
                </span>
                <span className="text-[10px] font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200/60">
                  #{orderType === "TABLE" ? `Table ${tableNumber}` : "Token"}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {totalItemsCount} {isTamil ? "பொருட்கள்" : "Items"}
              </div>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-rose-500 hover:text-rose-700 font-bold p-1 transition-colors cursor-pointer"
                title={t("cart.clear")}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Customer Name & WhatsApp (Optional) */}
          <div className="py-2.5 border-b border-orange-100 grid grid-cols-2 gap-2">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={isTamil ? "பெயர்" : "Name"}
              className="w-full px-3 py-1.5 bg-[#fbfbfa] border border-orange-200/80 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            />
            <input
              type="tel"
              value={customerPhone}
              maxLength={10}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder={isTamil ? "வாட்ஸ்அப் எண்" : "WhatsApp No."}
              className="w-full px-3 py-1.5 bg-[#fbfbfa] border border-orange-200/80 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Cart Order Line Items List */}
          <div className="max-h-[38vh] overflow-y-auto space-y-2 py-2 pr-1">
            {cart.map((item, idx) => (
              <div
                key={`${item.foodItemId}-${item.portionId}`}
                className="p-2.5 bg-orange-50/40 rounded-2xl border border-orange-100/70 flex items-center justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-slate-900 text-xs truncate">
                    {getFoodName({ name: item.foodName, nameTamil: item.foodNameTamil })}
                  </div>
                  <div className="text-[10px] font-bold text-orange-700">
                    {getPortionName(item.portionName)} &bull; {formatCurrency(item.unitPrice)}
                  </div>
                </div>

                {/* Inline Stepper */}
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-orange-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => updateQuantity(idx, -1)}
                    className="w-5 h-5 rounded bg-orange-50 hover:bg-orange-100 text-orange-800 flex items-center justify-center font-bold text-[10px] cursor-pointer"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="w-5 text-center font-black text-xs text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(idx, 1)}
                    className="w-5 h-5 rounded bg-orange-50 hover:bg-orange-100 text-orange-800 flex items-center justify-center font-bold text-[10px] cursor-pointer"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>

                <div className="text-right font-black text-xs text-slate-900 w-14 shrink-0">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="py-10 text-center text-slate-400 flex flex-col items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-orange-200 mb-2" />
                <div className="font-bold text-xs text-slate-600">{t("cart.emptyTitle")}</div>
                <div className="text-[10px] text-slate-400">{t("cart.emptySubtitle")}</div>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Footer: Calculation & Action Buttons */}
        <div className="pt-3 border-t border-orange-100 space-y-3">
          {/* Subtotal, Discount & Grand Total */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-500 font-semibold">
              <span>{isTamil ? "மொத்தத் தொகை" : "Subtotal"}</span>
              <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between text-slate-500 font-semibold">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-orange-400" />
                <span>{t("cart.discount")}</span>
              </span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
                className="w-16 px-1.5 py-0.5 bg-[#fbfbfa] border border-orange-200 rounded text-right font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-orange-100">
              <span className="font-extrabold text-sm text-slate-900">{t("cart.totalPayable")}</span>
              <span className="font-black text-2xl text-orange-600">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* Action Buttons: Print Invoice (Outline) & Payments (Orange) */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => handleInstantPayAndPrint("CASH")}
              disabled={submitting || cart.length === 0}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-40 text-white font-black rounded-2xl shadow-lg shadow-orange-500/30 active:scale-98 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-200" />
              <span>{t("cart.cashAndPrint")}</span>
              <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded font-mono">↵</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAndPrintOrderSlip}
              disabled={submitting || cart.length === 0}
              className="w-full py-2.5 bg-white hover:bg-orange-50 text-slate-800 disabled:opacity-40 border border-orange-300 font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5 text-orange-600" />
              <span>{t("cart.orderSlip")} (KOT)</span>
              <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-mono">⇧↵</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Payment Modal */}
      {paymentBill && (
        <PaymentModal
          bill={paymentBill}
          onClose={() => setPaymentBill(null)}
          onPaymentSuccess={() => setPaymentBill(null)}
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
