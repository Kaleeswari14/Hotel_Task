"use client";

import React, { useState, useEffect } from "react";
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
  BarChart3,
  SlidersHorizontal,
  ChevronDown,
  DollarSign
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
  initialNextBillNumber?: number;
}

export default function PosTerminal({
  categories,
  foods: initialFoods,
  userName,
  userRole,
  initialNextBillNumber = 1001,
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
  const [tableNumber, setTableNumber] = useState<string>("1");
  const [currentBillNumber, setCurrentBillNumber] = useState<number>(initialNextBillNumber);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discount, setDiscount] = useState<string>("");

  // Portion selection map per food item
  const [selectedPortionMap, setSelectedPortionMap] = useState<Record<string, string>>({});

  // Payment & Thermal Receipt Modals
  const [submitting, setSubmitting] = useState(false);
  // Split Payment Modal State
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitCash, setSplitCash] = useState<string>("");
  const [splitUpi, setSplitUpi] = useState<string>("");
  const [splitCard, setSplitCard] = useState<string>("");

  // Offline queue state
  const [offlineBillsCount, setOfflineBillsCount] = useState<number>(0);

  // Incoming Table Orders Alert State
  const [incomingTableOrder, setIncomingTableOrder] = useState<any>(null);

  // Auto-sync offline bills when online
  useEffect(() => {
    const syncOfflineBills = async () => {
      if (!navigator.onLine) return;
      try {
        const raw = localStorage.getItem("offline_bills_queue");
        if (!raw) return;
        const queue = JSON.parse(raw);
        if (!Array.isArray(queue) || queue.length === 0) return;

        let syncedCount = 0;
        for (const billPayload of queue) {
          const res = await fetch("/api/bills", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(billPayload),
          });
          if (res.ok) syncedCount++;
        }

        localStorage.removeItem("offline_bills_queue");
        setOfflineBillsCount(0);
        if (syncedCount > 0) {
          showToast(`✅ ${syncedCount} offline bill(s) synced to database!`);
        }
      } catch (err) {
        console.error("Offline sync error:", err);
      }
    };

    window.addEventListener("online", syncOfflineBills);
    syncOfflineBills();

    return () => window.removeEventListener("online", syncOfflineBills);
  }, []);

  // Poll for incoming customer table self-orders
  useEffect(() => {
    const checkTableOrders = async () => {
      try {
        const res = await fetch("/api/bills?limit=5");
        const data = await res.json();
        if (data.bills && Array.isArray(data.bills)) {
          const latestTable = data.bills.find(
            (b: any) => b.orderType === "TABLE" && b.status === "UNPAID" && (Date.now() - new Date(b.createdAt).getTime()) < 60000
          );
          if (latestTable) {
            setIncomingTableOrder(latestTable);
          }
        }
      } catch (e) {}
    };

    const interval = setInterval(checkTableOrders, 10000);
    return () => clearInterval(interval);
  }, []);

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

  // Remove item completely from cart
  const removeCartItem = (idx: number) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setDiscount("");
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountVal = parseFloat(discount) || 0;
  const grandTotal = Math.max(0, subtotal - discountVal);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // 1. OPTION ONE: Instant Pay & Print (Full Paid Bill)
  const handleInstantPayAndPrint = async (paymentMethod: "CASH" | "UPI" | "CARD" = "CASH") => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const orderRef = orderType === "TABLE" ? `Table ${tableNumber}` : "Token";
      const payload = {
        orderType: orderType,
        orderReference: orderRef,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        discount: discountVal,
        paidAmount: grandTotal,
        paymentMethod: paymentMethod,
        items: cart.map((c) => ({
          foodItemId: c.foodItemId,
          foodName: c.foodName,
          portionId: c.portionId,
          portionName: c.portionName,
          unitMultiplier: c.unitMultiplier,
          unitPrice: c.unitPrice,
          quantity: c.quantity,
        })),
      };

      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
          billNumber: data.billNumber || currentBillNumber,
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

      setCurrentBillNumber((prev) => (data.billNumber ? data.billNumber + 1 : prev + 1));
      setReceiptInitialMode("PAYMENT_RECEIPT");
      setReceiptAutoPrint(true);
      setReceiptBill(finalBill);
      clearCart();
    } catch (err: any) {
      alert(`Billing Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

    // Split Payment Processor
  const handleProcessSplitPayment = async () => {
    if (cart.length === 0) return;
    const cAmount = parseFloat(splitCash) || 0;
    const uAmount = parseFloat(splitUpi) || 0;
    const cardAmount = parseFloat(splitCard) || 0;
    const totalSplit = cAmount + uAmount + cardAmount;

    if (totalSplit <= 0) {
      alert("Please enter at least one payment amount");
      return;
    }

    setSubmitting(true);
    try {
      const orderRef = orderType === "TABLE" ? `Table ${tableNumber}` : "Token";
      const payload = {
        orderType: orderType,
        orderReference: orderRef,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        discount: discountVal,
        splitPayments: [
          { method: "CASH", amount: cAmount },
          { method: "UPI", amount: uAmount },
          { method: "CARD", amount: cardAmount },
        ],
        items: cart.map((c) => ({
          foodItemId: c.foodItemId,
          foodName: c.foodName,
          portionId: c.portionId,
          portionName: c.portionName,
          unitMultiplier: c.unitMultiplier,
          unitPrice: c.unitPrice,
          quantity: c.quantity,
        })),
      };

      // If offline, save in queue
      if (!navigator.onLine) {
        const raw = localStorage.getItem("offline_bills_queue") || "[]";
        const queue = JSON.parse(raw);
        queue.push(payload);
        localStorage.setItem("offline_bills_queue", JSON.stringify(queue));
        setOfflineBillsCount(queue.length);

        const offlineBill = {
          id: `offline-${Date.now()}`,
          billNumber: currentBillNumber,
          orderReference: orderRef,
          customerName: customerName.trim() || null,
          customerPhone: customerPhone.trim() || null,
          createdAt: new Date(),
          items: cart.map((c) => ({
            foodName: c.foodName,
            portionName: c.portionName,
            quantity: c.quantity,
            subtotal: c.unitPrice * c.quantity,
            unitPrice: c.unitPrice,
          })),
          subtotal,
          discount: discountVal,
          totalAmount: grandTotal,
          paidAmount: totalSplit,
          status: totalSplit >= grandTotal ? "PAID" : "PARTIAL",
        };

        setCurrentBillNumber((prev) => prev + 1);
        setReceiptInitialMode("PAYMENT_RECEIPT");
        setReceiptAutoPrint(true);
        setReceiptBill(offlineBill);
        clearCart();
        setShowSplitModal(false);
        showToast("🟡 Offline Bill Generated & Queued for Auto-Sync!");
        return;
      }

      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create split bill");

      setCurrentBillNumber((prev) => (data.billNumber ? data.billNumber + 1 : prev + 1));
      setReceiptInitialMode("PAYMENT_RECEIPT");
      setReceiptAutoPrint(true);
      setReceiptBill(data);
      clearCart();
      setShowSplitModal(false);
      setSplitCash("");
      setSplitUpi("");
      setSplitCard("");
    } catch (err: any) {
      alert(`Split Payment Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 2. OPTION TWO: Order Slip / KOT (UNPAID Active Order Slip)
  const handleSaveAndPrintOrderSlip = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const orderRef = orderType === "TABLE" ? `Table ${tableNumber}` : "Token";
      const payload = {
        orderType: orderType,
        orderReference: orderRef,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        discount: discountVal,
        paidAmount: 0, // Unpaid order slip
        items: cart.map((c) => ({
          foodItemId: c.foodItemId,
          foodName: c.foodName,
          portionId: c.portionId,
          portionName: c.portionName,
          unitMultiplier: c.unitMultiplier,
          unitPrice: c.unitPrice,
          quantity: c.quantity,
        })),
      };

      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order slip");

      const finalOrderBill = {
        ...data,
        customerName: data.customerName || customerName.trim() || null,
        customerPhone: data.customerPhone || customerPhone.trim() || null,
      };

      setCurrentBillNumber((prev) => (data.billNumber ? data.billNumber + 1 : prev + 1));
      setReceiptInitialMode("ORDER_SLIP");
      setReceiptAutoPrint(true);
      setReceiptBill(finalOrderBill);
      clearCart();
    } catch (err: any) {
      alert(`Order Slip Error: ${err.message}`);
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
    <div className="w-full min-h-[calc(100vh-60px)] bg-[#faf5f2] text-slate-800 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-[#ff5722] text-sm font-bold animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-[#ff5722] shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* MAIN CONTENT AREA: Food Menu + Right Checkout Drawer */}
      <div className="flex-1 flex flex-col lg:flex-row min-w-0 p-3 sm:p-5 lg:p-6 gap-6">
        
        {/* ========================================================================= */}
        {/* 1. LEFT & CENTER AREA: Search, Category Bar & Food Cards Grid */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col min-w-0 space-y-4">
          
          {/* TOP CONTROLS STRIP: Clean Search Input + Mode Switcher + New Order */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white/90 backdrop-blur-md p-3.5 sm:p-4 rounded-3xl border border-slate-200/80 shadow-sm">
            {/* Search Input Box */}
            <div className="flex-1 min-w-[240px] max-w-lg relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isTamil ? "உணவின் பெயர் அல்லது குறியீடு தேடுங்கள்..." : "Search products or dishes..."}
                className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ff5722]/20 focus:border-[#ff5722] transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center cursor-pointer hover:bg-slate-300"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Mode Switcher & + New Order */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Table / Token Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  const nextType = orderType === "TOKEN" ? "TABLE" : "TOKEN";
                  setOrderType(nextType);
                  showToast(nextType === "TABLE" ? `டேபிள் மோட்: Table ${tableNumber}` : "டோக்கன் மோட் இயக்கப்பட்டது");
                }}
                className={`px-3.5 py-2 rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer border text-xs font-black ${
                  orderType === "TABLE"
                    ? "bg-gradient-to-r from-amber-500 to-[#ff5722] text-white border-transparent shadow-xs"
                    : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-orange-50"
                }`}
              >
                <span>{orderType === "TABLE" ? `🍽️ Table ${tableNumber}` : "🎟️ Token Mode"}</span>
              </button>

              {/* Quick Table Selector if in Table mode */}
              {orderType === "TABLE" && (
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-2xl px-2.5 py-1.5 shadow-2xs">
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

              {/* "+ New Order" Orange Action Button */}
              <button
                type="button"
                onClick={clearCart}
                className="bg-[#ff5722] hover:bg-[#f4511e] text-white px-4 py-2 rounded-2xl font-black text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isTamil ? "புதிய ஆர்டர்" : "New Order"}</span>
              </button>
            </div>
          </div>

          {/* HORIZONTAL CATEGORY PILLS & DIETARY FILTER BAR */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
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

          {/* FOOD DISH CARDS GRID */}
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

                        {/* Category Badge on Top of Image */}
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
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          {isTamil ? "தீர்ந்தது" : "Sold Out"}
                        </span>
                      ) : portionQty === 0 ? (
                        <button
                          type="button"
                          onClick={() => addToCart(food, activePortion)}
                          className="px-4 py-2 rounded-2xl bg-gradient-to-r from-orange-500 to-[#ff5722] hover:from-orange-600 hover:to-[#f4511e] text-white font-black text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ {isTamil ? "சேர்" : "Add"}</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-2xl p-1 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleCardDecrement(food, activePortion)}
                            className="w-7 h-7 rounded-xl bg-white text-slate-700 hover:text-rose-600 flex items-center justify-center font-bold text-xs shadow-2xs active:scale-95 transition-all cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-black text-xs text-orange-950 px-1 min-w-[16px] text-center">
                            {portionQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(food, activePortion)}
                            className="w-7 h-7 rounded-xl bg-gradient-to-r from-orange-500 to-[#ff5722] text-white flex items-center justify-center font-bold text-xs shadow-2xs active:scale-95 transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. RIGHT SIDEBAR: Order Ticket & Checkout Panel with Full Controls */}
        {/* ========================================================================= */}
        <div className="w-full lg:w-96 shrink-0 bg-white rounded-3xl p-5 shadow-luxury border border-slate-200/90 flex flex-col justify-between self-start sticky top-20 max-h-[calc(100vh-90px)] overflow-y-auto">
          <div>
            {/* Drawer Header: Order Type & Real Bill Number */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex flex-col">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  {orderType === "TABLE" ? `Table ${tableNumber}` : "Token Order"}
                </span>
                <span className="text-base font-black text-slate-900 tracking-tight">
                  {isTamil ? "பில் எண்" : "BILL"} #{currentBillNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={clearCart}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                title="Clear Cart"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Customer Contact Input */}
            <div className="mt-3 space-y-2">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={isTamil ? "வாடிக்கையாளர் பெயர்" : "Customer Name (Optional)"}
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

            {/* Cart Items List (With + / - / Delete / Edit Buttons) */}
            <div className="max-h-[36vh] overflow-y-auto space-y-3 py-3 pr-1">
              {cart.map((item, idx) => {
                const foodImg = getFoodImage({ name: item.foodName, nameTamil: item.foodNameTamil, imageUrl: item.imageUrl });
                return (
                  <div
                    key={`${item.foodItemId}-${item.portionId}`}
                    className="flex items-center justify-between gap-2.5 p-2 bg-slate-50/80 rounded-2xl border border-slate-100 group hover:bg-white hover:border-orange-200 transition-all shadow-2xs"
                  >
                    {/* Left: Food Thumbnail Image */}
                    <img
                      src={foodImg}
                      alt={item.foodName}
                      className="w-10 h-10 rounded-xl object-cover shrink-0 bg-slate-100 shadow-2xs"
                    />

                    {/* Center: Food Name & Portion */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {getFoodName({ name: item.foodName, nameTamil: item.foodNameTamil })}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-400 truncate">
                        {getPortionName(item.portionName)} &bull; {formatCurrency(item.unitPrice)}
                      </div>
                    </div>

                    {/* Right: Stepper Controls (+ / - / Trash) & Total */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Stepper (- / Qty / +) */}
                      <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(idx, -1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-rose-600 font-bold text-xs cursor-pointer active:scale-90"
                          title="Decrease Qty"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-black text-slate-900 px-1.5 min-w-[18px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(idx, 1)}
                          className="w-6 h-6 flex items-center justify-center text-[#ff5722] hover:text-orange-700 font-bold text-xs cursor-pointer active:scale-90"
                          title="Increase Qty"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Amount */}
                      <div className="font-black text-xs text-slate-900 min-w-[45px] text-right">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </div>

                      {/* Delete Item Button */}
                      <button
                        type="button"
                        onClick={() => removeCartItem(idx)}
                        className="w-7 h-7 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {cart.length === 0 && (
                <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center">
                  <ShoppingBag className="w-10 h-10 text-slate-300 mb-2" />
                  <div className="font-bold text-xs text-slate-600">{t("cart.emptyTitle")}</div>
                  <div className="text-[10px] text-slate-400">{t("cart.emptySubtitle")}</div>
                </div>
              )}
            </div>
          </div>

          {/* Financial Calculation & 2 Billing Options */}
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

              <div className="flex items-center justify-between text-sm sm:text-base font-black text-slate-900 pt-1 border-t border-slate-100">
                <span>{isTamil ? "நிகரத் தொகை" : "Total"}</span>
                <span className="text-[#ff5722] text-lg sm:text-xl font-black">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* TWO BILLING OPTIONS: 1. Instant Pay & Print (Full Paid Bill) | 2. Order Slip / KOT */}
            <div className="space-y-2">
              {/* Option 1: Instant Cash & Print */}
              <button
                type="button"
                onClick={() => handleInstantPayAndPrint("CASH")}
                disabled={cart.length === 0 || submitting}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 via-[#ff5722] to-amber-500 hover:from-orange-600 hover:to-orange-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>{submitting ? "Processing..." : isTamil ? "பணம் செலுத்தி அச்சிடு (Cash & Print)" : "Instant Cash & Print (Enter)"}</span>
              </button>

                            {/* Split Payment & More Methods */}
              <div className="grid grid-cols-3 gap-2">
                {/* Instant UPI */}
                <button
                  type="button"
                  onClick={() => handleInstantPayAndPrint("UPI")}
                  disabled={cart.length === 0 || submitting}
                  className="py-2.5 px-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold text-xs flex items-center justify-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-blue-600" />
                  <span>UPI / QR</span>
                </button>

                {/* Split Payment Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSplitCash(String(grandTotal));
                    setSplitUpi("");
                    setSplitCard("");
                    setShowSplitModal(true);
                  }}
                  disabled={cart.length === 0 || submitting}
                  className="py-2.5 px-2 rounded-2xl bg-orange-100 hover:bg-orange-200 text-orange-950 font-extrabold text-xs flex items-center justify-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5 text-orange-600" />
                  <span>{isTamil ? "பிரித்து செலுத்து" : "Split Pay"}</span>
                </button>

                {/* Option 2: Order Slip / KOT */}
                <button
                  type="button"
                  onClick={handleSaveAndPrintOrderSlip}
                  disabled={cart.length === 0 || submitting}
                  className="py-2.5 px-2 rounded-2xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-950 font-extrabold text-xs flex items-center justify-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#ff5722]" />
                  <span>{isTamil ? "KOT" : "KOT Slip"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

            {/* Incoming Online Table Order Notification */}
      {incomingTableOrder && (
        <div className="fixed top-20 right-6 z-50 bg-white border-2 border-orange-500 shadow-2xl p-4 rounded-3xl max-w-sm w-full animate-slide-down flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/30 animate-bounce">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs text-orange-600 uppercase">
                🔔 New Table Order!
              </span>
              <button
                type="button"
                onClick={() => setIncomingTableOrder(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>
            <div className="font-black text-sm text-slate-900 mt-0.5">
              {incomingTableOrder.orderReference} (#{incomingTableOrder.billNumber})
            </div>
            <div className="text-xs text-slate-500 font-mono">
              ₹{incomingTableOrder.totalAmount} • {incomingTableOrder.items?.length || 1} items
            </div>
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setReceiptInitialMode("ORDER_SLIP");
                  setReceiptAutoPrint(true);
                  setReceiptBill(incomingTableOrder);
                  setIncomingTableOrder(null);
                }}
                className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-xs rounded-xl shadow-xs"
              >
                Print KOT Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Split Payment Modal */}
      {showSplitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-black">
                  ₹
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    {isTamil ? "பணம் பிரித்து செலுத்துதல் (Split Payment)" : "Split Payment"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Total Bill: <span className="font-mono font-black text-orange-600">₹{grandTotal}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSplitModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Cash Input */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-bold text-slate-700">
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">💵</span>
                  <span>Cash (ரொக்கம்):</span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={splitCash}
                  onChange={(e) => setSplitCash(e.target.value)}
                  placeholder="0"
                  className="w-28 px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono font-black text-right text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* UPI Input */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-bold text-slate-700">
                  <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center text-xs">📱</span>
                  <span>UPI / GPay:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const c = parseFloat(splitCash) || 0;
                      setSplitUpi(String(Math.max(0, grandTotal - c)));
                    }}
                    className="px-2 py-1 bg-white hover:bg-orange-50 border border-orange-200 text-orange-700 rounded-lg text-[10px] font-bold"
                  >
                    Remaining
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={splitUpi}
                    onChange={(e) => setSplitUpi(e.target.value)}
                    placeholder="0"
                    className="w-28 px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono font-black text-right text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Card Input */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-bold text-slate-700">
                  <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center text-xs">💳</span>
                  <span>Card / Swiping:</span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={splitCard}
                  onChange={(e) => setSplitCard(e.target.value)}
                  placeholder="0"
                  className="w-28 px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono font-black text-right text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Total Summary */}
              {(() => {
                const totalPaid = (parseFloat(splitCash) || 0) + (parseFloat(splitUpi) || 0) + (parseFloat(splitCard) || 0);
                const diff = grandTotal - totalPaid;
                return (
                  <div className="p-3 bg-orange-50/70 rounded-2xl border border-orange-200 flex items-center justify-between font-bold text-xs">
                    <span>Total Paid: <b className="font-mono">₹{totalPaid}</b></span>
                    <span className={diff === 0 ? "text-emerald-700 font-black" : diff > 0 ? "text-amber-700 font-black" : "text-red-600 font-black"}>
                      {diff === 0 ? "✅ Fully Balanced" : diff > 0 ? `₹${diff} Remaining` : `₹${Math.abs(diff)} Extra`}
                    </span>
                  </div>
                );
              })()}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSplitModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessSplitPayment}
                disabled={submitting}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-black text-white rounded-xl shadow-md shadow-orange-500/20 active:scale-[0.98] transition-all"
              >
                {submitting ? "Processing..." : isTamil ? "பில் & ரசீது அச்சிடு" : "Confirm & Print Bill"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Receipt Print Dialog */}
      {receiptBill && (
        <ThermalReceipt
          bill={receiptBill}
          initialMode={receiptInitialMode}
          autoPrint={receiptAutoPrint}
          onClose={() => {
            setReceiptBill(null);
            setReceiptAutoPrint(false);
          }}
        />
      )}
    </div>
  );
}
