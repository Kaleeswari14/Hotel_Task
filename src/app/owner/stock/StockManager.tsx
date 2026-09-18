"use client";

import React, { useState } from "react";
import {
  Boxes,
  AlertTriangle,
  CheckCircle,
  PlusCircle,
  Search,
  Check,
  X,
  TrendingDown,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  Ban,
  Plus,
  Flame,
  Zap
} from "lucide-react";
import { formatHumanStock } from "@/lib/format";

interface StockItem {
  id: string;
  foodItemId: string;
  currentQuantity: number;
  minThreshold: number;
  unitName: string;
  foodItem: {
    id: string;
    name: string;
    categoryId: string;
    category: { id: string; name: string };
  };
}

interface StockManagerProps {
  initialStock: StockItem[];
}

const STANDARD_UNITS = [
  "Nos",
  "Plates",
  "Cups",
  "Sets",
  "Kg",
  "Grams",
  "Liters",
  "ml",
  "Packets",
  "Portions",
];

export default function StockManager({ initialStock }: StockManagerProps) {
  const [stockList, setStockList] = useState<StockItem[]>(initialStock);
  const [filter, setFilter] = useState<"all" | "low" | "out" | "ok">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modal for Restock / Adjust / Add Batch
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);
  const [adjustMode, setAdjustMode] = useState<"ADD" | "SET">("ADD");
  const [adjustQuantity, setAdjustQuantity] = useState("50");
  const [adjustThreshold, setAdjustThreshold] = useState("10");
  const [adjustUnit, setAdjustUnit] = useState("Nos");
  const [customUnit, setCustomUnit] = useState("");
  const [isCustomUnit, setIsCustomUnit] = useState(false);

  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Real-Time Auto Sync for Kitchen / POS stock changes
  React.useEffect(() => {
    const interval = setInterval(refreshStock, 3000);
    window.addEventListener("focus", refreshStock);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refreshStock);
    };
  }, []);

  const refreshStock = async () => {
    try {
      const res = await fetch("/api/stock");
      if (res.ok) {
        const data = await res.json();
        setStockList(data.stock);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 1-Click Manual Override: Set Stock to 0 (Mark as Out of Stock when kitchen runs out)
  const handleMarkOutOfStock = async (item: StockItem) => {
    const dishName = item.foodItem.name;
    const confirmMsg = `Did batter/stock run out for "${dishName}" in kitchen? Set stock to 0 immediately?`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockId: item.id,
          mode: "SET",
          quantity: 0,
        }),
      });
      if (!res.ok) throw new Error("Failed to update stock");
      showToast(`🚫 ${dishName} marked Out of Stock (0)!`);
      await refreshStock();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Quick Restock / Add Batch Shortcut (+30, +50, +100)
  const handleQuickAdd = async (item: StockItem, amount: number) => {
    const dishName = item.foodItem.name;
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockId: item.id,
          mode: "ADD",
          quantity: amount,
        }),
      });
      if (!res.ok) throw new Error("Failed to restock");
      showToast(`Added +${amount} ${item.unitName} to "${dishName}"!`);
      await refreshStock();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Open Full Modal for Batch / Exact Adjustment
  const openAdjustModal = (item: StockItem) => {
    setSelectedStock(item);
    setAdjustMode("ADD");
    setAdjustQuantity("50");
    setAdjustThreshold(String(item.minThreshold));
    if (STANDARD_UNITS.includes(item.unitName)) {
      setAdjustUnit(item.unitName);
      setIsCustomUnit(false);
      setCustomUnit("");
    } else {
      setAdjustUnit("CUSTOM");
      setIsCustomUnit(true);
      setCustomUnit(item.unitName);
    }
    setModalOpen(true);
  };

  // Save Modal Form
  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) return;

    const finalUnit = isCustomUnit ? (customUnit.trim() || "Nos") : adjustUnit;

    setLoading(true);
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockId: selectedStock.id,
          mode: adjustMode,
          quantity: parseFloat(adjustQuantity) || 0,
          minThreshold: parseFloat(adjustThreshold) || 5,
          unitName: finalUnit,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update stock");

      const dishName = selectedStock.foodItem.name;
      showToast(`Stock updated for ${dishName}!`);
      setModalOpen(false);
      setSelectedStock(null);
      await refreshStock();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Stats calculation
  const totalItems = stockList.length;
  const outOfStockItems = stockList.filter((s) => s.currentQuantity <= 0);
  const lowStockItems = stockList.filter((s) => s.currentQuantity > 0 && s.currentQuantity <= s.minThreshold);
  const inStockItems = stockList.filter((s) => s.currentQuantity > s.minThreshold);

  // Distinct categories
  const categories = Array.from(
    new Set(stockList.map((s) => JSON.stringify(s.foodItem.category)))
  ).map((c) => JSON.parse(c));

  // Filtered List
  const filteredList = stockList.filter((item) => {
    const isOut = item.currentQuantity <= 0;
    const isLow = item.currentQuantity > 0 && item.currentQuantity <= item.minThreshold;

    let matchesFilter = true;
    if (filter === "out") matchesFilter = isOut;
    else if (filter === "low") matchesFilter = isLow;
    else if (filter === "ok") matchesFilter = !isOut && !isLow;

    const matchesCat =
      categoryFilter === "all" || item.foodItem.categoryId === categoryFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      item.foodItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.foodItem.category.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-emerald-500 text-sm font-bold animate-slide-up">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Kitchen Batch &amp; Stock Tracking
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Estimate-based batch yields (Idly, Dosa, Rice), low-stock warnings &amp; 1-click Out of Stock override.
          </p>
        </div>

        <button
          onClick={refreshStock}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all border border-slate-300 flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* Overview Stat Banners */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          onClick={() => setFilter("all")}
          className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all ${
            filter === "all"
              ? "bg-slate-900 text-white border-slate-900 shadow-md"
              : "bg-white text-slate-900 border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider opacity-80">
              Tracked Dishes
            </span>
            <Boxes className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black mt-2">{totalItems}</div>
          <div className="text-xs opacity-70 mt-1">All menu items</div>
        </div>

        <div
          onClick={() => setFilter("out")}
          className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all ${
            filter === "out"
              ? "bg-red-600 text-white border-red-600 shadow-md"
              : outOfStockItems.length > 0
              ? "bg-red-50 text-red-900 border-red-300 hover:border-red-400"
              : "bg-white text-slate-900 border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider opacity-90">
              Out of Stock (0)
            </span>
            <Ban className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-3xl font-black mt-2">{outOfStockItems.length}</div>
          <div className="text-xs opacity-80 mt-1">
            {outOfStockItems.length > 0 ? "🚫 Blocked in POS" : "None out of stock"}
          </div>
        </div>

        <div
          onClick={() => setFilter("low")}
          className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all ${
            filter === "low"
              ? "bg-amber-600 text-white border-amber-600 shadow-md"
              : lowStockItems.length > 0
              ? "bg-amber-50 text-amber-900 border-amber-300 hover:border-amber-400"
              : "bg-white text-slate-900 border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider opacity-90">
              Low Stock Alerts
            </span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-black mt-2">{lowStockItems.length}</div>
          <div className="text-xs opacity-80 mt-1">
            {lowStockItems.length > 0 ? "⚠️ Prepare next batch" : "All batches good"}
          </div>
        </div>

        <div
          onClick={() => setFilter("ok")}
          className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all ${
            filter === "ok"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
              : "bg-white text-slate-900 border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider opacity-80">
              Healthy Stock
            </span>
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black mt-2">{inStockItems.length}</div>
          <div className="text-xs opacity-70 mt-1">Ready for orders</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              categoryFilter === "all"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                categoryFilter === c.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dish name..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Stock Inventory Table with 1-Click Out of Stock & Batch Buttons */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                <th className="p-4">Dish &amp; Category</th>
                <th className="p-4">Current Stock</th>
                <th className="p-4">Alert Limit</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Batch &amp; Stock Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredList.map((item) => {
                const isOut = item.currentQuantity <= 0;
                const isLow = !isOut && item.currentQuantity <= item.minThreshold;
                const dishName = item.foodItem.name;
                const catName = item.foodItem.category.name;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900 text-base">{dishName}</div>
                      <div className="text-xs text-slate-500 font-medium">{catName}</div>
                    </td>

                    <td className="p-4">
                      <div className={`font-black text-lg ${isOut ? "text-red-600" : isLow ? "text-amber-700" : "text-emerald-700"}`}>
                        {formatHumanStock(item.currentQuantity, item.unitName)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        ({item.currentQuantity} {item.unitName})
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="text-xs font-semibold text-slate-700">
                        {item.minThreshold} {item.unitName}
                      </div>
                      <div className="text-[10px] text-slate-400">Min. Threshold</div>
                    </td>

                    <td className="p-4">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-red-100 text-red-900 border border-red-300">
                          <Ban className="w-3.5 h-3.5 text-red-600" />
                          <span>OUT OF STOCK</span>
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                          <span>LOW STOCK ⚠️</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                          <span>IN STOCK</span>
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* 1-CLICK MANUAL OVERRIDE: Out of Stock button */}
                        {!isOut && (
                          <button
                            type="button"
                            onClick={() => handleMarkOutOfStock(item)}
                            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-700 text-xs font-black rounded-lg border border-red-200 hover:border-red-600 transition-all flex items-center gap-1 shadow-2xs"
                            title="Kitchen batter ran out? Click to set stock to 0"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Out of Stock</span>
                          </button>
                        )}

                        {/* Quick Batch Add Yield shortcuts */}
                        <button
                          onClick={() => handleQuickAdd(item, 30)}
                          className="px-2 py-1 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-800 text-xs font-bold rounded-lg border border-slate-200 transition-colors"
                          title="Add +30 batch yield"
                        >
                          +30
                        </button>
                        <button
                          onClick={() => handleQuickAdd(item, 50)}
                          className="px-2 py-1 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-800 text-xs font-bold rounded-lg border border-slate-200 transition-colors"
                          title="Add +50 batch yield"
                        >
                          +50
                        </button>
                        <button
                          onClick={() => handleQuickAdd(item, 100)}
                          className="px-2 py-1 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-800 text-xs font-bold rounded-lg border border-slate-200 transition-colors"
                          title="Add +100 batch yield"
                        >
                          +100
                        </button>

                        {/* Adjust / Custom Batch Modal Button */}
                        <button
                          onClick={() => openAdjustModal(item)}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-2xs transition-colors ml-1"
                          title="Custom Batch &amp; Stock Details"
                        >
                          <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No items match the current stock filter or search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock & Add Batch Modal */}
      {modalOpen && selectedStock && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  Update Batch &amp; Stock
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  {selectedStock.foodItem.name} &bull; Current:{" "}
                  <span className="font-bold text-slate-800">
                    {formatHumanStock(selectedStock.currentQuantity, selectedStock.unitName)}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStock} className="space-y-4">
              {/* Batch Action Mode: 1. ADD TO EXISTING vs 2. START FRESH (REPLACE) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Batch Update Method:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustMode("ADD")}
                    className={`py-2.5 px-2 text-xs font-bold rounded-xl border transition-all text-center ${
                      adjustMode === "ADD"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="font-black">+ Add to Current</div>
                    <div className="text-[10px] opacity-80">
                      Old + New Batch
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustMode("SET")}
                    className={`py-2.5 px-2 text-xs font-bold rounded-xl border transition-all text-center ${
                      adjustMode === "SET"
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="font-black">🔄 Start Fresh Batch</div>
                    <div className="text-[10px] opacity-80">
                      Replace with New Count
                    </div>
                  </button>
                </div>
              </div>

              {/* Quick Batch Yield Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {adjustMode === "ADD"
                    ? "Estimated Batch Yield to Add:"
                    : "Exact Count to Set:"}
                </label>

                <div className="flex items-center gap-1.5 mb-2">
                  {[30, 50, 100, 150, 200].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setAdjustQuantity(String(num))}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                        adjustQuantity === String(num)
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  step="1"
                  min="0"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Threshold & Unit Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Low Stock Alert At
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={adjustThreshold}
                    onChange={(e) => setAdjustThreshold(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Unit Name
                  </label>
                  <select
                    value={isCustomUnit ? "CUSTOM" : adjustUnit}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "CUSTOM") {
                        setIsCustomUnit(true);
                      } else {
                        setIsCustomUnit(false);
                        setAdjustUnit(val);
                      }
                    }}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {STANDARD_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                    <option value="CUSTOM">+ Custom Unit...</option>
                  </select>

                  {isCustomUnit && (
                    <input
                      type="text"
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      placeholder="Custom unit name"
                      className="w-full mt-1.5 px-3 py-1.5 bg-white border border-emerald-400 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      autoFocus
                      required
                    />
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    handleMarkOutOfStock(selectedStock);
                  }}
                  className="px-3 py-2 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600 text-xs font-bold rounded-xl transition-all"
                >
                  🚫 Set to 0 (Out of Stock)
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50"
                  >
                    {loading ? "..." : "Save Batch"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
