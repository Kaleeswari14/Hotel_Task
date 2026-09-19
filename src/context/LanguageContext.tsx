"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "ta";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isTamil: boolean;
  t: (key: string) => string;
  getFoodName: (food: { name: string; nameTamil?: string | null }) => string;
  getCategoryName: (cat: { name: string; nameTamil?: string | null }) => string;
  getPortionName: (portion: string | { portionName: string; portionNameTamil?: string | null }) => string;
}

const translations: Record<string, { en: string; ta: string }> = {
  // Navigation
  "nav.dashboard": { en: "Dashboard", ta: "முகப்பு" },
  "nav.pos": { en: "POS Bill", ta: "பில்லிங்" },
  "nav.bills": { en: "Bills", ta: "பில்கள்" },
  "nav.menu": { en: "Menu", ta: "மெனு" },
  "nav.stock": { en: "Stock", ta: "இருப்பு" },
  "nav.expenses": { en: "Expenses", ta: "செலவுகள்" },
  "nav.payments": { en: "Payments", ta: "கட்டணங்கள்" },
  "nav.cancelled": { en: "Cancelled", ta: "ரத்து பில்கள்" },
  "nav.dayClosing": { en: "Day Closing", ta: "நாள் முடிவு" },
  "nav.qrCodes": { en: "QR Stickers", ta: "QR ஸ்டிக்கர்" },
  "nav.whatsapp": { en: "WhatsApp", ta: "வாட்ஸ்அப்" },
  "nav.users": { en: "Staff & PINs", ta: "பணியாளர்கள்" },
  "nav.logout": { en: "Log Out", ta: "வெளியேறு" },
  "nav.roleOwner": { en: "Owner", ta: "உரிமையாளர்" },
  "nav.roleStaff": { en: "Staff", ta: "பணியாளர்" },
  "nav.subtitle": { en: "POS • Enterprise", ta: "ஹோட்டல் பில்லிங்" },

  // POS Terminal
  "pos.title": { en: "POS Billing Terminal", ta: "பில்லிங் கவுண்டர்" },
  "pos.searchPlaceholder": { en: "Search dish name or code...", ta: "உணவின் பெயர் அல்லது எண்..." },
  "pos.allDishes": { en: "All Dishes", ta: "அனைத்து உணவுகள்" },
  "pos.allCategories": { en: "All Categories", ta: "அனைத்து வகைகள்" },
  "pos.allSessions": { en: "All Sessions", ta: "அனைத்து நேரம்" },
  "pos.morning": { en: "Morning Breakfast", ta: "காலை உணவு" },
  "pos.afternoon": { en: "Afternoon Lunch", ta: "மதிய உணவு" },
  "pos.snacks": { en: "Evening Snacks", ta: "மாலை சிற்றுண்டி" },
  "pos.night": { en: "Dinner & Night", ta: "இரவு உணவு" },
  
  // Dietary
  "dietary.veg": { en: "Pure Veg", ta: "சைவம்" },
  "dietary.nonVeg": { en: "Non-Veg", ta: "அசைவம்" },
  "dietary.egg": { en: "Egg", ta: "முட்டை" },

  // Cart & Order
  "cart.currentOrder": { en: "Current Order", ta: "நடப்பு ஆர்டர்" },
  "cart.clear": { en: "Clear", ta: "அழி" },
  "cart.emptyTitle": { en: "Cart is empty", ta: "ஆர்டர் கூடை காலியாக உள்ளது" },
  "cart.emptySubtitle": { en: "Select items from the menu to build an order", ta: "மெனுவிலிருந்து உணவுகளைத் தேர்ந்தெடுக்கவும்" },
  "cart.items": { en: "Items", ta: "பொருட்கள்" },
  "cart.subtotal": { en: "Subtotal", ta: "கூட்டுத்தொகை" },
  "cart.discount": { en: "Discount", ta: "தள்ளுபடி" },
  "cart.totalPayable": { en: "Total Payable", ta: "செலுத்த வேண்டிய தொகை" },
  "cart.dineIn": { en: "Dine-In", ta: "சாப்பிடுவது" },
  "cart.takeaway": { en: "Takeaway", ta: "பார்சல்" },
  "cart.table": { en: "Table", ta: "டேபிள்" },
  "cart.token": { en: "Token", ta: "டோக்கன்" },
  "cart.mobile": { en: "Mobile (for WhatsApp)", ta: "மொபைல் எண் (WhatsApp)" },
  "cart.customerName": { en: "Customer Name", ta: "வாடிக்கையாளர் பெயர்" },
  "cart.cashAndPrint": { en: "Cash & Print (Enter)", ta: "ரொக்கம் & பில் (Enter)" },
  "cart.orderSlip": { en: "Order Slip (Shift+Enter)", ta: "சமையலறை சீட்டு (Shift+Enter)" },
  "cart.payOptions": { en: "More Payment Options", ta: "பிற கட்டண முறைகள்" },

  // Stock Badges
  "stock.inStock": { en: "In Stock", ta: "இருப்பு உள்ளது" },
  "stock.lowStock": { en: "Few Left", ta: "குறைந்த இருப்பு" },
  "stock.freshMade": { en: "Kitchen Made", ta: "உடனடி தயாரிப்பு" },
  "stock.outOfStock": { en: "Out of Stock", ta: "இருப்பு இல்லை" },

  // Portions
  "portion.full": { en: "Full", ta: "முழு" },
  "portion.half": { en: "Half", ta: "அரை" },
  "portion.quarter": { en: "Quarter", ta: "கால்" },
  "portion.regular": { en: "Regular", ta: "சாதாரண" },
  "portion.plate": { en: "Plate", ta: "பிளேட்" },
  "portion.cup": { en: "Cup", ta: "கப்" },
  "portion.set": { en: "Set", ta: "செட்" },
  "portion.nos": { en: "Nos", ta: "எண்ணிக்கை" },

  // General Actions
  "action.save": { en: "Save", ta: "சேமி" },
  "action.cancel": { en: "Cancel", ta: "ரத்து செய்" },
  "action.edit": { en: "Edit", ta: "திருத்து" },
  "action.delete": { en: "Delete", ta: "நீக்கு" },
  "action.close": { en: "Close", ta: "மூடு" },
  "action.confirm": { en: "Confirm", ta: "உறுதி செய்" },
  "action.search": { en: "Search", ta: "தேடு" },
  "action.filter": { en: "Filter", ta: "வடிகட்டு" },
};

