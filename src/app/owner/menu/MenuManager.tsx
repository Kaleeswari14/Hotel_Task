"use client";

import React, { useState } from "react";
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Tag,
  CheckCircle2,
  Clock,
  Zap,
  Sparkles,
  Search,
  Check,
  ChevronRight,
  Percent,
  Layers,
  ArrowUpDown,
  Flame,
  Utensils,
  PackageCheck,
  RotateCcw
} from "lucide-react";
import { formatCurrency, formatHumanStock } from "@/lib/format";

interface Portion {
  id?: string;
  portionName: string;
  portionNameTamil?: string | null;
  unitMultiplier: number;
  price: number;
  packingCharge?: number;
}

interface Stock {
  id?: string;
  currentQuantity: number;
  minThreshold: number;
  unitName: string;
}

interface Category {
  id: string;
  name: string;
  nameTamil?: string | null;
  displayOrder: number;
  _count?: { foodItems: number };
}

interface FoodItem {
  id: string;
  name: string;
  nameTamil?: string | null;
  categoryId: string;
  category: Category;
  description?: string | null;
  imageUrl?: string | null;
  dietary: "VEG" | "NON_VEG" | "EGG";
  mealTime: string; // "ALL" | comma-separated e.g. "MORNING,NIGHT"
  stockType: "EXACT_COUNT" | "BATCH_ESTIMATE" | "NO_TRACKING";
  isActive: boolean;
  portions: Portion[];
  stock: Stock | null;
}

interface Props {
  initialCategories: Category[];
  initialFoods: FoodItem[];
}

const MEAL_SESSIONS = [
  { id: "MORNING", label: "Morning Breakfast", icon: "🌅" },
  { id: "AFTERNOON", label: "Afternoon Lunch", icon: "☀️" },
  { id: "SNACKS", label: "Tea & Snacks", icon: "☕" },
  { id: "NIGHT", label: "Dinner / Night", icon: "🌙" },
];

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

const PORTION_PRESETS = [
  { name: "Full / Regular", multiplier: 1.0, label: "Full (1.0x)" },
  { name: "Half / 1/2 Plate", multiplier: 0.5, label: "1/2 Plate (0.5x)" },
  { name: "Quarter / 1/4 Plate", multiplier: 0.25, label: "1/4 Plate (0.25x)" },
  { name: "Double / 2 Plates", multiplier: 2.0, label: "2 Plates (2.0x)" },
  { name: "Set (2 pcs)", multiplier: 1.0, label: "Set (2 pcs)" },
  { name: "Single Piece", multiplier: 1.0, label: "Single Piece" },
];

const ALL_SESSIONS = ["MORNING", "AFTERNOON", "SNACKS", "NIGHT"];

