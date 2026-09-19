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
import { autoTranslateToTamil, useLanguage } from "@/context/LanguageContext";

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

interface MeasurementProfile {
  id: string;
  name: string;
  icon: string;
  defaultUnit: string;
  defaultStockType: "EXACT_COUNT" | "BATCH_ESTIMATE" | "NO_TRACKING";
  presets: { name: string; multiplier: number; label: string }[];
}

const MEASUREMENT_PROFILES: MeasurementProfile[] = [
  {
    id: "PLATES_RICE",
    name: "Rice / Biriyani / Meals",
    icon: "🍽️",
    defaultUnit: "Plates",
    defaultStockType: "NO_TRACKING",
    presets: [
      { name: "Full Plate", multiplier: 1.0, label: "Full Plate (1.0x)" },
      { name: "Half / 1/2 Plate", multiplier: 0.5, label: "1/2 Plate (0.5x)" },
      { name: "Quarter / 1/4 Plate", multiplier: 0.25, label: "1/4 Plate (0.25x)" },
      { name: "Family Pack / 2 Plates", multiplier: 2.0, label: "2 Plates (2.0x)" },
    ],
  },
  {
    id: "PIECES_COUNT",
    name: "Tiffin / Idly / Dosa / Snacks",
    icon: "🥟",
    defaultUnit: "Nos",
    defaultStockType: "NO_TRACKING",
    presets: [
      { name: "Single Piece", multiplier: 1.0, label: "Single (1 pc, 1.0x)" },
      { name: "Set (2 pcs)", multiplier: 2.0, label: "Set (2 pcs, 2.0x)" },
      { name: "Set (3 pcs)", multiplier: 3.0, label: "Set (3 pcs, 3.0x)" },
      { name: "Plate / Set", multiplier: 1.0, label: "1 Plate / Set (1.0x)" },
    ],
  },
  {
    id: "DRINKS_CUPS",
    name: "Tea / Coffee / Juice / Drinks",
    icon: "☕",
    defaultUnit: "Cups",
    defaultStockType: "NO_TRACKING",
    presets: [
      { name: "Regular Cup", multiplier: 1.0, label: "Regular Cup (1.0x)" },
      { name: "Cutting / Small", multiplier: 0.5, label: "Cutting / Small (0.5x)" },
      { name: "Large / Mug", multiplier: 1.5, label: "Large / Mug (1.5x)" },
      { name: "Flask (5 Cups)", multiplier: 5.0, label: "Flask (5 Cups, 5.0x)" },
    ],
  },
  {
    id: "BOWLS_GRAVY",
    name: "Curry / Gravy / Soups / Sides",
    icon: "🍲",
    defaultUnit: "Cups",
    defaultStockType: "NO_TRACKING",
    presets: [
      { name: "Regular Bowl", multiplier: 1.0, label: "Regular Bowl (1.0x)" },
      { name: "Half Bowl", multiplier: 0.5, label: "Half Bowl (0.5x)" },
      { name: "Full Container", multiplier: 2.0, label: "Full Container (2.0x)" },
    ],
  },
  {
    id: "CUSTOM_WEIGHT",
    name: "Kg / Grams / Packets",
    icon: "⚖️",
    defaultUnit: "Kg",
    defaultStockType: "NO_TRACKING",
    presets: [
      { name: "1 Kg", multiplier: 1.0, label: "1 Kg (1.0x)" },
      { name: "500 Grams (1/2 Kg)", multiplier: 0.5, label: "1/2 Kg (0.5x)" },
      { name: "250 Grams (1/4 Kg)", multiplier: 0.25, label: "1/4 Kg (0.25x)" },
      { name: "1 Packet", multiplier: 1.0, label: "1 Packet (1.0x)" },
    ],
  },
];