// Exact food translation dictionary
const EXACT_FOOD_MAP: Record<string, string> = {
  // Rice & Meals
  "rice": "சாதம்",
  "white rice": "வெள்ளை சாதம்",
  "boiled rice": "புழுங்கல் அரிசி சாதம்",
  "tomato rice": "தக்காளி சாதம்",
  "tiommota rice": "தக்காளி சாதம்",
  "lemon rice": "எலுமிச்சை சாதம்",
  "curd rice": "தயிர் சாதம்",
  "sambar rice": "சாம்பார் சாதம்",
  "rasam rice": "ரசம் சாதம்",
  "tamarind rice": "புளியோதரை",
  "variety rice": "கலவை சாதம்",
  "fried rice": "ஃப்ரைட் ரைஸ்",
  "veg fried rice": "சைவ ஃப்ரைட் ரைஸ்",
  "egg fried rice": "முட்டை ஃப்ரைட் ரைஸ்",
  "chicken fried rice": "சிக்கன் ஃப்ரைட் ரைஸ்",
  "schezwan fried rice": "செஸ்வான் ஃப்ரைட் ரைஸ்",
  "noodles": "நூடுல்ஸ்",
  "veg noodles": "சைவ நூடுல்ஸ்",
  "egg noodles": "முட்டை நூடுல்ஸ்",
  "chicken noodles": "சிக்கன் நூடுல்ஸ்",
  "meals": "சாப்பாடு",
  "veg meals": "சைவ சாப்பாடு",
  "non veg meals": "அசைவ சாப்பாடு",
  "full meals": "முழு சாப்பாடு",
  "south indian meals": "தென்னிந்திய சாப்பாடு",

  // Biriyani
  "biriyani": "பிரியாணி",
  "briyani": "பிரியாணி",
  "chicken biriyani": "சிக்கன் பிரியாணி",
  "mutton biriyani": "மட்டன் பிரியாணி",
  "egg biriyani": "முட்டை பிரியாணி",
  "veg biriyani": "சைவ பிரியாணி",
  "beef biriyani": "பீஃப் பிரியாணி",
  "fish biriyani": "மீன் பிரியாணி",
  "prawn biriyani": "இறால் பிரியாணி",
  "kuska": "குஸ்கா",
  "empty biriyani": "குஸ்கா",

  // Tiffin & Breakfast
  "idly": "இட்லி",
  "idli": "இட்லி",
  "dosa": "தோசை",
  "dosai": "தோசை",
  "plain dosa": "சாதா தோசை",
  "roast": "ரோஸ்ட்",
  "ghee roast": "நெய் ரோஸ்ட்",
  "ghee dosa": "நெய் தோசை",
  "masala dosa": "மசாலா தோசை",
  "podi dosa": "பொடி தோசை",
  "onion dosa": "வெங்காய தோசை",
  "egg dosa": "முட்டை தோசை",
  "rava dosa": "ரவா தோசை",
  "uttapam": "ஊத்தப்பம்",
  "oothappam": "ஊத்தப்பம்",
  "onion uttapam": "வெங்காய ஊத்தப்பம்",
  "poori": "பூரி",
  "puri": "பூரி",
  "poori masala": "பூரி மசாலா",
  "pongal": "பொங்கல்",
  "ven pongal": "வெண் பொங்கல்",
  "vada": "வடை",
  "vadai": "வடை",
  "sambar vada": "சாம்பார் வடை",
  "rasam vada": "ரசம் வடை",
  "curd vada": "தயிர் வடை",
  "parotta": "பரோட்டா",
  "parotha": "பரோட்டா",
  "kothu parotta": "கொத்து பரோட்டா",
  "egg kothu parotta": "முட்டை கொத்து பரோட்டா",
  "chicken kothu parotta": "சிக்கன் கொத்து பரோட்டா",
  "chilly parotta": "சில்லி பரோட்டா",
  "chapati": "சப்பாத்தி",
  "chappathi": "சப்பாத்தி",
  "roti": "ரொட்டி",
  "naan": "நான்",
  "butter naan": "பட்டர் நான்",
  "garlic naan": "பூண்டு நான்",
  "kulcha": "குல்ச்சா",

  // Starters & Gravies
  "chicken 65": "சிக்கன் 65",
  "chilli chicken": "சில்லி சிக்கன்",
  "pepper chicken": "மிளகு சிக்கன்",
  "chicken fry": "சிக்கன் வறுவல்",
  "chicken gravy": "சிக்கன் குழம்பு",
  "chicken curry": "சிக்கன் கறி",
  "chicken masala": "சிக்கன் மசாலா",
  "butter chicken": "பட்டர் சிக்கன்",
  "mutton fry": "மட்டன் சுக்கா",
  "mutton gravy": "மட்டன் குழம்பு",
  "mutton chukka": "மட்டன் சுக்கா",
  "fish fry": "மீன் வறுவல்",
  "fish curry": "மீன் குழம்பு",
  "prawn fry": "இறால் வறுவல்",
  "prawn gravy": "இறால் தொக்கு",
  "egg fry": "முட்டை வறுவல்",
  "egg podimas": "முட்டை பொடிமாஸ்",
  "omelette": "ஆம்லெட்",
  "omlet": "ஆம்லெட்",
  "half boil": "ஹாஃப் பாயில்",
  "egg gravy": "முட்டை குழம்பு",
  "paneer butter masala": "பன்னீர் பட்டர் மசாலா",
  "paneer tikka": "பன்னீர் டிக்கா",
  "chilli paneer": "சில்லி பன்னீர்",
  "mushroom fry": "காளான் வறுவல்",
  "mushroom gravy": "காளான் குழம்பு",
  "chilli mushroom": "சில்லி காளான்",
  "gobi 65": "கோபி 65",
  "gobi manchurian": "கோபி மஞ்சூரியன்",
  "chilli gobi": "சில்லி கோபி",

  // Drinks & Beverages
  "tea": "டீ",
  "coffee": "காபி",
  "filter coffee": "ஃபில்டர் காபி",
  "black tea": "பிளாக் டீ",
  "green tea": "கிரீன் டீ",
  "lemon tea": "லெமன் டீ",
  "milk": "பால்",
  "badam milk": "பாதாம் பால்",
  "boost": "பூஸ்ட்",
  "horlicks": "ஹார்லிக்ஸ்",
  "juice": "ஜூஸ்",
  "mango juice": "மாம்பழ ஜூஸ்",
  "apple juice": "ஆப்பிள் ஜூஸ்",
  "orange juice": "ஆரஞ்சு ஜூஸ்",
  "sweet lime juice": "சாத்துக்குடி ஜூஸ்",
  "mosambi juice": "சாத்துக்குடி ஜூஸ்",
  "pomegranate juice": "மாதுளை ஜூஸ்",
  "watermelon juice": "தர்பூசணி ஜூஸ்",
  "pineapple juice": "அன்னாசி ஜூஸ்",
  "lemon juice": "எலுமிச்சை ஜூஸ்",
  "lime juice": "எலுமிச்சை ஜூஸ்",
  "mint lime": "புதினா லெமன்",
  "fresh juice": "ஃபிரஷ் ஜூஸ்",
  "rose milk": "ரோஸ் மில்க்",
  "nannari sarbath": "நன்னாரி சர்பத்",
  "lassi": "லஸ்ஸி",
  "sweet lassi": "இனிப்பு லஸ்ஸி",
  "butter milk": "மோர்",
  "water bottle": "தண்ணீர் பாட்டில்",
  "mineral water": "தண்ணீர் பாட்டில்",

  // Categories
  "drinks": "குளிர் பானங்கள்",
  "beverages": "பானங்கள்",
  "desserts": "இனிப்புகள்",
  "sweets": "இனிப்புகள்",
  "tiffin": "டிபன்",
  "breakfast": "காலை உணவு",
  "lunch": "மதிய உணவு",
  "dinner": "இரவு உணவு",
  "snacks": "சிற்றுண்டி",
  "starters": "ஸ்டார்ட்டர்ஸ்",
};

