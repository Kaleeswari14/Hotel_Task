"use client";

import React, { useState } from "react";
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Edit2,
  Layers,
  Sparkles,
  Check,
  X,
  AlertCircle,
  Search,
  IndianRupee,
  Boxes,
  Image as ImageIcon
} from "lucide-react";
import { formatCurrency, formatHumanStock } from "@/lib/format";
import { translateEnglishToTamil } from "@/lib/tamil-translator";
import { useLanguage } from "@/context/LanguageContext";

interface Portion {
  id?: string;
  portionName: string;
  portionNameTamil?: string | null;
  unitMultiplier: number;
  price: number;
  packingCharge?: number;
  isActive?: boolean;
}

interface FoodItem {
  id: string;
  name: string;
  nameTamil?: string | null;
  categoryId: string;
  description: string | null;
  imageUrl: string | null;
  dietary?: "VEG" | "NON_VEG" | "EGG" | string;
  mealTime?: string;
  stockType?: "EXACT_COUNT" | "BATCH_ESTIMATE" | "NO_TRACKING";
  isActive: boolean;
  category: { id: string; name: string; nameTamil?: string | null };
  portions: Portion[];
  stock: {
    id: string;
    currentQuantity: number;
    minThreshold: number;
    unitName: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
  nameTamil?: string | null;
  displayOrder: number;
  isActive: boolean;
}

const SOUTH_INDIAN_PHOTOS = [
  {
    name: "Dosa (தோசை)",
    url: "/images/dishes/dosa.jpg",
    icon: "🥞",
    defaultNameEn: "Plain / Ghee Roast Dosa",
    defaultNameTa: "நெய் ரோஸ்ட் தோசை",
    presetType: "dosa_nos",
    unitName: "Nos",
    mealSessions: ["MORNING", "NIGHT"],
    portions: [
      { portionName: "Single Dosa", portionNameTamil: "சிங்கிள் தோசை", unitMultiplier: 1.0, price: 70 },
      { portionName: "Special Dosa", portionNameTamil: "ஸ்பெஷல் தோசை", unitMultiplier: 1.0, price: 90 },
    ],
  },
  {
    name: "Masala Dosa (மசால்)",
    url: "/images/dishes/masala_dosa.jpg",
    icon: "🥞",
    defaultNameEn: "Masala Dosa",
    defaultNameTa: "மசால் தோசை",
    presetType: "dosa_nos",
    unitName: "Nos",
    mealSessions: ["MORNING", "NIGHT"],
    portions: [
      { portionName: "Single Dosa", portionNameTamil: "சிங்கிள் தோசை", unitMultiplier: 1.0, price: 85 },
      { portionName: "Special Masala", portionNameTamil: "ஸ்பெஷல் மசால்", unitMultiplier: 1.0, price: 105 },
    ],
  },
  {
    name: "Idly (இட்லி)",
    url: "/images/dishes/idly.jpg",
    icon: "🥟",
    defaultNameEn: "Idly Sambar",
    defaultNameTa: "இட்லி சாம்பார்",
    presetType: "idly_pieces",
    unitName: "Pieces",
    mealSessions: ["MORNING", "NIGHT"],
    portions: [
      { portionName: "1 Piece", portionNameTamil: "1 எண்", unitMultiplier: 0.5, price: 20 },
      { portionName: "1 Set (2 Pcs)", portionNameTamil: "1 செட் (2 எண்)", unitMultiplier: 1.0, price: 40 },
      { portionName: "Plate (3 Pcs)", portionNameTamil: "பிளேட் (3 எண்)", unitMultiplier: 1.5, price: 60 },
    ],
  },
  {
    name: "Poori Masala (பூரி)",
    url: "/images/dishes/poori_masala.jpg",
    icon: "🥟",
    defaultNameEn: "Poori Masala (2 Pcs)",
    defaultNameTa: "பூரி மசால் (2 எண்)",
    presetType: "poori_sets",
    unitName: "Sets",
    mealSessions: ["MORNING", "NIGHT"],
    portions: [
      { portionName: "1 Set (2 Pcs)", portionNameTamil: "1 செட் (2 பூரி)", unitMultiplier: 1.0, price: 60 },
      { portionName: "Extra Poori (1 Pc)", portionNameTamil: "கூடுதல் பூரி (1 எண்)", unitMultiplier: 0.5, price: 30 },
    ],
  },
  {
    name: "Parotta (பரோட்டா)",
    url: "/images/dishes/parotta.jpg",
    icon: "🫓",
    defaultNameEn: "Parotta & Salna (2 Pcs)",
    defaultNameTa: "பரோட்டா சால்னா (2 எண்)",
    presetType: "idly_pieces",
    unitName: "Pieces",
    mealSessions: ["NIGHT", "AFTERNOON"],
    portions: [
      { portionName: "1 Piece", portionNameTamil: "1 பரோட்டா", unitMultiplier: 0.5, price: 25 },
      { portionName: "1 Set (2 Pcs)", portionNameTamil: "1 செட் (2 பரோட்டா)", unitMultiplier: 1.0, price: 50 },
      { portionName: "Plate (3 Pcs)", portionNameTamil: "பிளேட் (3 பரோட்டா)", unitMultiplier: 1.5, price: 75 },
    ],
  },
  {
    name: "Chapati (சப்பாத்தி)",
    url: "/images/dishes/chapati.jpg",
    icon: "🫓",
    defaultNameEn: "Chapati Kurma (2 Pcs)",
    defaultNameTa: "சப்பாத்தி குருமா (2 எண்)",
    presetType: "poori_sets",
    unitName: "Sets",
    mealSessions: ["NIGHT", "AFTERNOON"],
    portions: [
      { portionName: "1 Set (2 Pcs)", portionNameTamil: "1 செட் (2 சப்பாத்தி)", unitMultiplier: 1.0, price: 60 },
      { portionName: "Single Chapati", portionNameTamil: "சிங்கிள் சப்பாத்தி", unitMultiplier: 0.5, price: 30 },
    ],
  },
  {
    name: "Fresh Juice (ஜூஸ்)",
    url: "/images/dishes/fresh_juice.jpg",
    icon: "🥤",
    defaultNameEn: "Fresh Fruit Juice",
    defaultNameTa: "பழச்சாறு / ஜூஸ்",
    presetType: "juice_glass",
    unitName: "Glasses",
    mealSessions: ["ALL"],
    portions: [
      { portionName: "1 Regular Glass", portionNameTamil: "1 கிளாஸ்", unitMultiplier: 1.0, price: 50 },
      { portionName: "Large / Special", portionNameTamil: "ஸ்பெஷல் பெரிய கிளாஸ்", unitMultiplier: 1.5, price: 80 },
    ],
  },
  {
    name: "Tea (டீ)",
    url: "/images/dishes/tea.jpg",
    icon: "🍵",
    defaultNameEn: "Cardamom Tea",
    defaultNameTa: "ஏலக்காய் டீ",
    presetType: "tea_cup",
    unitName: "Cups",
    mealSessions: ["MORNING", "SNACKS", "NIGHT"],
    portions: [
      { portionName: "1 Cup", portionNameTamil: "1 கப்", unitMultiplier: 1.0, price: 15 },
      { portionName: "Special / Strong", portionNameTamil: "ஸ்பெஷல் ஸ்ட்ராங்", unitMultiplier: 1.0, price: 20 },
    ],
  },
  {
    name: "Filter Coffee (காபி)",
    url: "/images/dishes/coffee.jpg",
    icon: "☕",
    defaultNameEn: "Madras Filter Coffee",
    defaultNameTa: "மெட்ராஸ் ஃபில்டர் காபி",
    presetType: "tea_cup",
    unitName: "Cups",
    mealSessions: ["MORNING", "SNACKS", "NIGHT"],
    portions: [
      { portionName: "1 Cup", portionNameTamil: "1 கப்", unitMultiplier: 1.0, price: 25 },
      { portionName: "Special Degree Coffee", portionNameTamil: "ஸ்பெஷல் டிகிரி காபி", unitMultiplier: 1.0, price: 35 },
    ],
  },
  {
    name: "Meals (சாப்பாடு)",
    url: "/images/dishes/meals.jpg",
    icon: "🍱",
    defaultNameEn: "South Indian Meals",
    defaultNameTa: "தென்னிந்திய சாப்பாடு",
    presetType: "meals_thali",
    unitName: "Meals",
    mealSessions: ["AFTERNOON"],
    portions: [
      { portionName: "Dine-in Meals", portionNameTamil: "முழு சாப்பாடு (Dine-in)", unitMultiplier: 1.0, price: 110 },
      { portionName: "Parcel Meals", portionNameTamil: "பார்சல் சாப்பாடு (Parcel)", unitMultiplier: 1.0, price: 120 },
    ],
  },
  {
    name: "Chicken Biriyani (பிரியாணி)",
    url: "/images/dishes/chicken_biriyani.jpg",
    icon: "🍚",
    defaultNameEn: "Chicken Biriyani",
    defaultNameTa: "சிக்கன் பிரியாணி",
    presetType: "biriyani_plate",
    unitName: "Plates",
    mealSessions: ["AFTERNOON", "NIGHT"],
    portions: [
      { portionName: "1/4 Plate", portionNameTamil: "கால் பிளேட்", unitMultiplier: 0.25, price: 65 },
      { portionName: "1/2 Plate", portionNameTamil: "அரை பிளேட்", unitMultiplier: 0.5, price: 120 },
      { portionName: "1 Plate", portionNameTamil: "முழு பிளேட்", unitMultiplier: 1.0, price: 210 },
    ],
  },
  {
    name: "Mutton Biriyani",
    url: "/images/dishes/mutton_biriyani.jpg",
    icon: "🍚",
    defaultNameEn: "Mutton Biriyani",
    defaultNameTa: "மட்டன் பிரியாணி",
    presetType: "biriyani_plate",
    unitName: "Plates",
    mealSessions: ["AFTERNOON", "NIGHT"],
    portions: [
      { portionName: "1/2 Plate", portionNameTamil: "அரை பிளேட்", unitMultiplier: 0.5, price: 180 },
      { portionName: "1 Plate", portionNameTamil: "முழு பிளேட்", unitMultiplier: 1.0, price: 320 },
    ],
  },
  {
    name: "Chicken 65",
    url: "/images/dishes/chicken_65.jpg",
    icon: "🍗",
    defaultNameEn: "Chicken 65",
    defaultNameTa: "சிக்கன் 65",
    presetType: "starters_plate",
    unitName: "Plates",
    mealSessions: ["AFTERNOON", "SNACKS", "NIGHT"],
    portions: [
      { portionName: "Half Plate (100g)", portionNameTamil: "அரை பிளேட் (100g)", unitMultiplier: 0.5, price: 90 },
      { portionName: "Full Plate (200g)", portionNameTamil: "முழு பிளேட் (200g)", unitMultiplier: 1.0, price: 170 },
    ],
  },
  {
    name: "Fried Rice",
    url: "/images/dishes/fried_rice.jpg",
    icon: "🍛",
    defaultNameEn: "Veg / Egg Fried Rice",
    defaultNameTa: "பிரைட் ரைஸ்",
    presetType: "rice_portion",
    unitName: "Plates",
    mealSessions: ["AFTERNOON", "NIGHT"],
    portions: [
      { portionName: "Half Plate", portionNameTamil: "அரை பிளேட்", unitMultiplier: 0.5, price: 80 },
      { portionName: "Full Plate", portionNameTamil: "முழு பிளேட்", unitMultiplier: 1.0, price: 140 },
    ],
  },
  {
    name: "Noodles",
    url: "/images/dishes/noodles.jpg",
    icon: "🍜",
    defaultNameEn: "Veg / Chicken Noodles",
    defaultNameTa: "நூடுல்ஸ்",
    presetType: "rice_portion",
    unitName: "Plates",
    mealSessions: ["AFTERNOON", "NIGHT"],
    portions: [
      { portionName: "Half Plate", portionNameTamil: "அரை பிளேட்", unitMultiplier: 0.5, price: 80 },
      { portionName: "Full Plate", portionNameTamil: "முழு பிளேட்", unitMultiplier: 1.0, price: 140 },
    ],
  },
  {
    name: "Paneer / Gravy",
    url: "/images/dishes/paneer_butter_masala.jpg",
    icon: "🍲",
    defaultNameEn: "Paneer Butter Masala",
    defaultNameTa: "பன்னீர் பட்டர் மசாலா",
    presetType: "gravy_cup",
    unitName: "Cups",
    mealSessions: ["AFTERNOON", "NIGHT"],
    portions: [
      { portionName: "Single Cup", portionNameTamil: "1 கப்", unitMultiplier: 1.0, price: 130 },
      { portionName: "Family Pack", portionNameTamil: "பெரிய கப் (Family)", unitMultiplier: 2.0, price: 240 },
    ],
  },
];

const PORTION_PRESETS = [
  { key: "dosa_nos", label: "🥞 Dosa (Nos)" },
  { key: "idly_pieces", label: "🥟 Idly / Parotta (Pieces)" },
  { key: "poori_sets", label: "🥟 Poori / Chapati (Sets)" },
  { key: "juice_glass", label: "🥤 Juice (Glasses)" },
  { key: "tea_cup", label: "☕ Tea / Coffee (Cups)" },
  { key: "meals_thali", label: "🍱 Meals (Thali)" },
  { key: "biriyani_plate", label: "🍚 Biriyani / Rice (Plates)" },
  { key: "starters_plate", label: "🍗 Starters / 65 (Plates)" },
  { key: "gravy_cup", label: "🍲 Gravy (Cups)" },
];

const MEAL_SESSIONS = [
  { id: "MORNING", labelEn: "Breakfast / Morning", labelTa: "காலை உணவு", icon: "🌅", time: "6:00 AM - 11:30 AM" },
  { id: "AFTERNOON", labelEn: "Lunch", labelTa: "மதிய உணவு", icon: "☀️", time: "11:30 AM - 4:00 PM" },
  { id: "SNACKS", labelEn: "Tea / Snacks", labelTa: "மாலை / டீ & ஸ்நாக்ஸ்", icon: "☕", time: "4:00 PM - 7:00 PM" },
  { id: "NIGHT", labelEn: "Dinner", labelTa: "இரவு உணவு", icon: "🌙", time: "7:00 PM - 11:30 PM" },
];

interface MenuManagerProps {
  initialCategories: Category[];
  initialFoods: FoodItem[];
}

export default function MenuManager({ initialCategories, initialFoods }: MenuManagerProps) {
  const { language, setLanguage, isTamil, t } = useLanguage();
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
  const [foodDescription, setFoodDescription] = useState("");
  const [foodImageUrl, setFoodImageUrl] = useState("");
  const [foodDietary, setFoodDietary] = useState<"VEG" | "NON_VEG" | "EGG">("VEG");
  const [foodMealSessions, setFoodMealSessions] = useState<string[]>(["MORNING", "NIGHT"]);
  const [stockType, setStockType] = useState<"EXACT_COUNT" | "BATCH_ESTIMATE" | "NO_TRACKING">("EXACT_COUNT");
  const [foodInitialStock, setFoodInitialStock] = useState("30");
  const [foodMinThreshold, setFoodMinThreshold] = useState("8");
  const [foodUnitName, setFoodUnitName] = useState("Nos");
  const [activePresetKey, setActivePresetKey] = useState<string>("dosa_nos");
  const [portions, setPortions] = useState<Portion[]>([
    { portionName: "Single Dosa", portionNameTamil: "சிங்கிள் தோசை", unitMultiplier: 1.0, price: 70, packingCharge: 0 },
    { portionName: "Special Dosa", portionNameTamil: "ஸ்பெஷல் தோசை", unitMultiplier: 1.0, price: 90, packingCharge: 0 },
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

  // Portion & Unit Presets for Different Food Types
  const applyPreset = (presetType: string) => {
    setActivePresetKey(presetType);
    if (presetType === "dosa_nos") {
      setPortions([
        { portionName: "Single Dosa", portionNameTamil: "சிங்கிள் தோசை", unitMultiplier: 1.0, price: 70, packingCharge: 0 },
        { portionName: "Special Dosa", portionNameTamil: "ஸ்பெஷல் தோசை", unitMultiplier: 1.0, price: 90, packingCharge: 0 },
      ]);
      setFoodUnitName("Nos");
      setFoodMealSessions(["MORNING", "NIGHT"]);
    } else if (presetType === "idly_pieces") {
      setPortions([
        { portionName: "1 Piece", portionNameTamil: "1 எண்", unitMultiplier: 0.5, price: 20, packingCharge: 0 },
        { portionName: "1 Set (2 Pcs)", portionNameTamil: "1 செட் (2 எண்)", unitMultiplier: 1.0, price: 40, packingCharge: 0 },
        { portionName: "Plate (3 Pcs)", portionNameTamil: "பிளேட் (3 எண்)", unitMultiplier: 1.5, price: 60, packingCharge: 0 },
      ]);
      setFoodUnitName("Pieces");
      setFoodMealSessions(["MORNING", "NIGHT"]);
    } else if (presetType === "poori_sets") {
      setPortions([
        { portionName: "1 Set (2 Pcs)", portionNameTamil: "1 செட் (2 எண்)", unitMultiplier: 1.0, price: 60, packingCharge: 0 },
        { portionName: "Single Piece", portionNameTamil: "சிங்கிள் (1 எண்)", unitMultiplier: 0.5, price: 30, packingCharge: 0 },
      ]);
      setFoodUnitName("Sets");
      setFoodMealSessions(["MORNING", "NIGHT"]);
    } else if (presetType === "juice_glass") {
      setPortions([
        { portionName: "1 Regular Glass", portionNameTamil: "1 கிளாஸ்", unitMultiplier: 1.0, price: 50, packingCharge: 0 },
        { portionName: "Large / Special", portionNameTamil: "ஸ்பெஷல் பெரிய கிளாஸ்", unitMultiplier: 1.5, price: 80, packingCharge: 0 },
      ]);
      setFoodUnitName("Glasses");
      setFoodMealSessions(["ALL"]);
    } else if (presetType === "tea_cup") {
      setPortions([
        { portionName: "1 Cup", portionNameTamil: "1 கப்", unitMultiplier: 1.0, price: 20, packingCharge: 0 },
        { portionName: "Special / Strong", portionNameTamil: "ஸ்பெஷல் ஸ்ட்ராங்", unitMultiplier: 1.0, price: 30, packingCharge: 0 },
      ]);
      setFoodUnitName("Cups");
      setFoodMealSessions(["MORNING", "SNACKS", "NIGHT"]);
    } else if (presetType === "meals_thali") {
      setPortions([
        { portionName: "Dine-in Meals", portionNameTamil: "முழு சாப்பாடு (Dine-in)", unitMultiplier: 1.0, price: 110, packingCharge: 0 },
        { portionName: "Parcel Meals", portionNameTamil: "பார்சல் சாப்பாடு (Parcel)", unitMultiplier: 1.0, price: 120, packingCharge: 10 },
      ]);
      setFoodUnitName("Meals");
      setFoodMealSessions(["AFTERNOON"]);
    } else if (presetType === "biriyani_plate") {
      setPortions([
        { portionName: "1/4 Plate", portionNameTamil: "கால் பிளேட்", unitMultiplier: 0.25, price: 65, packingCharge: 0 },
        { portionName: "1/2 Plate", portionNameTamil: "அரை பிளேட்", unitMultiplier: 0.5, price: 120, packingCharge: 0 },
        { portionName: "1 Plate", portionNameTamil: "முழு பிளேட்", unitMultiplier: 1.0, price: 210, packingCharge: 0 },
      ]);
      setFoodUnitName("Plates");
      setFoodMealSessions(["AFTERNOON", "NIGHT"]);
    } else if (presetType === "starters_plate") {
      setPortions([
        { portionName: "Half Plate (100g)", portionNameTamil: "அரை பிளேட் (100g)", unitMultiplier: 0.5, price: 90, packingCharge: 0 },
        { portionName: "Full Plate (200g)", portionNameTamil: "முழு பிளேட் (200g)", unitMultiplier: 1.0, price: 170, packingCharge: 0 },
      ]);
      setFoodUnitName("Plates");
      setFoodMealSessions(["AFTERNOON", "SNACKS", "NIGHT"]);
    } else if (presetType === "rice_portion") {
      setPortions([
        { portionName: "Half Plate", portionNameTamil: "அரை பிளேட்", unitMultiplier: 0.5, price: 80, packingCharge: 0 },
        { portionName: "Full Plate", portionNameTamil: "முழு பிளேட்", unitMultiplier: 1.0, price: 140, packingCharge: 0 },
      ]);
      setFoodUnitName("Plates");
      setFoodMealSessions(["AFTERNOON", "NIGHT"]);
    } else if (presetType === "gravy_cup") {
      setPortions([
        { portionName: "Single Cup", portionNameTamil: "1 கப்", unitMultiplier: 1.0, price: 130, packingCharge: 0 },
        { portionName: "Family Pack", portionNameTamil: "பெரிய கப் (Family)", unitMultiplier: 2.0, price: 240, packingCharge: 0 },
      ]);
      setFoodUnitName("Cups");
      setFoodMealSessions(["AFTERNOON", "NIGHT"]);
    } else {
      setPortions([
        { portionName: "1 Portion", portionNameTamil: "1 பங்கு", unitMultiplier: 1.0, price: 50, packingCharge: 0 },
      ]);
      setFoodUnitName("Portions");
      setFoodMealSessions(["ALL"]);
    }
  };


  // Determine appropriate stock type from category or dish name
  const detectStockType = (text: string): "EXACT_COUNT" | "BATCH_ESTIMATE" | "NO_TRACKING" => {
    const t = text.toLowerCase();
    if (t.includes("tea") || t.includes("coffee") || t.includes("juice") || t.includes("milk") || t.includes("beverage") || t.includes("drink") || t.includes("டீ") || t.includes("காபி") || t.includes("ஜூஸ்") || t.includes("பானம்")) {
      return "NO_TRACKING";
    }
    if (t.includes("idly") || t.includes("dosa") || t.includes("vada") || t.includes("poori") || t.includes("chapati") || t.includes("chappathi") || t.includes("uthappam") || t.includes("தோசை") || t.includes("இட்லி") || t.includes("பூரி") || t.includes("சப்பாத்தி") || t.includes("வடை")) {
      return "BATCH_ESTIMATE";
    }
    return "EXACT_COUNT";
  };

  // Determine which portion preset matches a category or food name automatically
  const getPresetForText = (text: string): string => {
    const textLower = text.toLowerCase();

    // 1. Rice & Variety Rice Items (Curd rice, Lemon rice, Fried rice, Tomato rice, Sambar rice)
    if (
      textLower.includes("rice") ||
      textLower.includes("curd") ||
      textLower.includes("lemon") ||
      textLower.includes("tomato") ||
      textLower.includes("sambar rice") ||
      textLower.includes("variety") ||
      textLower.includes("fried") ||
      textLower.includes("pulao") ||
      textLower.includes("சாதம்") ||
      textLower.includes("தயிர்") ||
      textLower.includes("லெமன்") ||
      textLower.includes("தக்காளி") ||
      textLower.includes("சாம்பார் சாதம்")
    ) {
      return "rice_portion";
    }

    // 2. Biriyani & Kuska
    if (
      textLower.includes("biriyani") ||
      textLower.includes("briyani") ||
      textLower.includes("biryani") ||
      textLower.includes("kuska") ||
      textLower.includes("பிரியாணி") ||
      textLower.includes("குஸ்கா")
    ) {
      return "biriyani_plate";
    }

    // 3. Meals & Thali
    if (
      textLower.includes("meal") ||
      textLower.includes("thali") ||
      textLower.includes("சாப்பாடு") ||
      textLower.includes("மதிய சாப்பாடு")
    ) {
      return "meals_thali";
    }

    // 4. Hot Beverages (Tea, Coffee, Milk, Boost)
    if (
      textLower.includes("tea") ||
      textLower.includes("coffee") ||
      textLower.includes("milk") ||
      textLower.includes("boost") ||
      textLower.includes("horlicks") ||
      textLower.includes("டீ") ||
      textLower.includes("காபி") ||
      textLower.includes("பால்")
    ) {
      return "tea_cup";
    }

    // 5. Cold Beverages & Juices
    if (
      textLower.includes("juice") ||
      textLower.includes("shake") ||
      textLower.includes("beverage") ||
      textLower.includes("drink") ||
      textLower.includes("soda") ||
      textLower.includes("lassi") ||
      textLower.includes("ஜூஸ்") ||
      textLower.includes("பழச்சாறு") ||
      textLower.includes("பானங்கள்") ||
      textLower.includes("குளிர்")
    ) {
      return "juice_glass";
    }

    // 6. Poori & Chapati / Roti
    if (
      textLower.includes("poori") ||
      textLower.includes("puri") ||
      textLower.includes("chapati") ||
      textLower.includes("chappathi") ||
      textLower.includes("roti") ||
      textLower.includes("phulka") ||
      textLower.includes("பூரி") ||
      textLower.includes("சப்பாத்தி") ||
      textLower.includes("ரொட்டி")
    ) {
      return "poori_sets";
    }

    // 7. Idly & Vada & Parotta
    if (
      textLower.includes("idly") ||
      textLower.includes("idli") ||
      textLower.includes("vada") ||
      textLower.includes("vadai") ||
      textLower.includes("parotta") ||
      textLower.includes("parota") ||
      textLower.includes("kothu") ||
      textLower.includes("இட்லி") ||
      textLower.includes("வடை") ||
      textLower.includes("பரோட்டா") ||
      textLower.includes("கொத்து")
    ) {
      return "idly_pieces";
    }

    // 8. Starters & 65 & Crispy Fry
    if (
      textLower.includes("starter") ||
      textLower.includes("65") ||
      textLower.includes("chilli") ||
      textLower.includes("fry") ||
      textLower.includes("manchurian") ||
      textLower.includes("snack") ||
      textLower.includes("ஸ்டார்ட்டர்") ||
      textLower.includes("வறுவல்") ||
      textLower.includes("ஸ்நாக்ஸ்")
    ) {
      return "starters_plate";
    }

    // 9. Gravy & Curries
    if (
      textLower.includes("gravy") ||
      textLower.includes("curry") ||
      textLower.includes("kurma") ||
      textLower.includes("kuruma") ||
      textLower.includes("dal") ||
      textLower.includes("கிரேவி") ||
      textLower.includes("குழம்பு") ||
      textLower.includes("குருமா")
    ) {
      return "gravy_cup";
    }

    // 10. Dosa & Roast & Uthappam
    if (
      textLower.includes("dosa") ||
      textLower.includes("dosai") ||
      textLower.includes("roast") ||
      textLower.includes("uthappam") ||
      textLower.includes("tiffin") ||
      textLower.includes("breakfast") ||
      textLower.includes("தோசை") ||
      textLower.includes("ஊத்தப்பம்") ||
      textLower.includes("டிபன்")
    ) {
      return "dosa_nos";
    }

    return "dosa_nos";
  };

  const getPresetForCategory = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return "dosa_nos";
    return getPresetForText(cat.name + " " + (cat.nameTamil || ""));
  };

  // Handle Category Change: Automatically applies matching portion preset, units & timings!
  const handleCategoryChange = (catId: string) => {
    setFoodCategory(catId);
    const cat = categories.find((c) => c.id === catId);
    if (cat) setStockType(detectStockType(cat.name + " " + (cat.nameTamil || "")));
    const matchedPreset = getPresetForCategory(catId);
    applyPreset(matchedPreset);

    // Auto-populate photo ONLY if photo is not set
    if (!editingFood && !foodImageUrl) {
      const matchingPhoto = SOUTH_INDIAN_PHOTOS.find((p) => p.presetType === matchedPreset);
      if (matchingPhoto) {
        setFoodImageUrl(matchingPhoto.url);
      }
    }
  };

  // 1-Click Photo Selection: Automatically fills Photo, Specific Portions, Unit Name, Suggested Dish Name & Timings!
  const selectPhotoItem = (photo: (typeof SOUTH_INDIAN_PHOTOS)[0]) => {
    setFoodImageUrl(photo.url);
    setPortions(photo.portions.map((p) => ({ ...p })));
    setFoodUnitName(photo.unitName);
    setFoodMealSessions(photo.mealSessions);
    setActivePresetKey(photo.presetType);

    // Auto-fill suggested name if empty or generic
    if (!foodName.trim() || foodName.startsWith("New ") || foodName.includes("Dish")) {
      setFoodName(photo.defaultNameEn);
      setFoodNameTamil(photo.defaultNameTa);
    }
  };

  const addPortionRow = () => {
    setPortions([
      ...portions,
      {
        portionName: "Regular",
        portionNameTamil: "அளவு",
        unitMultiplier: 1.0,
        price: 0,
        packingCharge: 0,
      },
    ]);
  };

  const updatePortionRow = (index: number, field: keyof Portion, value: any) => {
    const updated = [...portions];
    (updated[index] as any)[field] = value;
    setPortions(updated);
  };

  const removePortionRow = (index: number) => {
    if (portions.length <= 1) {
      alert("At least one portion is required");
      return;
    }
    setPortions(portions.filter((_, i) => i !== index));
  };

  // Automatic Real-Time English to Tamil Translation & Intelligent Preset / Category / Dietary Detection
  const handleEnglishNameChange = (val: string) => {
    setFoodName(val);
    const translated = translateEnglishToTamil(val);
    if (translated) {
      setFoodNameTamil(translated);
    }

    // Auto-detect matching portion preset, category, stock type, and dietary badge based on typed food name
    if (val.trim().length >= 2) {
      const textL = (val + " " + (translated || "")).toLowerCase();
      
      // Auto-detect dietary type
      if (
        textL.includes("chicken") ||
        textL.includes("mutton") ||
        textL.includes("fish") ||
        textL.includes("prawn") ||
        textL.includes("beef") ||
        textL.includes("crab") ||
        textL.includes("சிக்கன்") ||
        textL.includes("மட்டன்") ||
        textL.includes("மீன்") ||
        textL.includes("இறால்") ||
        textL.includes("நண்டு")
      ) {
        setFoodDietary("NON_VEG");
      } else if (
        textL.includes("egg") ||
        textL.includes("muttai") ||
        textL.includes("omelette") ||
        textL.includes("முட்டை")
      ) {
        setFoodDietary("EGG");
      } else if (!editingFood) {
        setFoodDietary("VEG");
      }

      const detectedPreset = getPresetForText(textL);
      setStockType(detectStockType(textL));
      if (detectedPreset && detectedPreset !== activePresetKey) {
        applyPreset(detectedPreset);
        const matchingPhoto = SOUTH_INDIAN_PHOTOS.find((p) => p.presetType === detectedPreset);
        if (matchingPhoto && (!foodImageUrl || SOUTH_INDIAN_PHOTOS.some(p => p.url === foodImageUrl))) {
          setFoodImageUrl(matchingPhoto.url);
        }
      }

      // Auto-select matching Category when creating food dish
      if (!editingFood) {
        let matchedCat = null;
        if (textL.includes("biriyani") || textL.includes("briyani") || textL.includes("biryani") || textL.includes("kuska") || textL.includes("பிரியாணி") || textL.includes("kalan") || textL.includes("kaalan") || textL.includes("mushroom")) {
          matchedCat = categories.find(c => c.name.toLowerCase().includes("biriyani"));
        } else if (textL.includes("meal") || textL.includes("சாப்பாடு") || textL.includes("thali")) {
          matchedCat = categories.find(c => c.name.toLowerCase().includes("meal"));
        } else if (textL.includes("65") || textL.includes("paneer") || textL.includes("starter") || textL.includes("curry") || textL.includes("gravy") || textL.includes("kurma") || textL.includes("manchurian") || textL.includes("chilli") || textL.includes("samosha")) {
          matchedCat = categories.find(c => c.name.toLowerCase().includes("starter") || c.name.toLowerCase().includes("grav"));
        } else if (textL.includes("fried rice") || textL.includes("noodle") || textL.includes("chinese")) {
          matchedCat = categories.find(c => c.name.toLowerCase().includes("chinese") || c.name.toLowerCase().includes("fried rice"));
        } else if (textL.includes("naan") || textL.includes("roti") || textL.includes("kulcha")) {
          matchedCat = categories.find(c => c.name.toLowerCase().includes("bread") || c.name.toLowerCase().includes("roti"));
        } else if (textL.includes("tea") || textL.includes("coffee") || textL.includes("juice") || textL.includes("soda") || textL.includes("டீ") || textL.includes("காபி")) {
          matchedCat = categories.find(c => c.name.toLowerCase().includes("beverage"));
        } else if (textL.includes("sweet") || textL.includes("ice cream") || textL.includes("jamun") || textL.includes("payasam")) {
          matchedCat = categories.find(c => c.name.toLowerCase().includes("dessert") || c.name.toLowerCase().includes("sweet"));
        } else if (textL.includes("dosa") || textL.includes("idly") || textL.includes("poori") || textL.includes("vada") || textL.includes("pongal") || textL.includes("parotta") || textL.includes("chapati")) {
          matchedCat = categories.find(c => c.name.toLowerCase().includes("tiffin"));
        }
        if (matchedCat) {
          setFoodCategory(matchedCat.id);
        }
      }
    }
  };

  const handleCategoryNameChange = (val: string) => {
    setCategoryName(val);
    const translated = translateEnglishToTamil(val);
    if (translated) {
      setCategoryNameTamil(translated);
    } else {
      setCategoryNameTamil("");
    }
  };

  // Duplicate Category check helper
  const isDuplicateCategoryName = Boolean(
    categoryName.trim() &&
    categories.some(
      (c) =>
        c.name.trim().toLowerCase() === categoryName.trim().toLowerCase() &&
        (!editingCategory || c.id !== editingCategory.id)
    )
  );

  // Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    if (isDuplicateCategoryName) {
      alert(`⚠️ "${categoryName.trim()}" என்ற உணவுப் பிரிவு (Category) ஏற்கனவே உள்ளது! தயவுசெய்து வேறு பெயர் கொடுக்கவும்.`);
      return;
    }

    const finalTamil = categoryNameTamil.trim() || translateEnglishToTamil(categoryName.trim()) || categoryName.trim();

    setLoading(true);
    try {
      if (editingCategory) {
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: categoryName.trim(),
            nameTamil: finalTamil,
            displayOrder: parseInt(categoryOrder, 10) || 1,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update category");
        showToast("Category updated successfully");
      } else {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: categoryName.trim(),
            nameTamil: finalTamil,
            displayOrder: parseInt(categoryOrder, 10) || categories.length + 1,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create category");
        showToast("New category created successfully");
      }
      setCatModalOpen(false);
      setEditingCategory(null);
      setCategoryName("");
      setCategoryNameTamil("");
      setCategoryOrder("0");
      await refreshData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Open Create Food Modal
  const openCreateFoodModal = () => {
    setEditingFood(null);
    setFoodName("");
    setFoodNameTamil("");
    setFoodDescription("");
    setFoodDietary("VEG");
    setFoodInitialStock("30");
    setFoodMinThreshold("8");
    setStockType("EXACT_COUNT");

    const targetCatId =
      selectedCatId !== "all" && categories.some((c) => c.id === selectedCatId)
        ? selectedCatId
        : categories[0]?.id || "";

    setFoodCategory(targetCatId);
    const cat = categories.find((c) => c.id === targetCatId);
    if (cat) setStockType(detectStockType(cat.name + " " + (cat.nameTamil || "")));
    const matchedPreset = getPresetForCategory(targetCatId);
    applyPreset(matchedPreset);
    const matchingPhoto = SOUTH_INDIAN_PHOTOS.find((p) => p.presetType === matchedPreset) || SOUTH_INDIAN_PHOTOS[0];
    setFoodImageUrl(matchingPhoto.url);

    setFoodModalOpen(true);
  };

  // Open Edit Food Modal
  const openEditFoodModal = (food: FoodItem) => {
    setEditingFood(food);
    setFoodName(food.name);
    setFoodNameTamil(food.nameTamil || "");
    setFoodCategory(food.categoryId);
    setFoodDescription(food.description || "");
    setFoodImageUrl(food.imageUrl || "");
    setFoodDietary(((food.dietary as any) || "VEG") as "VEG" | "NON_VEG" | "EGG");
    setStockType(food.stockType || "EXACT_COUNT");
    const sessions = food.mealTime ? (food.mealTime === "ALL" ? ["ALL"] : food.mealTime.split(",")) : ["ALL"];
    setFoodMealSessions(sessions);
    setFoodInitialStock(food.stock ? String(food.stock.currentQuantity) : "0");
    setFoodMinThreshold(food.stock ? String(food.stock.minThreshold) : "5");
    setFoodUnitName(food.stock ? food.stock.unitName : "Plates");
    setPortions(
      food.portions.map((p) => ({
        id: p.id,
        portionName: p.portionName,
        portionNameTamil: p.portionNameTamil || "",
        unitMultiplier: p.unitMultiplier,
        price: p.price,
        packingCharge: p.packingCharge || 0,
        isActive: p.isActive,
      }))
    );
    setActivePresetKey(getPresetForCategory(food.categoryId));
    setFoodModalOpen(true);
  };

  // Toggle meal session in modal
  const toggleMealSession = (sessionId: string) => {
    if (sessionId === "ALL") {
      setFoodMealSessions(["ALL"]);
      return;
    }
    const current = foodMealSessions.filter((s) => s !== "ALL");
    if (current.includes(sessionId)) {
      const remaining = current.filter((s) => s !== sessionId);
      setFoodMealSessions(remaining.length === 0 ? ["ALL"] : remaining);
    } else {
      setFoodMealSessions([...current, sessionId]);
    }
  };

  // Handle local file photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image size should be less than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setFoodImageUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Duplicate check helper
  const isDuplicateFoodName = Boolean(
    foodName.trim() &&
    foods.some(
      (f) =>
        f.name.trim().toLowerCase() === foodName.trim().toLowerCase() &&
        (!editingFood || f.id !== editingFood.id)
    )
  );

  // Save Food Item
  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim() || !foodCategory) {
      alert("Please provide food name and category");
      return;
    }

    if (isDuplicateFoodName) {
      alert(`⚠️ "${foodName.trim()}" என்ற உணவுப் பெயர் ஏற்கனவே மெனுவில் உள்ளது! தயவுசெய்து வேறு பெயர் கொடுக்கவும்.`);
      return;
    }

    if (portions.length === 0) {
      alert("At least one portion is required");
      return;
    }

    const mealTimeString =
      foodMealSessions.includes("ALL") || foodMealSessions.length === 0
        ? "ALL"
        : foodMealSessions.join(",");

    setLoading(true);
    try {
      if (editingFood) {
        const res = await fetch(`/api/foods/${editingFood.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: foodName.trim(),
            nameTamil: foodNameTamil.trim() || null,
            categoryId: foodCategory,
            description: foodDescription.trim() || null,
            imageUrl: foodImageUrl || null,
            dietary: foodDietary,
            mealTime: mealTimeString,
            stockType,
            portions,
            minThreshold: parseFloat(foodMinThreshold) || 5,
            unitName: foodUnitName,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update food item");
        showToast(`Food "${foodName}" updated`);
      } else {
        const res = await fetch("/api/foods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: foodName.trim(),
            nameTamil: foodNameTamil.trim() || null,
            categoryId: foodCategory,
            description: foodDescription.trim() || null,
            imageUrl: foodImageUrl || null,
            dietary: foodDietary,
            mealTime: mealTimeString,
            stockType,
            portions,
            initialStock: parseFloat(foodInitialStock) || 0,
            minThreshold: parseFloat(foodMinThreshold) || 5,
            unitName: foodUnitName,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create food item");
        showToast(`Food "${foodName}" created`);
      }

      setFoodModalOpen(false);
      setEditingFood(null);
      await refreshData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete Food Item
  const handleDeleteFood = async (foodId: string, name: string) => {
    const confirmMsg = isTamil
      ? `"${name}" என்ற உணவை நிச்சயமாக மெனுவிலிருந்து நீக்க வேண்டுமா?`
      : `Are you sure you want to delete "${name}" from the menu?`;
    if (!confirm(confirmMsg)) return;
    try {
      const res = await fetch(`/api/foods/${foodId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || (isTamil ? "உணவை நீக்குவதில் தோல்வி" : "Failed to delete food item"));
      showToast(isTamil ? `"${name}" வெற்றிகரமாக நீக்கப்பட்டது` : `"${name}" deleted successfully`);
      await refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filtered Foods
  const filteredFoods = foods.filter((f) => {
    const matchesCategory = selectedCatId === "all" || f.categoryId === selectedCatId;
    const matchesMeal =
      selectedMealFilter === "all" ||
      !f.mealTime ||
      f.mealTime === "ALL" ||
      f.mealTime.includes(selectedMealFilter);
    const matchesSearch =
      !searchQuery.trim() ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.nameTamil && f.nameTamil.toLowerCase().includes(searchQuery.toLowerCase())) ||
      f.category.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesMeal && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-500 text-sm font-semibold animate-slide-up">
          <Check className="w-5 h-5" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900">{isTamil ? "உணவு & மெனு மேலாண்மை" : "Food Menu & Stock Units"}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isTamil
              ? "உணவு வகைகள், அளவு விலைகள், பரிமாறும் நேரங்கள் மற்றும் இருப்பு அமைப்புகள்."
              : "Configure Idly/Dosa, Biriyani, Snacks with Meal Timings (Morning/Afternoon/Night), Photos, and Prices."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setEditingCategory(null);
              setCategoryName("");
              setCategoryOrder(String(categories.length + 1));
              setCatModalOpen(true);
            }}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-sm transition-all border border-slate-300 flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>{isTamil ? "+ வகை சேர்க்க" : "+ Add Category"}</span>
          </button>

          <button
            onClick={openCreateFoodModal}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{isTamil ? "+ புதிய உணவு சேர்க்க" : "+ Add Food Dish"}</span>
          </button>
        </div>
      </div>

      {/* Meal Session Filter & Category Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        {/* Meal Session Selector (Morning, Afternoon, Snacks, Night) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-xs font-black uppercase text-slate-500 mr-1 flex items-center gap-1">
              <span>🕒 {isTamil ? "பரிமாறும் நேரம்:" : "Timing:"}</span>
            </span>
            <button
              onClick={() => setSelectedMealFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                selectedMealFilter === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {isTamil ? "🍽️ அனைத்து நேரம்" : "🍽️ All Timing"} ({foods.length})
            </button>
            {MEAL_SESSIONS.map((session) => {
              const count = foods.filter(
                (f) => !f.mealTime || f.mealTime === "ALL" || f.mealTime.includes(session.id)
              ).length;
              return (
                <button
                  key={session.id}
                  onClick={() => setSelectedMealFilter(session.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1 ${
                    selectedMealFilter === session.id
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{session.icon}</span>
                  <span>{session.labelTa}</span>
                  <span className="opacity-70 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dish / உணவு..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSelectedCatId("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCatId === "all"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {isTamil ? "அனைத்து வகைகள்" : "All Categories"}
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCatId(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCatId === cat.id
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {cat.name} {cat.nameTamil ? `(${cat.nameTamil})` : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Food Items Grid with Photos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredFoods.map((item) => {
          const isLowStock = item.stock ? item.stock.currentQuantity <= item.stock.minThreshold : false;
          const mealTags = item.mealTime && item.mealTime !== "ALL"
            ? item.mealTime.split(",").map((s) => {
                const found = MEAL_SESSIONS.find((m) => m.id === s);
                return found ? `${found.icon} ${found.labelTa}` : s;
              })
            : ["🍽️ முழு நேரம்"];

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              {/* Food Image Banner or Fallback Aesthetic Gradient */}
              <div className="h-36 w-full relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white/80 p-4">
                    <UtensilsCrossed className="w-10 h-10 text-emerald-400 mb-1 opacity-80" />
                    <span className="text-xs font-bold text-slate-200">{item.name}</span>
                    <span className="text-[10px] text-emerald-300">{item.nameTamil}</span>
                  </div>
                )}

                {/* Category Badge */}
                <span className="absolute top-2 left-2 text-[10px] font-black uppercase text-white bg-slate-900/85 backdrop-blur-xs px-2 py-0.5 rounded-md shadow-xs">
                  {item.category.nameTamil || item.category.name}
                </span>

                {/* Edit & Delete Action Buttons */}
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/95 backdrop-blur-xs rounded-lg p-0.5 shadow-sm">
                  <button
                    onClick={() => openEditFoodModal(item)}
                    className="p-1.5 text-slate-700 hover:text-emerald-700 rounded transition-colors"
                    title="Edit Dish & Photo"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteFood(item.id, item.name)}
                    className="p-1.5 text-slate-700 hover:text-red-700 rounded transition-colors"
                    title="Delete Dish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Meal Timings Overlay Badge */}
                <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                  {mealTags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[10px] font-bold text-slate-900 bg-white/95 px-1.5 py-0.5 rounded shadow-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="mb-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      {item.dietary === "NON_VEG" ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200" title="Non-Veg">
                          <span className="w-2 h-2 rounded-full bg-red-600"></span>
                          <span>Non-Veg</span>
                        </span>
                      ) : item.dietary === "EGG" ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200" title="Egg Dish">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>Egg</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Pure Veg">
                          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                          <span>Pure Veg</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-black text-slate-900 text-base leading-tight">{item.name}</h3>
                    {item.nameTamil && (
                      <div className="text-xs font-bold text-emerald-800 mt-0.5">{item.nameTamil}</div>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">{item.description}</p>
                  )}