const getProfileForCategory = (catName?: string): MeasurementProfile => {
  if (!catName) return MEASUREMENT_PROFILES[0];
  const lower = catName.toLowerCase();
  if (
    lower.includes("rice") ||
    lower.includes("biriyani") ||
    lower.includes("briyani") ||
    lower.includes("meal") ||
    lower.includes("lunch")
  ) {
    return MEASUREMENT_PROFILES[0];
  }
  if (
    lower.includes("drink") ||
    lower.includes("tea") ||
    lower.includes("coffee") ||
    lower.includes("juice") ||
    lower.includes("beverage") ||
    lower.includes("shake") ||
    lower.includes("water")
  ) {
    return MEASUREMENT_PROFILES[2];
  }
  if (
    lower.includes("curry") ||
    lower.includes("gravy") ||
    lower.includes("soup") ||
    lower.includes("side")
  ) {
    return MEASUREMENT_PROFILES[3];
  }
  if (
    lower.includes("sweet") ||
    lower.includes("bakery") ||
    lower.includes("kg") ||
    lower.includes("snack pack")
  ) {
    return MEASUREMENT_PROFILES[4];
  }
  return MEASUREMENT_PROFILES[1];
};

const ALL_SESSIONS = ["MORNING", "AFTERNOON", "SNACKS", "NIGHT"];