// Word-by-word token translator
const WORD_MAP: Record<string, string> = {
  "chicken": "சிக்கன்",
  "mutton": "மட்டன்",
  "fish": "மீன்",
  "prawn": "இறால்",
  "prawns": "இறால்",
  "egg": "முட்டை",
  "veg": "சைவ",
  "non-veg": "அசைவ",
  "paneer": "பன்னீர்",
  "mushroom": "காளான்",
  "gobi": "கோபி",
  "biriyani": "பிரியாணி",
  "briyani": "பிரியாணி",
  "rice": "சாதம்",
  "fried": "ஃப்ரைட்",
  "noodles": "நூடுல்ஸ்",
  "parotta": "பரோட்டா",
  "parotha": "பரோட்டா",
  "dosa": "தோசை",
  "dosai": "தோசை",
  "roast": "ரோஸ்ட்",
  "idly": "இட்லி",
  "idli": "இட்லி",
  "vada": "வடை",
  "vadai": "வடை",
  "poori": "பூரி",
  "puri": "பூரி",
  "pongal": "பொங்கல்",
  "chapati": "சப்பாத்தி",
  "chappathi": "சப்பாத்தி",
  "meals": "சாப்பாடு",
  "curry": "குழம்பு",
  "gravy": "குழம்பு",
  "fry": "வறுவல்",
  "sukka": "சுக்கா",
  "chukka": "சுக்கா",
  "masala": "மசாலா",
  "chilli": "சில்லி",
  "pepper": "மிளகு",
  "garlic": "பூண்டு",
  "ginger": "இஞ்சி",
  "onion": "வெங்காயம்",
  "tomato": "தக்காளி",
  "tiommota": "தக்காளி",
  "curd": "தயிர்",
  "sambar": "சாம்பார்",
  "rasam": "ரசம்",
  "lemon": "எலுமிச்சை",
  "mango": "மாம்பழ",
  "apple": "ஆப்பிள்",
  "orange": "ஆரஞ்சு",
  "banana": "வாழைப்பழ",
  "grape": "திராட்சை",
  "grapes": "திராட்சை",
  "watermelon": "தர்பூசணி",
  "pomegranate": "மாதுளை",
  "pineapple": "அன்னாசி",
  "juice": "ஜூஸ்",
  "shake": "ஷேக்",
  "milkshake": "மில்க் ஷேக்",
  "tea": "டீ",
  "coffee": "காபி",
  "milk": "பால்",
  "water": "தண்ணீர்",
  "soup": "சூப்",
  "roti": "ரொட்டி",
  "naan": "நான்",
  "butter": "பட்டர்",
  "ghee": "நெய்",
  "drinks": "பானங்கள்",
  "beverages": "பானங்கள்",
  "desserts": "இனிப்புகள்",
  "sweets": "இனிப்புகள்",
  "tiffin": "டிபன்",
  "breakfast": "காலை உணவு",
  "lunch": "மதிய உணவு",
  "dinner": "இரவு உணவு",
  "snacks": "சிற்றுண்டி",
};

