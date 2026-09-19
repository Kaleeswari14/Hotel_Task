"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  ChefHat,
  Bell,
  Settings,
  LogOut,
  Edit2,
  X,
  ChevronRight,
  Boxes,
  FileText,
  BarChart3
} from "lucide-react";
import { formatCurrency, formatHumanStock } from "@/lib/format";
import { getFoodImage } from "@/lib/foodImages";
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
  imageUrl?: string | null;
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
  imageUrl?: string | null;
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
  foods: initialFoods,
  userName,
  userRole,
}: PosTerminalProps) {
  const router = useRouter();
  const { isTamil, setLanguage, t, getFoodName, getPortionName, getCategoryName } = useLanguage();

  const [foodList, setFoodList] = useState<FoodItem[]>(initialFoods);
  const [selectedCatId, setSelectedCatId] = useState<string>("all");
  const [selectedMealSession, setSelectedMealSession] = useState<string>("ALL");
  const [selectedDietary, setSelectedDietary] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Cart & Order State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<"TOKEN" | "TABLE">("TABLE");
  const [tableNumber, setTableNumber] = useState<string>("12");
  const [orderId, setOrderId] = useState<string>("5266");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discount, setDiscount] = useState<string>("");

  // Portion selection map per food item
  const [selectedPortionMap, setSelectedPortionMap] = useState<Record<string, string>>({});

  // Payment & Thermal Receipt Modals
  const [submitting, setSubmitting] = useState(false);
  const [paymentBill, setPaymentBill] = useState<any | null>(null);
  const [receiptBill, setReceiptBill] = useState<any | null>(null);
  const [receiptInitialMode, setReceiptInitialMode] = useState<"ORDER_SLIP" | "PAYMENT_RECEIPT">("PAYMENT_RECEIPT");
  const [receiptAutoPrint, setReceiptAutoPrint] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Helper to count quantity of a food portion in cart
  const getFoodCartQuantity = (foodId: string, portionId: string) => {
    const item = cart.find((c) => c.foodItemId === foodId && c.portionId === portionId);
    return item ? item.quantity : 0;
  };

  // Get total count of any portion of a food item in cart
  const getFoodTotalQuantity = (foodId: string) => {
    return cart
      .filter((c) => c.foodItemId === foodId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  // Add to cart with portion
  const addToCart = (food: FoodItem, portion?: Portion) => {
    const p = portion || food.portions[0];
    if (!p) return;

    // Check stock if exact tracking enabled
    if (food.stockType === "EXACT_COUNT" && food.stock) {
      const inCart = getFoodCartQuantity(food.id, p.id);
      if (inCart + 1 > food.stock.currentQuantity) {
        showToast(`Stock limit reached for ${getFoodName(food)}`);
        return;
      }
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (c) => c.foodItemId === food.id && c.portionId === p.id
      );
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].quantity += 1;
        return copy;
      }
      return [
        ...prev,
        {
          foodItemId: food.id,
          foodName: food.name,
          foodNameTamil: food.nameTamil,
          portionId: p.id,
          portionName: p.portionName,
          unitMultiplier: p.unitMultiplier,
          unitPrice: p.price,
          quantity: 1,
          imageUrl: food.imageUrl,
        },
      ];
    });
  };

  // Decrement or remove from cart
  const handleCardDecrement = (food: FoodItem, portion?: Portion) => {
    const p = portion || food.portions[0];
    if (!p) return;

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (c) => c.foodItemId === food.id && c.portionId === p.id
      );
      if (existingIdx === -1) return prev;
      const copy = [...prev];
      if (copy[existingIdx].quantity > 1) {
        copy[existingIdx].quantity -= 1;
        return copy;
      } else {
        return copy.filter((_, idx) => idx !== existingIdx);
      }
    });
  };

  // Update item quantity directly by cart index
  const updateQuantity = (idx: number, delta: number) => {
    setCart((prev) => {
      const copy = [...prev];
      const item = copy[idx];
      if (!item) return prev;
      const nextQty = item.quantity + delta;
      if (nextQty <= 0) {
        return copy.filter((_, i) => i !== idx);
      }
      item.quantity = nextQty;
      return copy;
    });
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setDiscount("");
    setOrderId(String(Math.floor(1000 + Math.random() * 9000)));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountVal = parseFloat(discount) || 0;
  const grandTotal = Math.max(0, subtotal - discountVal);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Fast Instant Cash & Print
  const handleInstantPayAndPrint = async (paymentMethod: "CASH" | "UPI" = "CASH") => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const orderRef = orderType === "TABLE" ? `Table ${tableNumber}` : "Token";
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderReference: orderRef,
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          discount: discountVal,
          paidAmount: grandTotal,
          paymentMethod: paymentMethod,
          items: cart.map((c) => ({
            foodItemId: c.foodItemId,
            portionId: c.portionId,
            quantity: c.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create bill");

      const finalBill = {
        ...data,
        customerName: data.customerName || customerName.trim() || null,
        customerPhone: data.customerPhone || customerPhone.trim() || null,
      };

      // WhatsApp bill delivery if phone provided
      if (customerPhone.trim().length === 10) {
        sendWhatsAppBillAndOffer({
          id: data.id,
          billNumber: data.billNumber || 1,
          orderReference: orderRef,
          orderType: orderType,
          customerName: customerName.trim() || "Valued Customer",
          customerPhone: customerPhone.trim(),
          createdAt: new Date(),
          items: cart.map((c) => ({
            foodName: c.foodName,
            portionName: c.portionName,
            quantity: c.quantity,
            subtotal: c.unitPrice * c.quantity,
          })),
          subtotal: subtotal,
          discount: discountVal,
          totalAmount: grandTotal,
          paidAmount: grandTotal,
          status: "PAID",
        }).catch((e) => console.error("WhatsApp delivery error:", e));
      }

      setReceiptInitialMode("PAYMENT_RECEIPT");
      setReceiptAutoPrint(true);
      setReceiptBill(finalBill);
      clearCart();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Order Slip (KOT)
  const handleSaveAndPrintOrderSlip = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const orderRef = orderType === "TABLE" ? `Table ${tableNumber}` : "Token";
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderReference: orderRef,
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          discount: discountVal,
          items: cart.map((c) => ({
            foodItemId: c.foodItemId,
            portionId: c.portionId,
            quantity: c.quantity,
          })),
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
    <div className="w-full min-h-screen bg-[#faf5f2] text-slate-800 flex overflow-x-hidden font-sans select-none">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-[#ff5722] text-sm font-bold animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-[#ff5722] shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. LEFT SLIM NAVIGATION RAIL (Dark Chef Icon, Coral Tab, Tools) */}
      {/* ========================================================================= */}
      <aside className="w-16 sm:w-20 shrink-0 bg-transparent flex flex-col items-center justify-between py-5 px-2">
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Chef Hat Brand Pill in Black */}
          <Link
            href="/owner/dashboard"
            className="w-12 h-12 rounded-full bg-slate-950 text-white flex items-center justify-center shadow-md hover:scale-105 transition-transform cursor-pointer"
            title="Hotel JB &bull; Dashboard"
          >
            <ChefHat className="w-6 h-6 text-white" />
          </Link>

          {/* Active POS Icon (Orange Coral Square) */}
          <button
            type="button"
            className="w-11 h-11 rounded-2xl bg-[#ff5722] text-white flex items-center justify-center shadow-lg shadow-orange-500/30 cursor-pointer"
            title="POS Terminal (Active)"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>

          {/* Orders / Bills Queue */}
          <Link
            href="/bills"
            className="w-11 h-11 rounded-2xl bg-white text-slate-600 hover:text-[#ff5722] hover:bg-orange-50/80 border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            title="Bills & Orders Queue"
          >
            <Receipt className="w-5 h-5" />
          </Link>

          {/* Stock / Inventory */}
          <Link
            href="/owner/stock"
            className="w-11 h-11 rounded-2xl bg-white text-slate-600 hover:text-[#ff5722] hover:bg-orange-50/80 border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            title="Stock & Inventory"
          >
            <Boxes className="w-5 h-5" />
          </Link>

          {/* Day Closing / Reports */}
          <Link
            href="/owner/day-closing"
            className="w-11 h-11 rounded-2xl bg-white text-slate-600 hover:text-[#ff5722] hover:bg-orange-50/80 border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            title="Day Closing & Financial Ledger"
          >
            <FileText className="w-5 h-5" />
          </Link>

          {/* Dashboard KPI */}
          <Link
            href="/owner/dashboard"
            className="w-11 h-11 rounded-2xl bg-white text-slate-600 hover:text-[#ff5722] hover:bg-orange-50/80 border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            title="Analytics & Dashboard"
          >
            <BarChart3 className="w-5 h-5" />
          </Link>
        </div>

        {/* Bottom Rail: Table / Token Quick Switcher */}
        <div className="flex flex-col items-center gap-2 w-full">
          <button
            type="button"
            onClick={() => setOrderType(orderType === "TOKEN" ? "TABLE" : "TOKEN")}
            className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
              orderType === "TABLE"
                ? "bg-gradient-to-br from-amber-500 to-[#ff5722] text-white border-transparent shadow-sm font-black text-[10px]"
                : "bg-white text-slate-700 border-slate-200 hover:bg-orange-50 font-black text-[10px]"
            }`}
            title="Toggle Token / Table Mode"
          >
            <span className="text-[10px] uppercase">
              {orderType === "TABLE" ? `T-${tableNumber}` : isTamil ? "டோக்" : "TOK"}
            </span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. CENTER & TOP AREA: Header, Order Tabs, Categories & Food Cards Grid */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 p-3 sm:p-5 pl-0 pr-4 space-y-4">
        {/* TOP HEADER: Search Bar & User / Utility Actions */}
        <header className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Search Input Box */}
          <div className="flex-1 max-w-xl relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isTamil ? "உணவின் பெயர் அல்லது குறியீடு தேடுங்கள்..." : "Search products..."}
              className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200/80 rounded-full text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ff5722]/20 focus:border-[#ff5722] transition-all placeholder:text-slate-400 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center cursor-pointer hover:bg-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Top Right Utilities: Notifications, Settings, Logout, User Profile */}
          <div className="flex items-center gap-2.5">
            {/* Notification Bell */}
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-[#ff5722] absolute top-2 right-2 ring-2 ring-white"></span>
            </button>

            {/* Settings */}
            <Link
              href="/owner/dashboard"
              className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              title="Settings & Admin"
            >
              <Settings className="w-4 h-4" />
            </Link>

            {/* Language Switcher Pill (EN ↔ தமிழ்) */}
            <button
              type="button"
              onClick={() => setLanguage(isTamil ? "en" : "ta")}
              className="h-10 px-3 rounded-full bg-white border border-slate-200 flex items-center gap-1.5 text-xs font-black text-slate-800 hover:border-[#ff5722] hover:text-[#ff5722] shadow-2xs transition-all cursor-pointer"
              title="Toggle English / தமிழ்"
            >
              <span>{isTamil ? "🇮🇳 தமிழ்" : "🇬🇧 English"}</span>
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2.5 bg-white border border-slate-200/80 rounded-full py-1.5 px-3 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#ff5722] to-amber-400 flex items-center justify-center text-white font-extrabold text-xs shadow-inner">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col text-left pr-1">
                <span className="text-xs font-black text-slate-900 leading-tight">
                  {userName}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 capitalize">
                  {userRole.toLowerCase() === "owner" ? "Manager" : "Cashier"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* SUB-HEADER: Active Order Tabs & Big "+ New Order" Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Order Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            {/* Active Order Pill in soft peach/blush */}
            <div className="bg-[#ffe8e0] text-[#ff5722] border border-[#ffd3c4] font-black rounded-2xl px-4 py-2 flex items-center gap-2 text-xs shadow-2xs">
              <span>{isTamil ? "ஆர்டர்" : "Order"} #{orderId}</span>
              <button
                type="button"
                onClick={clearCart}
                className="w-4 h-4 rounded-full bg-[#ff5722]/15 text-[#ff5722] hover:bg-[#ff5722] hover:text-white flex items-center justify-center text-[10px] font-bold cursor-pointer transition-colors"
                title="Clear order"
              >
                ✕
              </button>
            </div>

            {/* Quick Table Selector if in Table mode */}
            {orderType === "TABLE" && (
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl px-2 py-1 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 pl-1">
                  {isTamil ? "டேபிள்:" : "Table:"}
                </span>
                <select
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="bg-transparent font-black text-xs text-slate-900 focus:outline-none cursor-pointer pr-1"
                >
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={String(n)}>
                      Table {n}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* "+ New Order" Orange Action Button */}
          <button
            type="button"
            onClick={clearCart}
            className="bg-[#ff5722] hover:bg-[#f4511e] text-white px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-orange-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ {isTamil ? "புதிய ஆர்டர்" : "New Order"}</span>
          </button>
        </div>

        {/* HORIZONTAL CATEGORY PILLS BAR */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          {/* "All Menu" Pill */}
          <button
            type="button"
            onClick={() => setSelectedCatId("all")}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              selectedCatId === "all"
                ? "border-2 border-[#ff5722] text-[#ff5722] bg-white shadow-xs"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-2xs"
            }`}
          >
            {isTamil ? "அனைத்து உணவுகள்" : "All Menu"}
          </button>

          {/* Dynamic DB Categories */}
          {categories.map((cat) => {
            const isSelected = selectedCatId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCatId(cat.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "border-2 border-[#ff5722] text-[#ff5722] bg-white shadow-xs"
                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-2xs"
                }`}
              >
                {getCategoryName(cat)}
              </button>
            );
          })}

          {/* Dietary Filter Pills */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-300/80">
            <button
              type="button"
              onClick={() => setSelectedDietary(selectedDietary === "VEG" ? "ALL" : "VEG")}
              className={`px-3 py-1.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                selectedDietary === "VEG"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-emerald-800 border border-emerald-200 shadow-2xs"
              }`}
            >
              🟢 {t("dietary.veg")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedDietary(selectedDietary === "NON_VEG" ? "ALL" : "NON_VEG")}
              className={`px-3 py-1.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                selectedDietary === "NON_VEG"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-white text-rose-800 border border-rose-200 shadow-2xs"
              }`}
            >
              🔴 {t("dietary.nonVeg")}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. FOOD DISH CARDS GRID (Realistic Photography, Bold Price, +Add Button) */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredFoods.map((food) => {
              const isNoTracking = food.stockType === "NO_TRACKING";
              const isOut = !isNoTracking && food.stock ? food.stock.currentQuantity <= 0 : false;
              const foodImg = getFoodImage(food);

              // Active Portion
              const currentPortionId = selectedPortionMap[food.id] || food.portions[0]?.id;
              const activePortion = food.portions.find((p) => p.id === currentPortionId) || food.portions[0];
              const portionQty = activePortion ? getFoodCartQuantity(food.id, activePortion.id) : 0;

              return (
                <div
                  key={food.id}
                  className={`bg-white rounded-3xl p-3.5 sm:p-4 shadow-sm border border-slate-100/90 hover:shadow-xl hover:shadow-orange-500/10 hover:border-[#ff5722]/40 transition-all flex flex-col justify-between group ${
                    isOut ? "opacity-60 bg-slate-50" : ""
                  }`}
                >
                  <div>
                    {/* Food Photo Top */}
                    <div className="relative rounded-2xl h-36 sm:h-40 w-full overflow-hidden bg-slate-100 shadow-inner">
                      <img
                        src={foodImg}
                        alt={food.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />

                      {/* Category / Dietary Badge on Top of Image */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase text-slate-900 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-lg shadow-2xs">
                          {getCategoryName(food.category)}
                        </span>
                      </div>

                      {/* Stock Indicator if exact tracking */}
                      {isOut && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center text-white font-black text-xs uppercase tracking-wider">
                          {isTamil ? "தீர்ந்தது (Out of Stock)" : "Out of Stock"}
                        </div>
                      )}
                    </div>

                    {/* Dish Title */}
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base line-clamp-1 mt-3 group-hover:text-[#ff5722] transition-colors">
                      {getFoodName(food)}
                    </h3>

                    {/* Food Description */}
                    <p className="text-xs text-slate-400 font-medium line-clamp-2 mt-1 min-h-[32px]">
                      {food.description || (isTamil ? "சுவையான புதிய உணவு தயார் நிலையில் உள்ளது." : "Freshly prepared delicious meal made with high quality ingredients.")}
                    </p>

                    {/* Portion Selector Buttons if multi-portion */}
                    {food.portions.length > 1 && (
                      <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                        {food.portions.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedPortionMap((prev) => ({ ...prev, [food.id]: p.id }))}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${
                              activePortion?.id === p.id
                                ? "bg-slate-900 text-white shadow-2xs font-black"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            {getPortionName(p.portionName)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Price and Add / Stepper Controls */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* Price in Bold */}
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 text-base sm:text-lg">
                        {formatCurrency(activePortion ? activePortion.price : 0)}
                      </span>
                    </div>

                    {/* Action Controls: + Add Button OR - [Qty] + Stepper */}
                    {isOut ? (
                      <span className="text-xs font-black text-rose-500 bg-rose-50 px-3 py-1 rounded-xl">
                        {isTamil ? "தீர்ந்தது" : "Sold Out"}
                      </span>
                    ) : portionQty > 0 ? (
                      <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1.5 border border-slate-200/80 shadow-inner">
                        <button
                          type="button"
                          onClick={() => handleCardDecrement(food, activePortion)}
                          className="w-6 h-6 rounded-xl bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center font-black text-xs cursor-pointer shadow-2xs active:scale-90 transition-transform"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-black text-xs text-slate-900">
                          {portionQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => addToCart(food, activePortion)}
                          className="w-6 h-6 rounded-xl bg-slate-950 text-white hover:bg-slate-800 flex items-center justify-center font-black text-xs cursor-pointer shadow-2xs active:scale-90 transition-transform"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addToCart(food, activePortion)}
                        className="bg-[#ff5722] hover:bg-[#f4511e] text-white px-4 py-2 rounded-2xl font-black text-xs flex items-center gap-1 shadow-sm shadow-orange-500/25 active:scale-95 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isTamil ? "சேர்" : "+ Add"}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredFoods.length === 0 && (
              <div className="col-span-full bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
                <UtensilsCrossed className="w-12 h-12 text-[#ff5722]/50 mx-auto mb-2" />
                <div className="font-bold text-slate-700 text-sm">
                  {isTamil ? "உணவுகள் எதுவும் கிடைக்கவில்லை" : "No dishes found"}
                </div>
                <div className="text-xs mt-0.5">
                  {isTamil ? "வேறு பெயரில் தேடவும் அல்லது வகை மாற்றவும்." : "Try searching with another food name or selecting a different category."}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. RIGHT ORDER INVOICE PANEL (Table/Order Header, Cart Items & Totals) */}
      {/* ========================================================================= */}
      <aside className="w-80 sm:w-96 shrink-0 bg-white rounded-3xl p-5 shadow-sm border border-slate-100/90 flex flex-col justify-between h-[calc(100vh-2rem)] sticky top-4 my-3 mr-3">
        <div>
          {/* Top Invoice Header: Order No. & Table No. */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isTamil ? "ஆர்டர் எண்" : "Order No."}
              </div>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                #{orderId}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {orderType === "TABLE" ? (isTamil ? "டேபிள் எண்" : "Table No.") : (isTamil ? "டோக்கன்" : "Token")}
              </div>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                {orderType === "TABLE" ? tableNumber : "Token"}
              </div>
            </div>
          </div>

          {/* Customer Name & WhatsApp (Optional) */}
          <div className="py-2.5 border-b border-slate-100 grid grid-cols-2 gap-2">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={isTamil ? "பெயர் (Optional)" : "Customer Name"}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#ff5722] focus:border-[#ff5722]"
            />
            <input
              type="tel"
              value={customerPhone}
              maxLength={10}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder={isTamil ? "வாட்ஸ்அப் எண்" : "WhatsApp No."}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#ff5722] focus:border-[#ff5722]"
            />
          </div>

          {/* Cart Items List */}
          <div className="max-h-[42vh] overflow-y-auto space-y-3 py-3 pr-1">
            {cart.map((item, idx) => {
              const foodImg = getFoodImage({ name: item.foodName, nameTamil: item.foodNameTamil, imageUrl: item.imageUrl });
              return (
                <div
                  key={`${item.foodItemId}-${item.portionId}`}
                  className="flex items-center justify-between gap-3 group"
                >
                  {/* Left: Food Thumbnail Image */}
                  <img
                    src={foodImg}
                    alt={item.foodName}
                    className="w-12 h-12 rounded-2xl object-cover shrink-0 shadow-2xs bg-slate-100"
                  />

                  {/* Center: Quantity & Food Name */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      <span className="text-[#ff5722] font-black mr-1">{item.quantity}x</span>
                      <span>{getFoodName({ name: item.foodName, nameTamil: item.foodNameTamil })}</span>
                    </div>
                    <div className="text-[10px] font-semibold text-slate-400">
                      {getPortionName(item.portionName)}
                    </div>
                  </div>

                  {/* Right: Edit / Price */}
                  <div className="flex flex-col items-end shrink-0">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(idx, -1)}
                        className="text-[10px] text-slate-400 hover:text-rose-600 font-bold flex items-center gap-0.5 cursor-pointer"
                        title="Remove or Edit"
                      >
                        <Edit2 className="w-3 h-3 text-[#ff5722]" />
                        <span className="text-[#ff5722]">{isTamil ? "மாற்று" : "Edit"}</span>
                      </button>
                    </div>
                    <div className="font-black text-xs sm:text-sm text-slate-900 mt-0.5">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </div>
                  </div>
                </div>
              );
            })}

            {cart.length === 0 && (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-slate-300 mb-2" />
                <div className="font-bold text-xs text-slate-600">{t("cart.emptyTitle")}</div>
                <div className="text-[10px] text-slate-400">{t("cart.emptySubtitle")}</div>
              </div>
            )}
          </div>
        </div>

        {/* Financial Calculation & Action Buttons */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          {/* Subtotal, Discount & Grand Total */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-500 font-semibold">
              <span>{isTamil ? "மொத்தத் தொகை" : "Subtotal"}</span>
              <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between text-slate-500 font-semibold">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-[#ff5722]" />
                <span>{t("cart.discount")}</span>
              </span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
                className="w-16 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#ff5722]"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="font-extrabold text-sm text-slate-900">{isTamil ? "செலுத்த வேண்டிய தொகை" : "Total"}</span>
              <span className="font-black text-2xl text-slate-900">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* Action Buttons: Cash & Print (Coral) and KOT Slip */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => handleInstantPayAndPrint("CASH")}
              disabled={submitting || cart.length === 0}
              className="w-full py-3.5 bg-[#ff5722] hover:bg-[#f4511e] disabled:opacity-40 text-white font-black rounded-2xl shadow-lg shadow-orange-500/30 active:scale-98 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-200" />
              <span>{t("cart.cashAndPrint")}</span>
              <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded font-mono">↵</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAndPrintOrderSlip}
              disabled={submitting || cart.length === 0}
              className="w-full py-2.5 bg-white hover:bg-orange-50/50 text-slate-800 disabled:opacity-40 border border-[#ff5722] font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5 text-[#ff5722]" />
              <span>{t("cart.orderSlip")} (KOT)</span>
              <span className="text-[10px] bg-orange-100 text-[#ff5722] px-1.5 py-0.5 rounded font-mono">⇧↵</span>
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