export default function MenuManager({ initialCategories, initialFoods }: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [foods, setFoods] = useState<FoodItem[]>(initialFoods);

  const [selectedCatId, setSelectedCatId] = useState<string>("all");
  const [selectedMealFilter, setSelectedMealFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Category Modal State
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryOrder, setCategoryOrder] = useState("0");

  // Food Item Modal State
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [foodName, setFoodName] = useState("");
  const [foodCategory, setFoodCategory] = useState(categories[0]?.id || "");
  const [foodDescription, setFoodDescription] = useState("");
  const [foodDietary, setFoodDietary] = useState<"VEG" | "NON_VEG" | "EGG">("VEG");
  const [foodMealSessions, setFoodMealSessions] = useState<string[]>(ALL_SESSIONS);
  const [stockType, setStockType] = useState<"EXACT_COUNT" | "BATCH_ESTIMATE" | "NO_TRACKING">("EXACT_COUNT");
  const [foodInitialStock, setFoodInitialStock] = useState("30");
  const [foodMinThreshold, setFoodMinThreshold] = useState("8");
  const [foodUnitName, setFoodUnitName] = useState("Nos");
  const [customUnit, setCustomUnit] = useState("");
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [editingPortionIdx, setEditingPortionIdx] = useState<number | null>(null);
  const [portions, setPortions] = useState<Portion[]>([
    { portionName: "Full / Regular", unitMultiplier: 1.0, price: 60, packingCharge: 0 },
  ]);

  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Reload data from API
  const refreshData = async () => {
    try {
      const [catsRes, foodsRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/foods"),
      ]);
      if (catsRes.ok) setCategories(await catsRes.json());
      if (foodsRes.ok) setFoods(await foodsRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  // Portion helpers
  const handleAddPortion = () => {
    const newIdx = portions.length;
    setPortions([
      ...portions,
      { portionName: "Half / 1/2 Plate", unitMultiplier: 0.5, price: 40, packingCharge: 0 },
    ]);
    setEditingPortionIdx(newIdx);
  };

  const handleRemovePortion = (idx: number) => {
    if (portions.length <= 1) {
      alert("At least one portion is required");
      return;
    }
    setPortions(portions.filter((_, i) => i !== idx));
    if (editingPortionIdx === idx) {
      setEditingPortionIdx(null);
    } else if (editingPortionIdx !== null && editingPortionIdx > idx) {
      setEditingPortionIdx(editingPortionIdx - 1);
    }
  };

  const handlePortionChange = (idx: number, field: keyof Portion, value: any) => {
    setPortions(
      portions.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );
  };

  const applyPortionPreset = (idx: number, preset: { name: string; multiplier: number }) => {
    setPortions(
      portions.map((p, i) =>
        i === idx ? { ...p, portionName: preset.name, unitMultiplier: preset.multiplier } : p
      )
    );
  };

  // Meal session toggle
  const toggleMealSession = (sessionId: string) => {
    setFoodMealSessions((prev) =>
      prev.includes(sessionId)
        ? prev.filter((s) => s !== sessionId)
        : [...prev, sessionId]
    );
  };

  const selectAllMealSessions = () => {
    setFoodMealSessions(ALL_SESSIONS);
  };

  const clearMealSessions = () => {
    setFoodMealSessions([]);
  };

  // Open Add Category Modal
  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryOrder(String(categories.length + 1));
    setCatModalOpen(true);
  };

  // Open Edit Category Modal
  const openEditCategoryModal = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryOrder(String(cat.displayOrder || 0));
    setCatModalOpen(true);
  };

  // Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      alert("Category name is required");
      return;
    }

    setLoading(true);
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: categoryName.trim(),
          nameTamil: null,
          displayOrder: parseInt(categoryOrder, 10) || 0,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save category");
      }

      showToast(editingCategory ? "Category updated successfully!" : "Category added successfully!");
      setCatModalOpen(false);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}" and all its dishes?`)) return;

    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete category");
      showToast("Category deleted successfully!");
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Open Add Food Modal
  const openAddFoodModal = () => {
    if (categories.length === 0) {
      alert("Please add at least one category first!");
      openAddCategoryModal();
      return;
    }
    setEditingFood(null);
    setFoodName("");
    setFoodCategory(categories[0]?.id || "");
    setFoodDescription("");
    setFoodDietary("VEG");
    setFoodMealSessions(ALL_SESSIONS);
    setStockType("EXACT_COUNT");
    setFoodInitialStock("30");
    setFoodMinThreshold("8");
    setFoodUnitName("Nos");
    setIsCustomUnit(false);
    setCustomUnit("");
    setEditingPortionIdx(null);
    setPortions([
      { portionName: "Full / Regular", unitMultiplier: 1.0, price: 60, packingCharge: 0 },
    ]);
    setFoodModalOpen(true);
  };

  // Open Edit Food Modal
  const openEditFoodModal = (food: FoodItem) => {
    setEditingFood(food);
    setFoodName(food.name);
    setFoodCategory(food.categoryId);
    setFoodDescription(food.description || "");
    setFoodDietary(food.dietary || "VEG");
    setFoodMealSessions(
      food.mealTime === "ALL" || !food.mealTime
        ? ALL_SESSIONS
        : food.mealTime.split(",")
    );
    setStockType(food.stockType || "EXACT_COUNT");
    setFoodInitialStock(food.stock ? String(food.stock.currentQuantity) : "30");
    setFoodMinThreshold(food.stock ? String(food.stock.minThreshold) : "8");
    
    const existingUnit = food.stock ? food.stock.unitName : "Nos";
    if (STANDARD_UNITS.includes(existingUnit)) {
      setFoodUnitName(existingUnit);
      setIsCustomUnit(false);
      setCustomUnit("");
    } else {
      setFoodUnitName("CUSTOM");
      setIsCustomUnit(true);
      setCustomUnit(existingUnit);
    }

    setEditingPortionIdx(null);
    setPortions(
      food.portions.map((p) => ({
        id: p.id,
        portionName: p.portionName,
        unitMultiplier: p.unitMultiplier,
        price: p.price,
        packingCharge: p.packingCharge || 0,
      }))
    );
    setFoodModalOpen(true);
  };

  // Save Food Item
  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) {
      alert("Food name is required");
      return;
    }

    if (!foodCategory) {
      alert("Please select a category");
      return;
    }

    if (portions.length === 0) {
      alert("Please add at least one portion with price");
      return;
    }

    const finalUnit = isCustomUnit ? (customUnit.trim() || "Nos") : foodUnitName;

    setLoading(true);
    try {
      const payload = {
        name: foodName.trim(),
        nameTamil: null,
        categoryId: foodCategory,
        description: foodDescription.trim() || null,
        imageUrl: null,
        dietary: foodDietary,
        mealTime: foodMealSessions.length === ALL_SESSIONS.length ? "ALL" : foodMealSessions.join(","),
        stockType,
        initialStock: stockType === "NO_TRACKING" ? 0 : parseFloat(foodInitialStock) || 0,
        minThreshold: stockType === "NO_TRACKING" ? 0 : parseFloat(foodMinThreshold) || 5,
        unitName: finalUnit,
        portions: portions.map((p) => ({
          portionName: p.portionName.trim(),
          portionNameTamil: null,
          unitMultiplier: parseFloat(String(p.unitMultiplier)) || 1.0,
          price: parseFloat(String(p.price)) || 0,
          packingCharge: parseFloat(String(p.packingCharge || 0)) || 0,
        })),
      };

      const url = editingFood ? `/api/foods/${editingFood.id}` : "/api/foods";
      const method = editingFood ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save food dish");
      }

      showToast(editingFood ? "Food dish updated successfully!" : "Food dish created successfully!");
      setFoodModalOpen(false);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete Food Item
  const handleDeleteFood = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete dish "${name}"?`)) return;

    try {
      const res = await fetch(`/api/foods/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete food dish");
      showToast("Dish deleted successfully!");
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Quick Restock
  const handleQuickRestock = async (food: FoodItem, qtyToAdd: number) => {
    if (!food.stock) return;
    const newQty = food.stock.currentQuantity + qtyToAdd;
    try {
      const res = await fetch("/api/stock", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodItemId: food.id, quantity: newQty }),
      });
      if (res.ok) {
        showToast(`Stock updated: ${food.name} -> ${newQty} ${food.stock.unitName}`);
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter Foods
  const filteredFoods = foods.filter((f) => {
    const matchesCat = selectedCatId === "all" || f.categoryId === selectedCatId;
    const matchesMeal =
      selectedMealFilter === "all" ||
      !f.mealTime ||
      f.mealTime === "ALL" ||
      f.mealTime.includes(selectedMealFilter);
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      f.name.toLowerCase().includes(query) ||
      f.category.name.toLowerCase().includes(query);
    return matchesCat && matchesMeal && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto w-full p-3 sm:p-5 lg:p-6 space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-500 text-sm font-bold animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <UtensilsCrossed className="w-6 h-6 text-emerald-600" />
            <span>Food & Menu Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Manage your restaurant categories, dishes, portion pricing, and inventory.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={openAddCategoryModal}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Tag className="w-4 h-4 text-slate-600" />
            <span>Add Category</span>
          </button>

          <button
            type="button"
            onClick={openAddFoodModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-emerald-700/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Dish</span>
          </button>
        </div>
      </div>

      {/* Search & Filtering Suite */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dishes by name (e.g. Dosa, Biriyani, Meals, Coffee)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCatId("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCatId === "all"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            All Categories ({foods.length})
          </button>

          {categories.map((cat) => {
            const count = foods.filter((f) => f.categoryId === cat.id).length;
            return (
              <div key={cat.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`px-3 py-1.5 rounded-l-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCatId === cat.id
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {cat.name} ({count})
                </button>
                <button
                  type="button"
                  onClick={() => openEditCategoryModal(cat)}
                  className={`px-1.5 py-1.5 rounded-r-xl border-l border-white/20 text-xs transition-all ${
                    selectedCatId === cat.id
                      ? "bg-emerald-700 text-white"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-600"
                  }`}
                  title="Edit Category"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Meal Session Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1 flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Session:</span>
          </span>

          <button
            type="button"
            onClick={() => setSelectedMealFilter("all")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              selectedMealFilter === "all"
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Times
          </button>

          {MEAL_SESSIONS.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => setSelectedMealFilter(session.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                selectedMealFilter === session.id
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>{session.icon}</span>
              <span>{session.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dishes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredFoods.map((item) => {
          const isLowStock = item.stock ? item.stock.currentQuantity <= item.stock.minThreshold : false;
          const isOutOfStock = item.stock ? item.stock.currentQuantity <= 0 : false;
          const isNoTracking = item.stockType === "NO_TRACKING";

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between p-4 space-y-3"
            >
              {/* Header: Category & Action Buttons */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black uppercase text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                    {item.category.name}
                  </span>
                  {item.dietary === "NON_VEG" ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                      🔴 Non-Veg
                    </span>
                  ) : item.dietary === "EGG" ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      🟡 Egg
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      🟢 Veg
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditFoodModal(item)}
                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Edit Dish"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteFood(item.id, item.name)}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Dish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Dish Name */}
              <div>
                <h3 className="font-black text-slate-900 text-base leading-tight">
                  {item.name}
                </h3>
                {item.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Portions & Pricing List */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Portions & Prices:
                </div>
                <div className="space-y-1">
                  {item.portions.map((p, pIdx) => (
                    <div
                      key={pIdx}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <span className="font-semibold text-slate-700">{p.portionName}</span>
                      <span className="font-black text-slate-900">{formatCurrency(p.price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inventory Stock Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {isNoTracking ? (
                    <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                      ♾️ Unlimited Stock
                    </span>
                  ) : item.stock ? (
                    <div className="text-xs font-bold">
                      <span className="text-slate-400 text-[11px]">Stock: </span>
                      <span
                        className={
                          isOutOfStock
                            ? "text-red-600 font-black"
                            : isLowStock
                            ? "text-amber-600 font-black"
                            : "text-emerald-700 font-black"
                        }
                      >
                        {formatHumanStock(item.stock.currentQuantity, item.stock.unitName)}
                      </span>
                    </div>
                  ) : null}
                </div>

                {!isNoTracking && item.stock && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleQuickRestock(item, 10)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      title="Quick Add 10"
                    >
                      +10
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickRestock(item, 25)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      title="Quick Add 25"
                    >
                      +25
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {filteredFoods.length === 0 && (
          <div className="col-span-full bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-500 space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <Utensils className="w-8 h-8" />
            </div>
            <div>
              <div className="font-black text-slate-900 text-lg">No dishes found</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Click the button below to add your first restaurant food dish.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddFoodModal}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-700/20 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Dish</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ADD / EDIT CATEGORY MODAL */}
      {/* ========================================================================= */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span>{editingCategory ? "Edit Category" : "Add New Category"}</span>
              </h2>
              <button
                type="button"
                onClick={() => setCatModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Tiffin, Biriyani, Meals, Beverages"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={categoryOrder}
                  onChange={(e) => setCategoryOrder(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {loading ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT FOOD DISH MODAL (PURE ENGLISH & NO PICTURE REQUIRED) */}
      {/* ========================================================================= */}
      {foodModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 animate-scale-up space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
                <span>{editingFood ? "Edit Food Dish" : "Add New Food Dish"}</span>
              </h2>
              <button
                type="button"
                onClick={() => setFoodModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFood} className="space-y-4">
              {/* 1. Basic Info: Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    placeholder="e.g. Ghee Roast Dosa"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={foodCategory}
                    onChange={(e) => setFoodCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. Dietary Classification */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Dietary Classification
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFoodDietary("VEG")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      foodDietary === "VEG"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>🟢</span>
                    <span>Veg</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFoodDietary("NON_VEG")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      foodDietary === "NON_VEG"
                        ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>🔴</span>
                    <span>Non-Veg</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFoodDietary("EGG")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      foodDietary === "EGG"
                        ? "bg-amber-400 text-slate-950 border-amber-400 shadow-sm font-black"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>🟡</span>
                    <span>Egg</span>
                  </button>
                </div>
              </div>

              {/* 3. Meal Timing Sessions */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Meal Timing Sessions (When is this dish served?)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={selectAllMealSessions}
                      className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      ✨ All Day (All Sessions)
                    </button>
                    <button
                      type="button"
                      onClick={clearMealSessions}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {MEAL_SESSIONS.map((session) => {
                    const active = foodMealSessions.includes(session.id);
                    return (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => toggleMealSession(session.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                          active
                            ? "bg-emerald-50 text-emerald-950 border-emerald-500 ring-2 ring-emerald-500 font-bold shadow-xs"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 opacity-60"
                        }`}
                      >
                        <span className="text-xl mb-0.5">{session.icon}</span>
                        <span className="text-xs">{session.label}</span>
                        {active && (
                          <span className="text-[10px] font-black text-emerald-600 mt-0.5">
                            ✓ Active
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Portions & Pricing Row */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div>
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                      Portions & Pricing (₹)
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Click &quot;Edit&quot; on any portion to modify measurement & price.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPortion}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Portion</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {portions.map((portion, idx) => {
                    const isEditing = editingPortionIdx === idx;

                    if (isEditing) {
                      return (
                        <div
                          key={idx}
                          className="bg-white p-3.5 rounded-xl border-2 border-emerald-500 shadow-sm space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                              <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
                              Editing Portion #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingPortionIdx(null)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Done / Lock</span>
                            </button>
                          </div>

                          {/* Quick Presets */}
                          <div>
                            <span className="block text-[11px] font-bold text-slate-600 mb-1">
                              Quick Measurement Presets:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {PORTION_PRESETS.map((preset, pIdx) => (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={() => applyPortionPreset(idx, preset)}
                                  className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                                    portion.portionName === preset.name ||
                                    portion.unitMultiplier === preset.multiplier
                                      ? "bg-emerald-100 text-emerald-900 border-emerald-400 font-black"
                                      : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                                  }`}
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Editable Fields */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                            <div className="sm:col-span-4">
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Portion Name *
                              </label>
                              <input
                                type="text"
                                value={portion.portionName}
                                onChange={(e) => handlePortionChange(idx, "portionName", e.target.value)}
                                placeholder="e.g. 1/2 Plate, Full, Single"
                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                required
                              />
                            </div>

                            <div className="sm:col-span-3">
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Measurement Multiplier
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.05"
                                  min="0.01"
                                  value={portion.unitMultiplier}
                                  onChange={(e) =>
                                    handlePortionChange(
                                      idx,
                                      "unitMultiplier",
                                      parseFloat(e.target.value) || 1.0
                                    )
                                  }
                                  placeholder="1.0"
                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                  required
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 pointer-events-none">
                                  x stock
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 leading-none">
                                {portion.unitMultiplier === 0.5
                                  ? "Deducts 0.5 unit (Half plate)"
                                  : portion.unitMultiplier === 0.25
                                  ? "Deducts 0.25 unit (Quarter)"
                                  : portion.unitMultiplier === 2.0
                                  ? "Deducts 2 units (Double)"
                                  : `Deducts ${portion.unitMultiplier} unit(s)`}
                              </span>
                            </div>

                            <div className="sm:col-span-3">
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Price (₹) *
                              </label>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                  ₹
                                </span>
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={portion.price}
                                  onChange={(e) =>
                                    handlePortionChange(
                                      idx,
                                      "price",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  placeholder="Price"
                                  className="w-full pl-5 pr-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                  required
                                />
                              </div>
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Packing (₹)
                              </label>
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={portion.packingCharge || 0}
                                onChange={(e) =>
                                  handlePortionChange(
                                    idx,
                                    "packingCharge",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="0"
                                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Locked View Mode
                    return (
                      <div
                        key={idx}
                        className="bg-white p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-slate-900 truncate">
                              {portion.portionName}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded border border-emerald-200">
                                📏 {portion.unitMultiplier}x Stock Deduction
                              </span>
                              {portion.packingCharge ? (
                                <span className="text-[10px] text-slate-500 font-semibold">
                                  +₹{portion.packingCharge} pack
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-sm font-black text-slate-900">
                              ₹{portion.price}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setEditingPortionIdx(idx)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border border-slate-200 cursor-pointer"
                            title="Edit Portion"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {portions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePortion(idx)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Portion"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5. Inventory Stock Management */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Inventory & Stock Tracking
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStockType("EXACT_COUNT")}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      stockType === "EXACT_COUNT"
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Exact Count
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockType("BATCH_ESTIMATE")}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      stockType === "BATCH_ESTIMATE"
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Batch Estimate
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockType("NO_TRACKING")}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      stockType === "NO_TRACKING"
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    No Tracking (Unlimited)
                  </button>
                </div>

                {stockType !== "NO_TRACKING" && (
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Initial Stock
                      </label>
                      <input
                        type="number"
                        value={foodInitialStock}
                        onChange={(e) => setFoodInitialStock(e.target.value)}
                        placeholder="30"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Low Alert Threshold
                      </label>
                      <input
                        type="number"
                        value={foodMinThreshold}
                        onChange={(e) => setFoodMinThreshold(e.target.value)}
                        placeholder="8"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Unit Name
                      </label>
                      <select
                        value={isCustomUnit ? "CUSTOM" : foodUnitName}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "CUSTOM") {
                            setIsCustomUnit(true);
                          } else {
                            setIsCustomUnit(false);
                            setFoodUnitName(val);
                          }
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
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
                          placeholder="Type custom unit (e.g. Bun, Bowl)"
                          className="w-full mt-1.5 px-3 py-1.5 bg-white border border-emerald-400 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          autoFocus
                          required
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFoodModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-emerald-700/20 transition-all cursor-pointer"
                >
                  {loading ? "Saving..." : editingFood ? "Update Food Dish" : "Save Food Dish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