export default function MenuManager({ initialCategories, initialFoods }: Props) {
  const { isTamil, getFoodName, getCategoryName, getPortionName } = useLanguage();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [foods, setFoods] = useState<FoodItem[]>(initialFoods);

  const [selectedCatId, setSelectedCatId] = useState<string>("all");
  const [selectedMealFilter, setSelectedMealFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Category Modal State
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryNameTamil, setCategoryNameTamil] = useState("");
  const [categoryOrder, setCategoryOrder] = useState("0");

  // Food Item Modal State
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [foodName, setFoodName] = useState("");
  const [foodNameTamil, setFoodNameTamil] = useState("");
  const [foodCategory, setFoodCategory] = useState(categories[0]?.id || "");
  const [measurementProfileId, setMeasurementProfileId] = useState<string>("PLATES_RICE");
  const [foodDescription, setFoodDescription] = useState("");
  const [foodDietary, setFoodDietary] = useState<"VEG" | "NON_VEG" | "EGG">("VEG");
  const [foodMealSessions, setFoodMealSessions] = useState<string[]>([]);
  const [stockType, setStockType] = useState<"EXACT_COUNT" | "BATCH_ESTIMATE" | "NO_TRACKING">("BATCH_ESTIMATE");
  const [foodInitialStock, setFoodInitialStock] = useState("");
  const [foodMinThreshold, setFoodMinThreshold] = useState("");
  const [foodUnitName, setFoodUnitName] = useState("Plates");
  const [customUnit, setCustomUnit] = useState("");
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [portions, setPortions] = useState<Portion[]>([
    { portionName: "Full Plate", unitMultiplier: 1.0, price: 0, packingCharge: 0 },
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

  // Active measurement profile
  const activeProfile =
    MEASUREMENT_PROFILES.find((p) => p.id === measurementProfileId) || MEASUREMENT_PROFILES[0];

  // Handle Category Change (auto-suggest measurement profile)
  const handleCategoryChange = (newCatId: string) => {
    setFoodCategory(newCatId);
    const cat = categories.find((c) => c.id === newCatId);
    if (cat) {
      const suggested = getProfileForCategory(cat.name);
      setMeasurementProfileId(suggested.id);
      setFoodUnitName(suggested.defaultUnit);
      setStockType(suggested.defaultStockType);
      setIsCustomUnit(false);
      setCustomUnit("");
      // If portion is empty or untouched default, switch to the new category's primary preset
      if (
        portions.length <= 1 &&
        (!portions[0]?.price ||
          !portions[0]?.portionName.trim() ||
          portions[0]?.portionName === "Full Plate" ||
          portions[0]?.portionName === "Regular Cup" ||
          portions[0]?.portionName === "Single Piece" ||
          portions[0]?.portionName === "Regular Bowl" ||
          portions[0]?.portionName === "1 Kg")
      ) {
        setPortions([
          {
            portionName: suggested.presets[0]?.name || "Regular",
            unitMultiplier: suggested.presets[0]?.multiplier || 1.0,
            price: portions[0]?.price || 0,
            packingCharge: 0,
          },
        ]);
      }
    }
  };

  // Handle Measurement Profile Change
  const handleProfileChange = (profId: string) => {
    setMeasurementProfileId(profId);
    const prof = MEASUREMENT_PROFILES.find((p) => p.id === profId);
    if (prof) {
      setFoodUnitName(prof.defaultUnit);
      setStockType(prof.defaultStockType);
      setIsCustomUnit(false);
      setCustomUnit("");
      // If portion is empty or untouched default, switch to the new profile's primary preset
      if (
        portions.length <= 1 &&
        (!portions[0]?.price ||
          !portions[0]?.portionName.trim() ||
          portions[0]?.portionName === "Full Plate" ||
          portions[0]?.portionName === "Regular Cup" ||
          portions[0]?.portionName === "Single Piece" ||
          portions[0]?.portionName === "Regular Bowl" ||
          portions[0]?.portionName === "1 Kg")
      ) {
        setPortions([
          {
            portionName: prof.presets[0]?.name || "Regular",
            unitMultiplier: prof.presets[0]?.multiplier || 1.0,
            price: portions[0]?.price || 0,
            packingCharge: 0,
          },
        ]);
      }
    }
  };

  // Portion helpers
  const handleAddPortion = () => {
    setPortions([
      ...portions,
      { portionName: "", unitMultiplier: 1.0, price: 0, packingCharge: 0 },
    ]);
  };

  const handleAddPresetPortion = (preset: { name: string; multiplier: number }) => {
    // If the only portion is empty, replace it
    if (portions.length === 1 && !portions[0].portionName.trim() && !portions[0].price) {
      setPortions([
        { portionName: preset.name, unitMultiplier: preset.multiplier, price: 0, packingCharge: 0 },
      ]);
      return;
    }
    setPortions([
      ...portions,
      { portionName: preset.name, unitMultiplier: preset.multiplier, price: 0, packingCharge: 0 },
    ]);
  };

  const handleRemovePortion = (idx: number) => {
    if (portions.length <= 1) {
      alert("At least one portion is required");
      return;
    }
    setPortions(portions.filter((_, i) => i !== idx));
  };

  const handlePortionChange = (idx: number, field: keyof Portion, value: any) => {
    setPortions(
      portions.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
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
    setCategoryNameTamil("");
    setCategoryOrder(String(categories.length + 1));
    setCatModalOpen(true);
  };

  // Open Edit Category Modal
  const openEditCategoryModal = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryNameTamil(cat.nameTamil || autoTranslateToTamil(cat.name));
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
          nameTamil: categoryNameTamil.trim() || autoTranslateToTamil(categoryName.trim()) || null,
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
    const firstCat = categories[0];
    const initialProf = firstCat ? getProfileForCategory(firstCat.name) : MEASUREMENT_PROFILES[0];

    setEditingFood(null);
    setFoodName("");
    setFoodNameTamil("");
    setFoodCategory(firstCat?.id || "");
    setMeasurementProfileId(initialProf.id);
    setFoodDescription("");
    setFoodDietary("VEG");
    setFoodMealSessions([]); // No default active session - user selects!
    setStockType(initialProf.defaultStockType);
    setFoodInitialStock(""); // Clean empty input
    setFoodMinThreshold(""); // Clean empty input
    setFoodUnitName(initialProf.defaultUnit);
    setIsCustomUnit(false);
    setCustomUnit("");
    setPortions([
      {
        portionName: initialProf.presets[0]?.name || "Full Plate",
        unitMultiplier: initialProf.presets[0]?.multiplier || 1.0,
        price: 0,
        packingCharge: 0,
      },
    ]);
    setFoodModalOpen(true);
  };

  // Open Edit Food Modal
  const openEditFoodModal = (food: FoodItem) => {
    setEditingFood(food);
    setFoodName(food.name);
    setFoodNameTamil(food.nameTamil || autoTranslateToTamil(food.name));
    setFoodCategory(food.categoryId);
    const cat = categories.find((c) => c.id === food.categoryId);
    const prof = getProfileForCategory(cat?.name);
    setMeasurementProfileId(prof.id);
    setFoodDescription(food.description || "");
    setFoodDietary(food.dietary || "VEG");
    setFoodMealSessions(
      food.mealTime === "ALL"
        ? ALL_SESSIONS
        : food.mealTime
        ? food.mealTime.split(",")
        : []
    );
    setStockType(food.stockType || "NO_TRACKING");
    setFoodInitialStock(food.stock ? String(food.stock.currentQuantity) : "");
    setFoodMinThreshold(food.stock ? String(food.stock.minThreshold) : "");

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
        nameTamil: foodNameTamil.trim() || autoTranslateToTamil(foodName.trim()) || null,
        categoryId: foodCategory,
        description: foodDescription.trim() || null,
        imageUrl: null,
        dietary: foodDietary,
        mealTime:
          foodMealSessions.length === 0
            ? "ALL"
            : foodMealSessions.length === ALL_SESSIONS.length
            ? "ALL"
            : foodMealSessions.join(","),
        stockType,
        initialStock: stockType === "NO_TRACKING" ? 0 : parseFloat(foodInitialStock) || 0,
        minThreshold: stockType === "NO_TRACKING" ? 0 : parseFloat(foodMinThreshold) || 5,
        unitName: finalUnit,
        portions: portions.map((p) => ({
          portionName: p.portionName.trim() || "Regular",
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
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/20"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            {isTamil ? "அனைத்து வகைகள்" : "All Categories"} ({foods.length})
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
                  {getCategoryName(cat)} ({count})
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
            <span>{isTamil ? "நேரம்:" : "Session:"}</span>
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
            {isTamil ? "அனைத்து நேரம்" : "All Times"}
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
              <span>
                {isTamil
                  ? session.id === "MORNING"
                    ? "காலை உணவு"
                    : session.id === "AFTERNOON"
                    ? "மதிய உணவு"
                    : session.id === "SNACKS"
                    ? "மாலை சிற்றுண்டி"
                    : "இரவு உணவு"
                  : session.label}
              </span>
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
                    {getCategoryName(item.category)}
                  </span>
                  {item.dietary === "NON_VEG" ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                      🔴 {isTamil ? "அசைவம்" : "Non-Veg"}
                    </span>
                  ) : item.dietary === "EGG" ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      🟡 {isTamil ? "முட்டை" : "Egg"}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      🟢 {isTamil ? "சைவம்" : "Veg"}
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

              {/* Dish Name - Pure Single Language */}
              <div>
                <h3 className="font-black text-slate-900 text-base leading-tight">
                  {getFoodName(item)}
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
                  {isTamil ? "அளவுகள் & விலைகள்:" : "Portions & Prices:"}
                </div>
                <div className="space-y-1">
                  {item.portions.map((p, pIdx) => (
                    <div
                      key={pIdx}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <span className="font-semibold text-slate-700">{getPortionName(p.portionName)}</span>
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
                      ♾️ {isTamil ? "உடனடி தயாரிப்பு" : "Unlimited Stock"}
                    </span>
                  ) : item.stock ? (
                    <div className="text-xs font-bold">
                      <span className="text-slate-400 text-[11px]">{isTamil ? "இருப்பு: " : "Stock: "}</span>
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
                  Category Name (English) *
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCategoryName(val);
                    if (!categoryNameTamil || categoryNameTamil === autoTranslateToTamil(categoryName)) {
                      setCategoryNameTamil(autoTranslateToTamil(val));
                    }
                  }}
                  placeholder="e.g. Tiffin, Biriyani, Meals, Beverages"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Tamil Name (தமிழ் பெயர்)</span>
                  <span className="text-[10px] text-emerald-600 font-medium">தானியங்கி மொழிபெயர்ப்பு</span>
                </label>
                <input
                  type="text"
                  value={categoryNameTamil}
                  onChange={(e) => setCategoryNameTamil(e.target.value)}
                  placeholder="எ.கா: பிரியாணி, டிபன், சாப்பாடு"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
      {/* ADD / EDIT FOOD DISH MODAL (WITH TAMIL SUPPORT) */}
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
              {/* 1. Basic Info: Name & Tamil Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dish Name (English) *
                  </label>
                  <input
                    type="text"
                    value={foodName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFoodName(val);
                      if (!foodNameTamil || foodNameTamil === autoTranslateToTamil(foodName)) {
                        setFoodNameTamil(autoTranslateToTamil(val));
                      }
                    }}
                    placeholder="e.g. Chicken Biriyani, Idly, Tea"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Tamil Name (தமிழ் பெயர்)</span>
                    <span className="text-[10px] text-emerald-600 font-medium">தானியங்கி பரிந்துரை</span>
                  </label>
                  <input
                    type="text"
                    value={foodNameTamil}
                    onChange={(e) => setFoodNameTamil(e.target.value)}
                    placeholder="எ.கா: சிக்கன் பிரியாணி, இட்லி, டீ"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Category & Measurement Profile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={foodCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {getCategoryName(c)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Measurement Profile
                  </label>
                  <select
                    value={measurementProfileId}
                    onChange={(e) => handleProfileChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {MEASUREMENT_PROFILES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.icon} {p.name}
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
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
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
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
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
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
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
                      ✨ Select All / All Day
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div>
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                      Portions & Pricing ({activeProfile.name})
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Enter quantity/portion name, stock measurement multiplier, and price (₹).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPortion}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-xs self-start sm:self-auto shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Portion Row</span>
                  </button>
                </div>

                {/* Quick Add Presets for the selected Measurement Profile */}
                <div>
                  <span className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    ⚡ Quick Add Measurement Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeProfile.presets.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleAddPresetPortion(preset)}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3 h-3 text-emerald-600" />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direct Editable Portion Rows */}
                <div className="space-y-2 pt-1">
                  {portions.map((portion, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
                    >
                      <div className="sm:col-span-6">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Portion / Size Name *
                        </label>
                        <input
                          type="text"
                          value={portion.portionName}
                          onChange={(e) => handlePortionChange(idx, "portionName", e.target.value)}
                          placeholder="e.g. Regular Cup, Full Plate, Set (2 pcs)"
                          className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Quantity (Qty) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            min="0.001"
                            value={portion.unitMultiplier || ""}
                            onChange={(e) =>
                              handlePortionChange(
                                idx,
                                "unitMultiplier",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="1"
                            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 pointer-events-none">
                            {foodUnitName}
                          </span>
                        </div>
                      </div>

                      <div className="sm:col-span-3 flex items-end gap-1.5">
                        <div className="flex-1">
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Rate / Price (₹) *
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                              ₹
                            </span>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={portion.price === 0 && !portion.portionName ? "" : portion.price}
                              onChange={(e) =>
                                handlePortionChange(
                                  idx,
                                  "price",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0"
                              className="w-full pl-6 pr-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              required
                            />
                          </div>
                        </div>

                        {portions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePortion(idx)}
                            className="p-2 mb-0.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Remove Portion"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Inventory Stock Management */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div>
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                      Kitchen Stock Tracking
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Select &quot;No Tracking&quot; for dishes made on-demand (Idly, Dosa, Tea, Juice).
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStockType("NO_TRACKING")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      stockType === "NO_TRACKING"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    ✨ No Tracking (Unlimited)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockType("EXACT_COUNT")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      stockType === "EXACT_COUNT"
                        ? "bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/20"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Exact Count (e.g. Bottles)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockType("BATCH_ESTIMATE")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      stockType === "BATCH_ESTIMATE"
                        ? "bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/20"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Batch Estimate (e.g. Biriyani)
                  </button>
                </div>

                {stockType === "NO_TRACKING" ? (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2">
                    <span className="text-base">🟢</span>
                    <span>
                      <strong>Unlimited (Always in Stock):</strong> No count needed! Best for continuous kitchen items like <strong>Idly, Dosa, Parotta, Tea, Coffee &amp; Fresh Juices</strong>.
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Initial Stock Quantity
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={foodInitialStock}
                        onChange={(e) => setFoodInitialStock(e.target.value)}
                        placeholder="e.g. 50"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Low Alert Threshold
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={foodMinThreshold}
                        onChange={(e) => setFoodMinThreshold(e.target.value)}
                        placeholder="e.g. 10"
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
