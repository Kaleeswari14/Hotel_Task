"use client";

import React, { useState, useEffect } from "react";
import {
  UtensilsCrossed,
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle2,
  Sparkles,
  Search,
  Tag,
  Clock,
  Send,
  Languages,
  Check,
  ChevronRight,
  Flame,
  ArrowLeft
} from "lucide-react";

interface Portion {
  id: string;
  portionName: string;
  portionNameTamil?: string | null;
  price: number;
  unitMultiplier: number;
}

interface FoodItem {
  id: string;
  name: string;
  nameTamil?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  dietary: string;
  category: {
    id: string;
    name: string;
    nameTamil?: string | null;
  };
  portions: Portion[];
}

interface CartItem {
  foodItemId: string;
  foodName: string;
  portionId: string;
  portionName: string;
  unitPrice: number;
  quantity: number;
  dietary: string;
}

export default function CustomerOrderView({ tableId }: { tableId: string }) {
  const [isTamil, setIsTamil] = useState(true);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState("ALL");
  const [dietFilter, setDietFilter] = useState<"ALL" | "VEG" | "NON_VEG">("ALL");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ orderNumber: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const formattedTable = tableId.toUpperCase().startsWith("T") ? tableId.toUpperCase() : `Table ${tableId}`;

  useEffect(() => {
    async function loadMenu() {
      try {
        setLoading(true);
        const [foodsRes, catsRes] = await Promise.all([
          fetch("/api/foods"),
          fetch("/api/categories"),
        ]);
        const foodsData = await foodsRes.json();
        const catsData = await catsRes.json();
        if (foodsData.foods) setFoods(foodsData.foods);
        if (catsData.categories) setCategories(catsData.categories);
      } catch (err) {
        console.error("Failed to load menu", err);
      } finally {
        setLoading(false);
      }
    }
    loadMenu();
  }, []);

  const addToCart = (food: FoodItem, portion: Portion) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (i) => i.foodItemId === food.id && i.portionId === portion.id
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx].quantity += 1;
        return next;
      }
      return [
        ...prev,
        {
          foodItemId: food.id,
          foodName: isTamil && food.nameTamil ? food.nameTamil : food.name,
          portionId: portion.id,
          portionName: isTamil && portion.portionNameTamil ? portion.portionNameTamil : portion.portionName,
          unitPrice: portion.price,
          quantity: 1,
          dietary: food.dietary,
        },
      ];
    });
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const item = prev[index];
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      const next = [...prev];
      next[index].quantity = newQty;
      return next;
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/orders/table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId,
          customerName: customerName.trim() || "Table Guest",
          customerPhone: customerPhone.trim() || undefined,
          items: cart,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOrderSuccess({ orderNumber: data.orderNumber, total: cartTotal });
        setCart([]);
        setShowCartDrawer(false);
      } else {
        alert(data.error || "Failed to place order");
      }
    } catch (err: any) {
      alert(err.message || "Error submitting order");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFoods = foods.filter((food) => {
    if (selectedCat !== "ALL" && food.category?.id !== selectedCat) return false;
    if (dietFilter !== "ALL" && food.dietary !== dietFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchEng = food.name.toLowerCase().includes(q);
      const matchTam = food.nameTamil ? food.nameTamil.toLowerCase().includes(q) : false;
      return matchEng || matchTam;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-black text-xs flex items-center justify-center shadow-md shadow-orange-500/20">
            JB
          </div>
          <div>
            <h1 className="font-black text-sm text-slate-900 leading-tight flex items-center gap-1.5">
              <span>HOTEL JB</span>
              <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-[10px] font-black">
                {formattedTable}
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">
              {isTamil ? "நேரடி டேபிள் ஆர்டர் மெனு" : "Digital Self-Order Menu"}
            </p>
          </div>
        </div>

        {/* Language Switcher */}
        <button
          type="button"
          onClick={() => setIsTamil(!isTamil)}
          className="px-3 py-1.5 rounded-xl border border-orange-200 bg-orange-50 text-orange-800 text-xs font-black flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
        >
          <Languages className="w-3.5 h-3.5" />
          <span>{isTamil ? "English" : "தமிழ்"}</span>
        </button>
      </header>

      {/* Hero Welcome Pill */}
      <div className="p-4 max-w-lg mx-auto">
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white p-4 rounded-3xl shadow-md shadow-orange-500/20 flex items-center justify-between gap-3">
          <div>
            <span className="px-2 py-0.5 bg-white/20 text-white rounded-full text-[10px] font-black uppercase">
              {formattedTable}
            </span>
            <h2 className="text-base font-black mt-1">
              {isTamil ? "வணக்கம்! என்ன சாப்பிட விரும்புகிறீர்கள்?" : "Welcome! What would you like to order?"}
            </h2>
            <p className="text-[11px] text-orange-100 mt-0.5">
              {isTamil ? "மெனுவை தேர்ந்தெடுத்து ஆர்டர் செய்யலாம்" : "Add delicious items to cart & place order"}
            </p>
          </div>
          <UtensilsCrossed className="w-8 h-8 text-white/40 shrink-0" />
        </div>
      </div>

      {/* Search & Dietary Filters */}
      <div className="px-4 max-w-lg mx-auto space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isTamil ? "உணவைத் தேடுங்கள் (எ.கா: பிரியாணி, தோசை)..." : "Search dish (e.g. Biriyani, Dosa)..."}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
          />
        </div>

        {/* Dietary toggles */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setDietFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
              dietFilter === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            {isTamil ? "அனைத்தும்" : "All"}
          </button>
          <button
            type="button"
            onClick={() => setDietFilter("VEG")}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
              dietFilter === "VEG"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-emerald-700 border border-emerald-200"
            }`}
          >
            <span>🟢</span>
            <span>{isTamil ? "சைவம்" : "Pure Veg"}</span>
          </button>
          <button
            type="button"
            onClick={() => setDietFilter("NON_VEG")}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
              dietFilter === "NON_VEG"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-white text-rose-700 border border-rose-200"
            }`}
          >
            <span>🔴</span>
            <span>{isTamil ? "அசைவம்" : "Non-Veg"}</span>
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            type="button"
            onClick={() => setSelectedCat("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
              selectedCat === "ALL"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            {isTamil ? "அனைத்து வகைகள்" : "All Menu"}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCat(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                selectedCat === cat.id
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200"
              }`}
            >
              {isTamil && cat.nameTamil ? cat.nameTamil : cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Food Items List */}
      <div className="p-4 max-w-lg mx-auto space-y-3 mt-1">
        {loading ? (
          <div className="py-12 text-center text-slate-400 font-bold text-xs">
            {isTamil ? "மெனு தயாராகிறது..." : "Loading delicious menu..."}
          </div>
        ) : filteredFoods.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-bold text-xs">
            {isTamil ? "உணவுகள் எதுவும் கிடைக்கவில்லை" : "No dishes found"}
          </div>
        ) : (
          filteredFoods.map((food) => (
            <div
              key={food.id}
              className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">
                      {food.dietary === "NON_VEG" ? "🔴" : food.dietary === "EGG" ? "🟡" : "🟢"}
                    </span>
                    <h3 className="font-black text-sm text-slate-900">
                      {isTamil && food.nameTamil ? food.nameTamil : food.name}
                    </h3>
                  </div>
                  {isTamil && food.nameTamil && (
                    <p className="text-[10px] text-slate-400 font-semibold">{food.name}</p>
                  )}
                  {food.description && (
                    <p className="text-[11px] text-slate-500 leading-tight pt-0.5">{food.description}</p>
                  )}
                </div>

                {food.imageUrl && (
                  <img
                    src={food.imageUrl}
                    alt={food.name}
                    className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-100"
                  />
                )}
              </div>

              {/* Portions & Add Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                {food.portions.map((portion) => {
                  const cartEntry = cart.find(
                    (c) => c.foodItemId === food.id && c.portionId === portion.id
                  );
                  return (
                    <div
                      key={portion.id}
                      className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200/80 flex-1 min-w-[130px]"
                    >
                      <div>
                        <div className="text-[10px] font-bold text-slate-600 truncate">
                          {isTamil && portion.portionNameTamil
                            ? portion.portionNameTamil
                            : portion.portionName}
                        </div>
                        <div className="text-xs font-black text-slate-900 font-mono">
                          ₹{portion.price}
                        </div>
                      </div>

                      {cartEntry ? (
                        <div className="flex items-center gap-1 bg-white rounded-xl border border-orange-300 p-0.5 shadow-xs">
                          <button
                            type="button"
                            onClick={() => {
                              const idx = cart.findIndex(
                                (c) => c.foodItemId === food.id && c.portionId === portion.id
                              );
                              if (idx >= 0) updateQuantity(idx, -1);
                            }}
                            className="w-5 h-5 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-800 flex items-center justify-center text-xs font-black"
                          >
                            -
                          </button>
                          <span className="w-5 text-center text-xs font-black text-orange-950 font-mono">
                            {cartEntry.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(food, portion)}
                            className="w-5 h-5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-center text-xs font-black"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(food, portion)}
                          className="px-2.5 py-1 bg-white hover:bg-orange-50 border border-orange-300 text-orange-600 rounded-xl text-[11px] font-black shadow-xs active:scale-95 transition-all"
                        >
                          + {isTamil ? "சேர்" : "Add"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Bottom Cart Bar */}
      {cartItemCount > 0 && !showCartDrawer && (
        <div className="fixed bottom-4 inset-x-4 max-w-lg mx-auto z-40 animate-slide-up">
          <button
            type="button"
            onClick={() => setShowCartDrawer(true)}
            className="w-full p-3.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white rounded-3xl shadow-xl shadow-orange-500/30 flex items-center justify-between font-black active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-mono">
                {cartItemCount}
              </div>
              <div className="text-left text-xs leading-tight">
                <div>{isTamil ? "கார்ட் பார்க்க" : "View Cart"}</div>
                <div className="text-[10px] text-orange-100 font-normal">
                  {cart.length} {isTamil ? "வகைகள்" : "items"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-sm font-mono font-black">
              <span>₹{cartTotal.toLocaleString("en-IN")}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Cart Drawer Modal */}
      {showCartDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center">
          <div className="bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl max-w-lg w-full p-5 max-h-[85vh] flex flex-col space-y-4 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  {isTamil ? "உங்கள் ஆர்டர் பட்டியல்" : "Your Table Order"}
                </h3>
                <p className="text-xs text-orange-600 font-bold">{formattedTable}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCartDrawer(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Items Stepper */}
            <div className="overflow-y-auto flex-1 space-y-2.5 pr-1">
              {cart.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="font-black text-xs text-slate-900">{item.foodName}</div>
                    <div className="text-[10px] text-slate-500">
                      {item.portionName} • ₹{item.unitPrice}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-0.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(idx, -1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-black text-xs font-mono">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(idx, 1)}
                        className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-xs"
                      >
                        +
                      </button>
                    </div>

                    <div className="font-black text-xs text-slate-900 font-mono w-14 text-right">
                      ₹{item.unitPrice * item.quantity}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Guest Name / Phone (Optional) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={isTamil ? "உங்கள் பெயர் (Optional)" : "Your Name (Optional)"}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs"
                />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder={isTamil ? "மொபைல் எண் (Optional)" : "Phone (Optional)"}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs font-mono"
                />
              </div>
            </div>

            {/* Total & Submit Button */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-sm font-black">
                <span>{isTamil ? "மொத்த தொகை (Total)" : "Grand Total:"}</span>
                <span className="text-base text-orange-600 font-mono">
                  ₹{cartTotal.toLocaleString("en-IN")}
                </span>
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={submitting}
                className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <Send className="w-4 h-4" />
                <span>
                  {submitting 
                    ? (isTamil ? "ஆர்டர் அனுப்பப்படுகிறது..." : "Placing Order...") 
                    : (isTamil ? "🚀 சமையலறைக்கு ஆர்டர் அனுப்பு" : "🚀 Place Order to Kitchen")}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Success Popup */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-orange-200 shadow-2xl max-w-sm w-full p-6 text-center space-y-4 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-orange-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-black">
                {formattedTable}
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">
                {isTamil ? "ஆர்டர் வெற்றிகரமாக அனுப்பப்பட்டது! 🎉" : "Order Placed Successfully! 🎉"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Order #{orderSuccess.orderNumber} • ₹{orderSuccess.total}
              </p>
              <p className="text-[11px] text-slate-600 bg-orange-50/60 p-3 rounded-2xl border border-orange-100 mt-3">
                {isTamil 
                  ? "உங்கள் உணவு சமையலறையில் தயாராகிக்கொண்டிருக்கிறது. சுடச்சுட கொண்டு வரப்படும்!"
                  : "Kitchen staff is preparing your delicious food. It will be served shortly!"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOrderSuccess(null)}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-xs rounded-2xl shadow-md"
            >
              {isTamil ? "கூடுதல் உணவு ஆர்டர் செய்" : "Order More Items"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