/**
 * Automatically translates English food dish names or categories to Tamil
 */
export function autoTranslateToTamil(englishName: string): string {
  if (!englishName || !englishName.trim()) return "";
  const normalized = englishName.trim().toLowerCase();

  // 1. Exact match in dictionary
  if (EXACT_FOOD_MAP[normalized]) {
    return EXACT_FOOD_MAP[normalized];
  }

  // 2. Token-by-token word translation
  const words = normalized.split(/\s+/);
  const translatedWords = words.map((w) => WORD_MAP[w] || w);
  const joined = translatedWords.join(" ");

  // If at least one word was translated to Tamil, return the joined string
  if (translatedWords.some((w, i) => w !== words[i])) {
    return joined;
  }

  return englishName;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  isTamil: false,
  t: (key: string) => key,
  getFoodName: (food) => food.name,
  getCategoryName: (cat) => cat.name,
  getPortionName: (p) => (typeof p === "string" ? p : p?.portionName || ""),
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("hotel_pos_lang") as Language;
      if (saved === "en" || saved === "ta") {
        setLanguageState(saved);
      }
    } catch {
      // Ignore SSR / localStorage errors
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("hotel_pos_lang", lang);
    } catch {
      // Ignore
    }
  };

  const isTamil = language === "ta";

  const t = (key: string): string => {
    const item = translations[key];
    if (!item) return key;
    return isTamil ? item.ta : item.en;
  };

  const getFoodName = (food: { name: string; nameTamil?: string | null }): string => {
    if (isTamil) {
      if (food.nameTamil && food.nameTamil.trim().length > 0) {
        return food.nameTamil;
      }
      return autoTranslateToTamil(food.name);
    }
    return food.name;
  };

  const getCategoryName = (cat: { name: string; nameTamil?: string | null }): string => {
    if (isTamil) {
      if (cat.nameTamil && cat.nameTamil.trim().length > 0) {
        return cat.nameTamil;
      }
      return autoTranslateToTamil(cat.name);
    }
    return cat.name;
  };

  const getPortionName = (portion: string | { portionName: string; portionNameTamil?: string | null }): string => {
    const pName = typeof portion === "string" ? portion : (portion?.portionName || "");
    const pTamil = typeof portion === "string" ? null : portion?.portionNameTamil;
    if (!isTamil) return pName;
    if (pTamil && pTamil.trim().length > 0) return pTamil;
    const lower = pName.toLowerCase().trim();
    if (lower === "full" || lower === "full plate") return "முழு பிளேட்";
    if (lower === "half" || lower === "half / 1/2 plate" || lower === "1/2 plate") return "அரை பிளேட்";
    if (lower === "quarter" || lower === "quarter / 1/4 plate" || lower === "1/4 plate") return "கால் பிளேட்";
    if (lower === "regular" || lower === "regular cup" || lower === "regular bowl") return "சாதாரண";
    if (lower === "plate" || lower === "plates" || lower === "1 plate / set") return "பிளேட்";
    if (lower === "cup" || lower === "cups") return "கப்";
    if (lower === "set" || lower === "sets" || lower === "set (2 pcs)") return "செட் (2)";
    if (lower === "set (3 pcs)") return "செட் (3)";
    if (lower === "single piece" || lower === "single") return "ஒரு எண்";
    if (lower === "nos" || lower === "no") return "எண்";
    if (lower === "1 kg") return "1 கிலோ";
    if (lower === "500 grams (1/2 kg)" || lower === "1/2 kg") return "1/2 கிலோ";
    if (lower === "250 grams (1/4 kg)" || lower === "1/4 kg") return "1/4 கிலோ";
    return pName;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        isTamil,
        t,
        getFoodName,
        getCategoryName,
        getPortionName,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

