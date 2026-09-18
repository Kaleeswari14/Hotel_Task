"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "ta" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isTamil: boolean;
  t: (key: string) => string;
}

const translations: Record<string, { en: string; ta: string }> = {
  // Navigation
  "nav.dashboard": { en: "Dashboard", ta: "டாஷ்போர்டு" },
  "nav.pos": { en: "New Bill (POS)", ta: "புதிய பில் (POS)" },
  "nav.bills": { en: "Bills & Unpaid", ta: "ரசீதுகள் & நிலுவை" },
  "nav.menu": { en: "Food & Menu", ta: "உணவு & மெனு" },
  "nav.stock": { en: "Stock & Alerts", ta: "சரக்கு இருப்பு & அலர்ட்" },
  "nav.payments": { en: "Payment History", ta: "பணப் பரிவர்த்தனை" },
  "nav.cancelled": { en: "Cancelled Bills", ta: "ரத்து செய்த பில்கள்" },
  "nav.dayClosing": { en: "Day Closing", ta: "நாள் முடிவு கணக்கு" },
  "nav.whatsapp": { en: "WhatsApp API", ta: "WhatsApp அமைப்பு" },
  "nav.logout": { en: "Log Out", ta: "வெளியேறு" },
  "nav.roleOwner": { en: "OWNER", ta: "உரிமையாளர்" },
  "nav.roleStaff": { en: "STAFF", ta: "பணியாளர்" },
  "nav.subtitle": { en: "Point of Sale System", ta: "ஹோட்டல் பில்லிங் மென்பொருள்" },

  // POS
  "pos.title": { en: "POS Billing Terminal", ta: "பில்லிங் கவுண்டர் (POS)" },
  "pos.subtitle": { en: "Instant touch billing, table management and thermal receipts", ta: "விரைவான தொடுதிரை பில்லிங், டேபிள் மற்றும் ரசீது அச்சிடுதல்" },
  "pos.searchPlaceholder": { en: "Search food by name or code...", ta: "உணவு பெயரை தேடுங்கள்..." },
  "pos.allCategories": { en: "All Dishes", ta: "அனைத்து உணவுகள்" },
  "pos.orderType.table": { en: "Dine-In (Table)", ta: "டேபிள் (உள்ளே அமர்ந்து)" },
  "pos.orderType.token": { en: "Token", ta: "டோக்கன்" },
  "pos.orderType.parcel": { en: "Takeaway (Parcel)", ta: "பார்சல் (எடுத்துச்செல்ல)" },
  "pos.customerName": { en: "Customer Name", ta: "வாடிக்கையாளர் பெயர்" },
  "pos.customerPhone": { en: "Mobile Number", ta: "மொபைல் எண் (WhatsApp பில்)" },
  "pos.optional": { en: "Optional", ta: "விருப்பம்" },
  "pos.allSessions": { en: "All Sessions", ta: "அனைத்து நேரம்" },
  "pos.morning": { en: "Morning Breakfast", ta: "காலை உணவு" },
  "pos.afternoon": { en: "Afternoon Lunch", ta: "மதிய உணவு" },
  "pos.snacks": { en: "Snacks and Tea", ta: "மாலை சிற்றுண்டி" },
  "pos.night": { en: "Dinner and Night", ta: "இரவு உணவு" },
  "pos.cartTitle": { en: "Current Bill Items", ta: "தேர்ந்தெடுத்த உணவுகள்" },
  "pos.cartEmpty": { en: "No items selected", ta: "கூடை காலியாக உள்ளது" },
  "pos.cartEmptySubtitle": { en: "Tap on food items on the left to add them to this bill", ta: "இடப்பக்கத்தில் உள்ள உணவை கிளிக் செய்து சேர்க்கவும்" },
  "pos.item": { en: "Item", ta: "உணவு" },
  "pos.portion": { en: "Portion", ta: "அளவு" },
  "pos.qty": { en: "Qty", ta: "எண்ணிக்கை" },
  "pos.price": { en: "Price", ta: "விலை" },
  "pos.amount": { en: "Amount", ta: "தொகை" },
  "pos.subtotal": { en: "Subtotal", ta: "கூட்டுத்தொகை" },
  "pos.discount": { en: "Discount (₹)", ta: "தள்ளுபடி (₹)" },
  "pos.netTotal": { en: "Net Total", ta: "நிகர மொத்தத் தொகை" },
  "pos.totalPayable": { en: "Total Payable", ta: "செலுத்த வேண்டிய மொத்த தொகை" },
  "pos.clearCart": { en: "Clear Bill", ta: "அனைத்தும் அழி" },
  "pos.saveOrder": { en: "Save Unpaid / Hold", ta: "பில் நிலுவையில் வை" },
  "pos.paySettle": { en: "Pay & Print Bill", ta: "பணம் பெற்று பில் போடு" },
  "pos.outOfStock": { en: "Out of Stock", ta: "இருப்பு இல்லை" },
  "pos.lowStock": { en: "Low Stock", ta: "குறைந்த இருப்பு" },
  "pos.inStock": { en: "In Stock", ta: "இருப்பில் உள்ளது" },
  "pos.selectPortion": { en: "Select Portion", ta: "அளவை தேர்வு செய்" },
  "pos.activeTables": { en: "Active Dining Tables", ta: "டேபிள் பட்டியல்" },
  "pos.tableOccupied": { en: "Occupied", ta: "நிரம்பியுள்ளது" },
  "pos.tableAvailable": { en: "Available", ta: "காலியாக உள்ளது" },

  // Menu Manager
  "menu.title": { en: "Food & Menu Management", ta: "உணவு & மெனு மேலாண்மை" },
  "menu.subtitle": { en: "Configure dishes, multi-portion rates, meal timing sessions, and live stock tracking", ta: "உணவு வகைகள், அளவு விலைகள், பரிமாறும் நேரங்கள் மற்றும் இருப்பு அமைப்புகள்" },
  "menu.addDish": { en: "+ Add New Dish", ta: "+ புதிய உணவு சேர்க்க" },
  "menu.searchFood": { en: "Search dishes...", ta: "உணவு பெயரை தேடுங்கள்..." },
  "menu.allCategories": { en: "All Categories", ta: "அனைத்து வகைகள்" },
  "menu.activeCount": { en: "Active Dishes", ta: "செயலில் உள்ள உணவுகள்" },
  "menu.columnDish": { en: "Dish Details", ta: "உணவு விபரம்" },
  "menu.columnCategory": { en: "Category", ta: "உணவு வகை" },
  "menu.columnPortions": { en: "Portions & Rates", ta: "அளவு & விலை விபரம்" },
  "menu.columnStock": { en: "Stock Level", ta: "இருப்பு அளவு" },
  "menu.columnTimings": { en: "Meal Sessions", ta: "பரிமாறும் நேரம்" },
  "menu.columnStatus": { en: "Status", ta: "நிலை" },
  "menu.columnActions": { en: "Actions", ta: "செயல்கள்" },
  "menu.edit": { en: "Edit", ta: "திருத்து" },
  "menu.delete": { en: "Delete", ta: "நீக்கு" },
  "menu.active": { en: "Active", ta: "செயலில்" },
  "menu.inactive": { en: "Inactive", ta: "முடக்கப்பட்டது" },
  "menu.modalAddTitle": { en: "Add New Hotel Dish", ta: "புதிய உணவு சேர்க்க" },
  "menu.modalEditTitle": { en: "Edit Food Dish", ta: "உணவு விவரங்களை திருத்து" },
  "menu.dishNameEn": { en: "Food Name (English)", ta: "உணவு பெயர் (ஆங்கிலம்)" },
  "menu.dishNameTa": { en: "Food Name (Tamil)", ta: "உணவு பெயர் (தமிழ்)" },
  "menu.categoryLabel": { en: "Category", ta: "உணவு வகை" },
  "menu.quickPresets": { en: "Quick Portion & Unit Presets", ta: "துரித அளவு & யூனிட் அமைப்புகள்" },
  "menu.portionsLabel": { en: "Portion Pricing Tiers", ta: "அளவு & விலை அமைப்புகள்" },
  "menu.stockLabel": { en: "Stock Inventory Tracking", ta: "சரக்கு இருப்பு கண்காணிப்பு" },
  "menu.timingsLabel": { en: "Available Meal Timings", ta: "உணவு பரிமாறும் நேரம்" },
  "menu.saveBtn": { en: "Save Dish", ta: "உணவை சேமிக்கவும்" },
  "menu.cancelBtn": { en: "Cancel", ta: "ரத்து செய்" },
  "menu.trackStock": { en: "Track Stock for this food", ta: "இந்த உணவிற்கு இருப்பு கண்காணிக்க" },
  "menu.stockQty": { en: "Current Stock", ta: "தற்போதைய இருப்பு" },
  "menu.minThreshold": { en: "Min Alert Threshold", ta: "குறைந்தபட்ச எச்சரிக்கை அளவு" },
  "menu.unitLabel": { en: "Unit (Plates, Nos, Cups, Kg)", ta: "அலகு (பிளேட், எண், கப், கிலோ)" },

  // Bills Queue
  "bills.title": { en: "Bills & Order Queue", ta: "ரசீதுகள் & நிலுவைப் பட்டியல்" },
  "bills.subtitle": { en: "Real-time orders, payment settlements, cancellations and thermal re-prints", ta: "நிகழ்நேர பில்கள், பணம் வசூலித்தல் மற்றும் ரசீது அச்சிடுதல்" },
  "bills.filterActive": { en: "Active / Unpaid", ta: "நிலுவையில் உள்ளவை" },
  "bills.filterPaid": { en: "Paid / Settled", ta: "பணம் செலுத்தியவை" },
  "bills.filterCancelled": { en: "Cancelled", ta: "ரத்து செய்தவை" },
  "bills.filterAll": { en: "All Bills", ta: "அனைத்து பில்கள்" },
  "bills.searchPlaceholder": { en: "Search bill #, table, customer phone...", ta: "பில் எண், டேபிள், தொலைபேசி தேடுங்கள்..." },
  "bills.billNo": { en: "Bill #", ta: "பில் எண் #" },
  "bills.time": { en: "Time", ta: "நேரம்" },
  "bills.type": { en: "Type", ta: "வகை" },
  "bills.items": { en: "Items", ta: "உணவுகள்" },
  "bills.total": { en: "Total Amount", ta: "மொத்த தொகை" },
  "bills.paid": { en: "Paid", ta: "வசூலானது" },
  "bills.balance": { en: "Balance Due", ta: "நிலுவைத் தொகை" },
  "bills.payBtn": { en: "Settle Payment", ta: "பணம் பெறுக" },
  "bills.printBtn": { en: "Print Receipt", ta: "ரசீது அச்சிடு" },
  "bills.editBtn": { en: "Edit Bill", ta: "பில் திருத்து" },
  "bills.cancelBtn": { en: "Cancel Bill", ta: "பில் ரத்து செய்" },
  "bills.noBills": { en: "No bills found", ta: "பில்கள் எதுவும் இல்லை" },

  // Stock
  "stock.title": { en: "Stock & Inventory Manager", ta: "சரக்கு இருப்பு & எச்சரிக்கைகள்" },
  "stock.subtitle": { en: "Monitor real-time kitchen inventory, low stock warnings, and quick refills", ta: "சமையலறை இருப்பு கண்காணிப்பு, குறைவு எச்சரிக்கை மற்றும் உடனடி இருப்பு சேர்க்கை" },
  "stock.lowAlerts": { en: "Low Stock Items", ta: "குறைந்த இருப்பு எச்சரிக்கை" },
  "stock.inStock": { en: "Healthy Stock", ta: "போதுமான இருப்பு" },
  "stock.quickAdd": { en: "Quick Restock", ta: "உடனடி இருப்பு சேர்க்க" },
  "stock.adjust": { en: "Adjust Stock", ta: "இருப்பு திருத்து" },
  "stock.current": { en: "Current Quantity", ta: "தற்போதைய அளவு" },
  "stock.threshold": { en: "Alert Limit", ta: "எச்சரிக்கை வரம்பு" },

  // Payment History
  "payments.title": { en: "Payment Transactions History", ta: "பணப் பரிவர்த்தனை வரலாறு" },
  "payments.subtitle": { en: "Track all collections through Cash, UPI / QR, and Debit/Credit Cards", ta: "ரொக்கம், UPI / QR, மற்றும் கார்டு மூலமாக வசூலான மொத்த பணப் பதிவுகள்" },
  "payments.totalCollected": { en: "Total Collections", ta: "மொத்த வசூல்" },
  "payments.cash": { en: "Cash", ta: "ரொக்கம்" },
  "payments.upi": { en: "UPI / QR", ta: "UPI / QR குறியீடு" },
  "payments.card": { en: "Card", ta: "கார்டு" },

  // Day Closing
  "dayClosing.title": { en: "Day Closing & Daily Settlement", ta: "நாள் முடிவு & தினசரி கணக்கு அறிக்கை" },
  "dayClosing.subtitle": { en: "End-of-day sales reconciliation, cash in drawer balance, and staff audit", ta: "தினசரி விற்பனை கணக்கு முடித்தல் மற்றும் பணப்பெட்டி சமரசம்" },
  "dayClosing.grossSales": { en: "Gross Sales", ta: "மொத்த விற்பனை" },
  "dayClosing.collected": { en: "Net Collected", ta: "வசூலான ரொக்கம் & UPI" },
  "dayClosing.unpaid": { en: "Unpaid Balance", ta: "நிலுவைத் தொகை" },
  "dayClosing.totalBills": { en: "Total Bills Issued", ta: "வழங்கப்பட்ட பில்கள்" },
  "dayClosing.closeRegister": { en: "Perform Day Closing", ta: "இன்றைய கணக்கை முடிக்க" },

  // WhatsApp
  "whatsapp.title": { en: "WhatsApp Automated Billing & Promo", ta: "WhatsApp தானியங்கி பில் & விளம்பர அமைப்பு" },
  "whatsapp.subtitle": { en: "Instant digital receipt messages to customer phones with discount coupons", ta: "வாடிக்கையாளர் மொபைலுக்கு தானியங்கி பில் மற்றும் தள்ளுபடி சலுகை செய்திகள்" },

  // Cancelled Bills
  "cancelled.title": { en: "Cancelled Bills Audit Log", ta: "ரத்து செய்யப்பட்ட பில்களின் பதிவு" },
  "cancelled.subtitle": { en: "Full security audit history of voided orders with owner authorization", ta: "உரிமையாளர் அனுமதியுடன் ரத்து செய்யப்பட்ட பில்களின் முழுமையான தணிக்கை பதிவு" },

  // Payment Modal
  "modal.payTitle": { en: "Settle Payment for Bill #", ta: "பில் # க்கான பணம் பெறுதல்" },
  "modal.totalDue": { en: "Total Due", ta: "மொத்த தொகை" },
  "modal.alreadyPaid": { en: "Already Paid", ta: "முன்பு செலுத்தியது" },
  "modal.balanceDue": { en: "Balance to Pay", ta: "செலுத்த வேண்டிய நிலுவை" },
  "modal.payMethod": { en: "Payment Method", ta: "பணம் செலுத்தும் முறை" },
  "modal.cash": { en: "Cash", ta: "ரொக்கம்" },
  "modal.upi": { en: "UPI / QR", ta: "UPI / QR" },
  "modal.card": { en: "Card", ta: "கார்டு" },
  "modal.tendered": { en: "Tendered Amount (₹)", ta: "பெற்ற தொகை (₹)" },
  "modal.change": { en: "Change to Return", ta: "மீதம் கொடுக்க வேண்டிய தொகை" },
  "modal.confirmPay": { en: "Confirm & Complete Payment", ta: "பணத்தை உறுதி செய்து பில் முடிக்க" },
  "modal.cancel": { en: "Cancel", ta: "ரத்து செய்" }
};

const LanguageContext = createContext<LanguageContextType>({
  language: "ta",
  setLanguage: () => {},
  isTamil: true,
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("ta");

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("hotel_pos_lang") as Language;
      if (savedLang === "en" || savedLang === "ta") {
        setLanguageState(savedLang);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("hotel_pos_lang", lang);
    } catch {
      // Ignore localStorage errors
    }
  };

  const t = (key: string): string => {
    const item = translations[key];
    if (!item) return key;
    return language === "ta" ? item.ta : item.en;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        isTamil: language === "ta",
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