                  {/* Portions & Selling Prices */}
                  <div className="space-y-1.5 mb-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Portion Sizes & Prices:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.portions.map((p) => (
                        <div
                          key={p.id}
                          className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-1 text-xs"
                        >
                          <span className="font-semibold text-slate-700">
                            {p.portionNameTamil || p.portionName}:
                          </span>
                          <span className="font-black text-emerald-700">{formatCurrency(p.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stock Footer */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-500 font-medium">Stock:</span>
                    {item.stockType === "NO_TRACKING" ? (
                      <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded text-[11px] border border-sky-200">
                        ♾️ Unlimited
                      </span>
                    ) : (
                      <span className="font-bold text-slate-800">
                        {item.stock ? formatHumanStock(item.stock.currentQuantity, item.stock.unitName) : "0"}
                      </span>
                    )}
                  </div>

                  {item.stockType === "NO_TRACKING" ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      ♾️ NO TRACKING
                    </span>
                  ) : item.stockType === "BATCH_ESTIMATE" ? (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isLowStock
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {isLowStock ? "LOW BATCH ⚠️" : "🥞 BATCH"}
                    </span>
                  ) : (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isLowStock
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}>
                      {isLowStock ? "LOW STOCK ⚠️" : "🔢 COUNT"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Food Dish Modal */}
      {foodModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full p-5 sm:p-7 my-6 max-h-[92vh] overflow-y-auto animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <UtensilsCrossed className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-black text-lg sm:text-xl text-slate-900 tracking-tight">
                      {editingFood ? `Edit Dish: ${editingFood.name}` : "Create Food Dish (புதிய உணவு சேர்க்க)"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Bilingual Name, Dietary Badge, Meal Timings, Portions, Packing Fee & Stock Tracking.
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFoodModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFood} className="space-y-5">
              {/* 1. Bilingual Dish Name Inputs */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  1. Dish Names (உணவின் பெயர்கள்) <span className="text-red-500">*</span>
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        English Name (ஆங்கிலப் பெயர்) <span className="text-red-500">*</span>
                      </label>
                      {isDuplicateFoodName && (
                        <span className="text-[10px] text-red-600 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Duplicate
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={foodName}
                      onChange={(e) => handleEnglishNameChange(e.target.value)}
                      placeholder="e.g. Masala Dosa / Chicken Biriyani"
                      className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 ${
                        isDuplicateFoodName
                          ? "border-red-500 focus:ring-red-400 bg-red-50/40 text-red-900"
                          : "border-slate-300 focus:ring-emerald-500"
                      }`}
                      required
                    />
                    {isDuplicateFoodName ? (
                      <p className="text-[11px] text-red-600 font-semibold mt-1">
                        ⚠️ இந்த உணவுப் பெயர் ({foodName.trim()}) ஏற்கனவே உள்ளது!
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Auto-detects category, Tamil translation & photo preset.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tamil Name (தமிழ் பெயர்)
                    </label>
                    <input
                      type="text"
                      value={foodNameTamil}
                      onChange={(e) => setFoodNameTamil(e.target.value)}
                      placeholder="எ.கா. மசாலா தோசை / சிக்கன் பிரியாணி"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      தானாக மொழிபெயர்க்கப்படும்; தேவைப்பட்டால் நீங்களே மாற்றலாம்.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Category & Dietary Badge Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                {/* Category Dropdown (5 cols) */}
                <div className="sm:col-span-5">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                    Category (உணவுப் பிரிவு) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={foodCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.nameTamil ? `(${c.nameTamil})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dietary Badge Selector (7 cols) */}
                <div className="sm:col-span-7">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Dietary Classification (உணவு வகை)</span>
                    <span className="text-red-500 text-[10px] font-bold">Required *</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFoodDietary("VEG")}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                        foodDietary === "VEG"
                          ? "bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-400 shadow-xs"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-sm border-2 border-emerald-600 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      </span>
                      <span>Pure Veg</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFoodDietary("NON_VEG")}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                        foodDietary === "NON_VEG"
                          ? "bg-red-50 border-red-600 text-red-900 ring-2 ring-red-400 shadow-xs"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-sm border-2 border-red-600 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                      </span>
                      <span>Non-Veg</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFoodDietary("EGG")}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                        foodDietary === "EGG"
                          ? "bg-amber-50 border-amber-600 text-amber-900 ring-2 ring-amber-400 shadow-xs"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-sm border-2 border-amber-600 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      </span>
                      <span>Egg</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Meal Timings Clarity */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                    3. Meal Timings & Availability (பரிமாறும் நேரம்)
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">Click to toggle session</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {/* All Sessions Card */}
                  <button
                    type="button"
                    onClick={() => toggleMealSession("ALL")}
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                      foodMealSessions.includes("ALL")
                        ? "bg-slate-900 text-white border-slate-900 ring-2 ring-slate-400 shadow-sm font-bold"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100/70"
                    }`}
                  >
                    <span className="text-xl mb-0.5">🍽️</span>
                    <span className="text-xs font-black">All Day</span>
                    <span className={`text-[10px] ${foodMealSessions.includes("ALL") ? "text-slate-300" : "text-slate-400"}`}>
                      முழு நேரம்
                    </span>
                  </button>

                  {/* Individual Meal Sessions with Bilingual Labels */}
                  {MEAL_SESSIONS.map((session) => {
                    const active = !foodMealSessions.includes("ALL") && foodMealSessions.includes(session.id);
                    return (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => toggleMealSession(session.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                          active
                            ? "bg-emerald-50 text-emerald-900 border-emerald-600 ring-2 ring-emerald-400 shadow-sm font-bold"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100/70"
                        }`}
                      >
                        <span className="text-xl mb-0.5">{session.icon}</span>
                        <span className="text-xs font-black truncate max-w-full">
                          {session.id === "MORNING"
                            ? "Breakfast"
                            : session.id === "AFTERNOON"
                            ? "Lunch"
                            : session.id === "SNACKS"
                            ? "Tea / Snacks"
                            : "Dinner"}
                        </span>
                        <span className={`text-[10px] truncate max-w-full ${active ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                          {session.labelTa}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Food Photo & Quick South Indian Preset Bar */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {foodImageUrl ? (
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-300 relative shrink-0 shadow-xs">
                        <img src={foodImageUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center shrink-0 border border-slate-300">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Food Dish Photo (புகைப்படம்)
                      </label>
                      <div className="text-[11px] text-slate-500">
                        Select from high-quality dish library or upload custom photo.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs flex items-center gap-1.5 transition-all">
                      <span>📁 Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    {foodImageUrl && (
                      <button
                        type="button"
                        onClick={() => setFoodImageUrl("")}
                        className="px-2.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 transition-all"
                        title="Clear Photo"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* South Indian Quick Photo Library Chips */}
                <div className="pt-2 border-t border-slate-200/70">
                  <div className="text-[11px] font-bold text-slate-500 mb-1.5">
                    Quick Photo Presets (பிரபலமான உணவுகள்):
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {SOUTH_INDIAN_PHOTOS.map((photo, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => {
                          setFoodImageUrl(photo.url);
                          if (!foodName) setFoodName(photo.defaultNameEn);
                          if (!foodNameTamil) setFoodNameTamil(photo.defaultNameTa);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1 ${
                          foodImageUrl === photo.url
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span>{photo.icon}</span>
                        <span>{photo.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5. Compact Portions & Pricing Row (with Takeaway Packing Fee) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    5. Portions, Pricing &amp; Packing Fee (விலை &amp; அளவுகள்)
                  </span>

                  {/* Quick Preset Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500">Quick Preset:</span>
                    <select
                      value={activePresetKey}
                      onChange={(e) => applyPreset(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="custom">-- Custom Portions --</option>
                      {PORTION_PRESETS.map((preset) => (
                        <option key={preset.key} value={preset.key}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Table Header Labels for Desktop */}
                <div className="hidden sm:grid grid-cols-12 gap-2 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="col-span-4">Portion Name (அளவு பெயர்)</div>
                  <div className="col-span-2">Unit Multiplier</div>
                  <div className="col-span-3">Dine-in / Sale Price (₹)</div>
                  <div className="col-span-2">Parcel Fee (₹)</div>
                  <div className="col-span-1 text-center">Action</div>
                </div>

                {/* Compact Single-line Rows */}
                <div className="space-y-2">
                  {portions.map((portion, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white p-2.5 sm:p-2 rounded-xl border border-slate-200 items-center shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      <div className="sm:col-span-4">
                        <label className="sm:hidden block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Portion Name
                        </label>
                        <input
                          type="text"
                          value={portion.portionName}
                          onChange={(e) => updatePortionRow(idx, "portionName", e.target.value)}
                          placeholder="e.g. 1 Plate / Regular / Full"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="sm:hidden block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Unit Multiplier
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          min="0.05"
                          value={portion.unitMultiplier}
                          onChange={(e) =>
                            updatePortionRow(idx, "unitMultiplier", parseFloat(e.target.value) || 0)
                          }
                          title="Stock deduction multiplier (e.g., 0.5 for Half, 1.0 for Full)"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          required
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="sm:hidden block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Price (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-emerald-700">₹</span>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={portion.price}
                            onChange={(e) =>
                              updatePortionRow(idx, "price", parseFloat(e.target.value) || 0)
                            }
                            placeholder="0"
                            className="w-full pl-6 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-black text-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="sm:hidden block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Parcel Fee (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">₹</span>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={portion.packingCharge || 0}
                            onChange={(e) =>
                              updatePortionRow(idx, "packingCharge", parseFloat(e.target.value) || 0)
                            }
                            placeholder="0"
                            className="w-full pl-6 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-1 flex justify-end sm:justify-center">
                        <button
                          type="button"
                          onClick={() => removePortionRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove Portion Tier"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addPortionRow}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors mt-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Custom Portion Tier (கூடுதல் அளவு சேர்க்க)</span>
                </button>
              </div>

              {/* 6. Short Kitchen Note & Stock Tracking */}
              <div className="space-y-4">
                {/* Short Kitchen Note / Description */}
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Short Kitchen Note / Description (சமையலறை குறிப்பு)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                  </label>
                  <input
                    type="text"
                    value={foodDescription}
                    onChange={(e) => setFoodDescription(e.target.value)}
                    placeholder="e.g. Served with 3 chutneys & sambar / Spicy Chettinad style, cooked with ghee"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Stock Tracking Module */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                      Stock Tracking Type (இருப்பு கண்காணிப்பு வகை)
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setStockType("EXACT_COUNT")}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        stockType === "EXACT_COUNT"
                          ? "bg-emerald-700 text-white border-emerald-700 ring-2 ring-emerald-400 shadow-sm font-bold"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-xs font-black flex items-center gap-1.5">
                        <span>🔢</span> Exact Count
                      </div>
                      <div className={`text-[10px] mt-0.5 ${stockType === "EXACT_COUNT" ? "text-emerald-100" : "text-slate-500"}`}>
                        Meals, Biriyani, Parotta, Gravy
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStockType("BATCH_ESTIMATE")}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        stockType === "BATCH_ESTIMATE"
                          ? "bg-amber-600 text-white border-amber-600 ring-2 ring-amber-400 shadow-sm font-bold"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-xs font-black flex items-center gap-1.5">
                        <span>🥞</span> Batch Estimate
                      </div>
                      <div className={`text-[10px] mt-0.5 ${stockType === "BATCH_ESTIMATE" ? "text-amber-100" : "text-slate-500"}`}>
                        Idly, Dosa, Poori, Chapati
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStockType("NO_TRACKING")}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        stockType === "NO_TRACKING"
                          ? "bg-sky-700 text-white border-sky-700 ring-2 ring-sky-400 shadow-sm font-bold"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-xs font-black flex items-center gap-1.5">
                        <span>♾️</span> No Tracking
                      </div>
                      <div className={`text-[10px] mt-0.5 ${stockType === "NO_TRACKING" ? "text-sky-100" : "text-slate-500"}`}>
                        Tea, Coffee, Juices, Water
                      </div>
                    </button>
                  </div>

                  {/* Initial Stock & Threshold Settings */}
                  {stockType === "NO_TRACKING" ? (
                    <div className="bg-sky-50 p-3 rounded-xl border border-sky-200 text-xs font-semibold text-sky-800 flex items-center gap-2">
                      <span className="text-base">♾️</span>
                      <span>இந்த உணவிற்கு வரம்பற்ற இருப்பு (Unlimited Stock) பொருந்தும். பில்லிங் செய்யும்போது இருப்பு குறையாது.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                      {!editingFood && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                            {stockType === "BATCH_ESTIMATE" ? "Batch Yield Count" : "Starting Stock"}
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            value={foodInitialStock}
                            onChange={(e) => setFoodInitialStock(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Min Alert Level
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={foodMinThreshold}
                          onChange={(e) => setFoodMinThreshold(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Stock Unit (அளவு அலகு)
                        </label>
                        <select
                          value={foodUnitName}
                          onChange={(e) => setFoodUnitName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="Plates">Plates (பிளேட்)</option>
                          <option value="Pieces">Pieces (எண்ணிக்கை)</option>
                          <option value="Sets">Sets (செட்)</option>
                          <option value="Nos">Nos (எண்)</option>
                          <option value="Cups">Cups (கப்)</option>
                          <option value="Glasses">Glasses (கிளாஸ்)</option>
                          <option value="Meals">Meals (சாப்பாடு)</option>
                          <option value="Portions">Portions (பங்கு)</option>
                          <option value="Packets">Packets (பாக்கெட்)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setFoodModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel (ரத்து)
                </button>
                <button
                  type="submit"
                  disabled={loading || isDuplicateFoodName}
                  className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition-all ${
                    isDuplicateFoodName
                      ? "bg-slate-400 cursor-not-allowed opacity-60"
                      : "bg-emerald-600 hover:bg-emerald-500"
                  }`}
                >
                  {loading
                    ? "Saving Dish..."
                    : isDuplicateFoodName
                    ? "⚠️ Duplicate Name (Change Name)"
                    : editingFood
                    ? "Update Dish (சேமிக்க)"
                    : "Create Dish (உணவு சேர்க்க)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-lg text-slate-900">
                {editingCategory ? `Edit Category: ${editingCategory.name}` : "Create Food Category"}
              </h3>
              <button
                onClick={() => setCatModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Category Name (உணவு வகை பெயர்)
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => handleCategoryNameChange(e.target.value)}
                  placeholder="e.g. Biriyani / Starters / Soups"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-bold focus:outline-none focus:ring-2 ${
                    isDuplicateCategoryName
                      ? "border-red-500 focus:ring-red-400 bg-red-50/40 text-red-900"
                      : "border-slate-300 focus:ring-emerald-500"
                  }`}
                  required
                />
                {isDuplicateCategoryName ? (
                  <p className="text-[11px] text-red-600 font-semibold mt-1">
                    ⚠️ இந்த உணவுப் பிரிவு ({categoryName.trim()}) ஏற்கனவே உள்ளது. தயவுசெய்து புதிய பெயரை தட்டச்சு செய்யவும்.
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Tamil translation is handled automatically in the background.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Display Order (வரிசை எண்)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={categoryOrder}
                  onChange={(e) => setCategoryOrder(e.target.value)}
                  placeholder="1, 2, 3..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || isDuplicateCategoryName}
                  className={`px-6 py-2 text-sm font-bold text-white rounded-xl shadow-md transition-all ${
                    isDuplicateCategoryName
                      ? "bg-slate-400 cursor-not-allowed opacity-60"
                      : "bg-emerald-600 hover:bg-emerald-500"
                  }`}
                >
                  {loading
                    ? "Saving..."
                    : isDuplicateCategoryName
                    ? "⚠️ Duplicate Category"
                    : editingCategory
                    ? "Update Category"
                    : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
