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
  Phone
} from "lucide-react";
import { formatCurrency, formatHumanStock } from "@/lib/format";
import ThermalReceipt from "@/components/ThermalReceipt";
import PaymentModal from "@/components/PaymentModal";
import { sendWhatsAppBillAndOffer } from "@/lib/whatsapp";

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
  categoryId: string;
  description: string | null;
  dietary?: string;
  mealTime?: string;
  stockType?: "EXACT_COUNT" | "BATCH_ESTIMATE" | "NO_TRACKING" | string;
  category: { id: string; name: string };
  portions: Portion[];
  stock: {
    currentQuantity: number;
    unitName: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
}

interface CartItem {
  foodItemId: string;
  foodName: string;
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

  // Order Type & Reference State
  const [orderType] = useState<"TABLE" | "TOKEN" | "PARCEL">("TOKEN");
  const [orderReference] = useState("Counter");

  // Customer Info State (Optional for billing & WhatsApp receipt)
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

  // Add portion to cart
  const addToCart = (food: FoodItem, portion: Portion) => {
    // Check if food item is Out of Stock (0 quantity, skipped for NO_TRACKING)
    if (food.stockType !== "NO_TRACKING" && food.stock && food.stock.currentQuantity <= 0) {
      showToast(`🚫 "${food.name}" is Out of Stock! Please prepare a new batch.`);
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
      f.category.name.toLowerCase().includes(query);
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
        {/* LEFT COLUMN: Food Catalog */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">

          {/* MEAL SESSION TIMING BAR */}
          <div className="bg-slate-900 text-white p-2.5 sm:p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full sm:w-auto">
              <span className="text-[11px] font-black uppercase text-emerald-400 mr-1 flex items-center gap-1 shrink-0">
                <Clock className="w-3.5 h-3.5" />
                <span>Session:</span>
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
                🍽️ All Menu
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
                <span>Breakfast</span>
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
                <span>Lunch</span>
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
                <span>Snacks & Tea</span>
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
                <span>Dinner</span>
              </button>
            </div>

            <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-400 font-bold">
              <span>Current Session:</span>
              <span className="text-emerald-400 capitalize">{getCurrentSession().toLowerCase()}</span>
            </div>
          </div>

          {/* Instant Food Search & Filter Bar */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            {/* Full-Width Fast Food Search Box */}
            <div className="relative w-full">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Search any food item instantly (e.g., Dosa, Biriyani, Parotta, Coffee)..."
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

            {/* Category and Dietary Type Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedCatId("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedCatId === "all"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCatId(cat.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCatId === cat.id
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Dietary Type Filter */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedDietary("ALL")}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedDietary === "ALL"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All Diet
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDietary("VEG")}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    selectedDietary === "VEG"
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                  }`}
                >
                  <span>🟢</span>
                  <span>Veg</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDietary("NON_VEG")}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    selectedDietary === "NON_VEG"
                      ? "bg-rose-600 text-white"
                      : "bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100"
                  }`}
                >
                  <span>🔴</span>
                  <span>Non-Veg</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDietary("EGG")}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    selectedDietary === "EGG"
                      ? "bg-amber-500 text-slate-950 font-black"
                      : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                  }`}
                >
                  <span>🟡</span>
                  <span>Egg</span>
                </button>
              </div>
            </div>
          </div>

          {/* Food Items Selection Grid - High-Density Touch Buttons (NO IMAGES) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredFoods.map((food) => {
              const isNoTracking = food.stockType === "NO_TRACKING";
              const isOut = !isNoTracking && food.stock ? food.stock.currentQuantity <= 0 : false;
              const isLow = !isNoTracking && food.stock ? food.stock.currentQuantity > 0 && food.stock.currentQuantity <= 10 : false;
              const diet = food.dietary || "VEG";

              return (
                <div
                  key={food.id}
                  className={`bg-white rounded-2xl border p-3.5 shadow-sm transition-all flex flex-col justify-between group ${
                    isOut
                      ? "border-red-200 bg-red-50/20 opacity-80"
                      : isLow
                      ? "border-amber-300 hover:border-amber-500 hover:shadow-md"
                      : "border-slate-200 hover:border-emerald-500 hover:shadow-md"
                  }`}
                >
                  {/* Top Bar: Badges & Stock */}
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {food.category.name}
                        </span>
                        {diet === "NON_VEG" ? (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                            🔴 Non-Veg
                          </span>
                        ) : diet === "EGG" ? (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                            🟡 Egg
                          </span>
                        ) : (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                            🟢 Veg
                          </span>
                        )}
                      </div>

                      {/* Stock Badge */}
                      {isNoTracking ? (
                        <span className="text-[10px] font-bold text-slate-400">
                          ♾️ Stock
                        </span>
                      ) : food.stock ? (
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                          isOut
                            ? "bg-red-100 text-red-700 font-extrabold"
                            : isLow
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-50 text-emerald-700"
                        }`}>
                          {isOut
                            ? "🚫 Out of Stock"
                            : isLow
                            ? `⚠️ Low (${formatHumanStock(food.stock.currentQuantity, food.stock.unitName)})`
                            : `Stock: ${formatHumanStock(food.stock.currentQuantity, food.stock.unitName)}`}
                        </span>
                      ) : null}
                    </div>

                    {/* Dish Name */}
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-emerald-700 transition-colors">
                      {food.name}
                    </h3>
                  </div>

                  {/* Portion Action Buttons (1-Click Add to Cart) */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                    <div className="grid grid-cols-1 gap-1.5">
                      {food.portions.map((portion) => (
                        <button
                          key={portion.id}
                          type="button"
                          onClick={() => addToCart(food, portion)}
                          disabled={isOut}
                          className={`w-full flex items-center justify-between px-3 py-2 font-bold rounded-xl border transition-all active:scale-[0.98] group/btn ${
                            isOut
                              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
                              : "bg-slate-50 hover:bg-emerald-600 hover:text-white text-slate-900 border-slate-200 hover:border-emerald-600 shadow-2xs"
                          }`}
                        >
                          <span className="text-xs font-bold">
                            {portion.portionName}
                            {isOut && <span className="ml-1 text-[10px] text-red-500 font-extrabold">(Out)</span>}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-emerald-700 group-hover/btn:text-white">
                              {formatCurrency(portion.price)}
                            </span>
                            {!isOut && <Plus className="w-3.5 h-3.5 opacity-60 group-hover/btn:opacity-100" />}
                          </div>
                        </button>
                      ))}
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
                    No Dishes Added Yet
                  </div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Owner can go to the Menu Manager to add new categories and dishes to start billing.
                  </p>
                </div>
                <a
                  href="/owner/menu"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-700/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Go to Menu Manager</span>
                </a>
              </div>
            ) : filteredFoods.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <div className="font-bold text-slate-600 text-sm">
                  No dishes found
                </div>
                <div className="text-xs mt-0.5">
                  Try searching with another food name or selecting a different category.
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Order Cart & Bill Generator */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl sticky top-20 flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
            {/* Cart Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="font-extrabold text-sm sm:text-base leading-none">Current Bill Cart</div>
                  <div className="text-[11px] text-emerald-300 font-semibold mt-0.5">
                    {totalItemsCount} Items in Cart
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
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Customer Information (Optional - Name & Phone for WhatsApp Bill) */}
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
                  placeholder="Customer Name"
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
                  placeholder="WhatsApp No. (Enter ↵)"
                  maxLength={10}
                  className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Cart Items List */}
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
                  <div className="font-bold text-slate-700 text-sm">Cart is empty</div>
                  <div className="text-xs text-slate-400 mt-0.5 max-w-[200px]">
                    Click any food item on the left to add it to this bill.
                  </div>
                </div>
              )}
            </div>

            {/* Cart Footer: Compact Summary & 2-Button Action Bar */}
            <div className="p-3 bg-white border-t border-slate-200 shrink-0 space-y-2.5">
              {/* Discount & Totals Row */}
              <div className="flex items-center justify-between text-xs gap-2 pb-1 border-b border-slate-100">
                <div className="flex items-center gap-1 text-slate-600 font-semibold">
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span>Discount:</span>
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
                  <span className="text-slate-500 font-medium">Total ({totalItemsCount}):</span>
                  <span className="text-base font-black text-emerald-700">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

              {/* 2 COMPACT ACTION BUTTONS: Instant Cash & Order Slip */}
              <div className="grid grid-cols-2 gap-2">
                {/* 1. Instant Cash & Print (Primary / Enter) */}
                <button
                  type="button"
                  onClick={() => handleInstantPayAndPrint("CASH")}
                  disabled={submitting || cart.length === 0}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xs active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 text-xs sm:text-sm border border-emerald-500"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Cash & Print</span>
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
                  <span>Order Slip</span>
                  <span className="text-[10px] bg-amber-700/30 px-1 py-0.2 rounded font-mono font-bold">⇧↵</span>
                </button>
              </div>

              <div className="text-center text-[10px] text-slate-400 font-medium">
                ⌨️ <kbd className="px-1 py-0.2 bg-slate-100 border border-slate-200 text-slate-700 rounded font-mono font-bold">ENTER</kbd> = Cash Bill &bull; <kbd className="px-1 py-0.2 bg-slate-100 border border-slate-200 text-slate-700 rounded font-mono font-bold">Shift+ENTER</kbd> = Order Slip
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
