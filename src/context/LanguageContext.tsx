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
  getPortionName: (portionName: string) => string;
}

const translations: Record<string, { en: string; ta: string }> = {
  // Navigation
  "nav.dashboard": { en: "Dashboard", ta: "முகப்பு" },
  "nav.pos": { en: "POS Bill", ta: "பில்லிங்" },
  "nav.bills": { en: "Bills", ta: "பில்கள்" },
  "nav.menu": { en: "Menu", ta: "மெனு" },
  "nav.stock": { en: "Stock", ta: "இருப்பு" },
  "nav.payments": { en: "Payments", ta: "கட்டணங்கள்" },
  "nav.cancelled": { en: "Cancelled", ta: "ரத்து பில்கள்" },
  "nav.dayClosing": { en: "Day Closing", ta: "நாள் முடிவு" },
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

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  isTamil: false,
  t: (key: string) => key,
  getFoodName: (food) => food.name,
  getCategoryName: (cat) => cat.name,
  getPortionName: (p) => p,
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
      return (food.nameTamil && food.nameTamil.trim().length > 0) ? food.nameTamil : food.name;
    }
    return food.name;
  };

  const getCategoryName = (cat: { name: string; nameTamil?: string | null }): string => {
    if (isTamil) {
      return (cat.nameTamil && cat.nameTamil.trim().length > 0) ? cat.nameTamil : cat.name;
    }
    return cat.name;
  };

  const getPortionName = (portionName: string): string => {
    if (!isTamil) return portionName;
    const lower = portionName.toLowerCase().trim();
    if (lower === "full") return "முழு";
    if (lower === "half") return "அரை";
    if (lower === "quarter") return "கால்";
    if (lower === "regular") return "சாதாரண";
    if (lower === "plate" || lower === "plates") return "பிளேட்";
    if (lower === "cup" || lower === "cups") return "கப்";
    if (lower === "set" || lower === "sets") return "செட்";
    if (lower === "nos" || lower === "no") return "எண்";
    return portionName;
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

