"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  Plus,
  Trash2,
  Calendar,
  Filter,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Tag,
  Receipt,
  FileText,
  Milk,
  Flame,
  Users,
  Wrench,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  IndianRupee
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface ExpenseItem {
  id: string;
  title: string;
  category: string;
  amount: number;
  paymentMode: string;
  paidTo?: string | null;
  notes?: string | null;
  expenseDate: string;
  createdAt: string;
  createdBy: {
    name: string;
    username: string;
  };
}

const CATEGORIES = [
  { id: "RAW_MATERIALS", label: "Raw Materials (மளிகை)", icon: ShoppingBag, color: "bg-orange-50 text-orange-700 border-orange-200" },
  { id: "VEGETABLES", label: "Vegetables (காய்கறிகள்)", icon: Tag, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "DAIRY", label: "Dairy / Milk (பால் / தயிர்)", icon: Milk, color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "FUEL_GAS", label: "Gas Cylinder (கேஸ்)", icon: Flame, color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "SALARY", label: "Staff Daily Wages (சம்பளம்)", icon: Users, color: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "MAINTENANCE", label: "Maintenance / Cleaning", icon: Wrench, color: "bg-rose-50 text-rose-700 border-rose-200" },
  { id: "OTHER", label: "Other Expenses (இதர)", icon: FileText, color: "bg-slate-50 text-slate-700 border-slate-200" },
];

const PRESETS = [
  { title: "Dairy / Milk 10L", category: "DAIRY", amount: 480, paymentMode: "CASH" },
  { title: "Market Vegetables & Onion", category: "VEGETABLES", amount: 1200, paymentMode: "CASH" },
  { title: "Commercial Gas Cylinder", category: "FUEL_GAS", amount: 1950, paymentMode: "UPI" },
  { title: "Master / Cook Daily Wage", category: "SALARY", amount: 800, paymentMode: "CASH" },
  { title: "Banana Leaves 100 Nos", category: "RAW_MATERIALS", amount: 350, paymentMode: "CASH" },
];

export default function ExpenseManager() {
  const { isTamil } = useLanguage();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [todayTotal, setTodayTotal] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [categoryTotals, setCategoryTotals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "RAW_MATERIALS",
    amount: "",
    paymentMode: "CASH",
    paidTo: "",
    notes: "",
    expenseDate: new Date().toISOString().split("T")[0],
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const url = selectedCategory !== "ALL" 
        ? `/api/expenses?category=${selectedCategory}`
        : "/api/expenses";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setExpenses(data.expenses || []);
        setTodayTotal(data.todayTotal || 0);
        setTotalAmount(data.totalAmount || 0);
        setCategoryTotals(data.categoryTotals || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedCategory]);

  const handleApplyPreset = (p: typeof PRESETS[0]) => {
    setForm({
      title: p.title,
      category: p.category,
      amount: String(p.amount),
      paymentMode: p.paymentMode,
      paidTo: "",
      notes: "Quick preset entry",
      expenseDate: new Date().toISOString().split("T")[0],
    });
    setShowModal(true);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount || Number(form.amount) <= 0) {
      alert("Please enter a valid title and amount");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          amount: parseFloat(form.amount),
          paymentMode: form.paymentMode,
          paidTo: form.paidTo,
          notes: form.notes,
          expenseDate: form.expenseDate,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setForm({
          title: "",
          category: "RAW_MATERIALS",
          amount: "",
          paymentMode: "CASH",
          paidTo: "",
          notes: "",
          expenseDate: new Date().toISOString().split("T")[0],
        });
        fetchExpenses();
      } else {
        alert(data.error || "Failed to record expense");
      }
    } catch (err: any) {
      alert(err.message || "Error adding expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm(isTamil ? "இந்த செலவை நீக்க விரும்புகிறீர்களா?" : "Are you sure you want to delete this expense?")) {
      return;
    }

    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchExpenses();
      } else {
        alert(data.error || "Failed to delete expense");
      }
    } catch (err: any) {
      alert(err.message || "Delete error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Top Banner Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-orange-500/20">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>{isTamil ? "ஹோட்டல் தினசரி செலவு மேலாண்மை" : "Expense & Purchases Manager"}</span>
              <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-black rounded-full uppercase tracking-wider shadow-xs">
                {isTamil ? "தினசரி வரவு-செலவு" : "Daily Ledger"}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isTamil 
                ? "பால், காய்கறி, கேஸ், ஊழியர் சம்பளம் மற்றும் கொள்முதல் செலவுகளை பதிவு செய்து உண்மை லாபத்தை அறியுங்கள்."
                : "Track daily vegetable, milk, cylinder, and wage expenses to compute real net profits."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-2xl shadow-md shadow-orange-500/20 flex items-center gap-2 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>{isTamil ? "+ புதிய செலவு பதிவு" : "+ Record New Expense"}</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Today Expenses */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>{isTamil ? "இன்றைய செலவு" : "Today's Expenses"}</span>
            <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            ₹{todayTotal.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-slate-400">
            {isTamil ? "இன்று பதிவு செய்யப்பட்ட மொத்த கொள்முதல்" : "Total expenses recorded for today"}
          </p>
        </div>

        {/* Total Expenses Recorded */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>{isTamil ? "மொத்த செலவுகள்" : "Total Recorded"}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            ₹{totalAmount.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-slate-400">
            {expenses.length} {isTamil ? "செலவு ரசீதுகள்" : "expense vouchers logged"}
          </p>
        </div>

        {/* Quick Top Expense Category */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>{isTamil ? "அதிக செலவு பிரிவு" : "Top Expense Category"}</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 truncate">
            {Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "—"}
          </div>
          <p className="text-[11px] text-slate-400">
            {isTamil ? "முக்கிய கொள்முதல் வகை" : "Primary expenditure category"}
          </p>
        </div>
      </div>

      {/* Quick 1-Click Presets Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          <span>{isTamil ? "விரைவு செலவு மாதிரிகள் (1-Click Presets):" : "Quick Presets (1-Click Fill):"}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="p-3 bg-orange-50/50 hover:bg-orange-100/70 border border-orange-200/80 rounded-2xl text-left transition-all group"
            >
              <div className="font-bold text-xs text-slate-900 truncate group-hover:text-orange-600">
                {p.title}
              </div>
              <div className="text-xs font-black text-orange-600 font-mono mt-1">
                ₹{p.amount}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Expense Ledger Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-orange-500" />
            <h2 className="text-base font-black text-slate-900">
              {isTamil ? "செலவுப் பட்டியல் (Expense Records)" : "Expense Ledger Records"}
            </h2>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                selectedCategory === "ALL"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {isTamil ? "அனைத்தும்" : "All"}
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                  selectedCategory === c.id
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {c.label.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-orange-500" />
            <span>{isTamil ? "ஏற்றுகிறது..." : "Loading expenses..."}</span>
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Wallet className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-bold">
              {isTamil ? "எந்த செலவும் பதிவு செய்யப்படவில்லை." : "No expenses recorded for this selection."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase">
                  <th className="p-3">{isTamil ? "தேதி" : "Date"}</th>
                  <th className="p-3">{isTamil ? "செலவு விவரம்" : "Expense Title"}</th>
                  <th className="p-3">{isTamil ? "வகை" : "Category"}</th>
                  <th className="p-3">{isTamil ? "முறை" : "Mode"}</th>
                  <th className="p-3">{isTamil ? "பெற்றவர் / குறிப்பு" : "Vendor / Notes"}</th>
                  <th className="p-3 text-right">{isTamil ? "தொகை" : "Amount"}</th>
                  <th className="p-3 text-center">{isTamil ? "செயல்" : "Action"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="p-3 font-mono text-slate-500 font-bold">
                      {exp.expenseDate}
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      {exp.title}
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 bg-orange-100 text-orange-800 rounded-lg text-[10px] font-black uppercase">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-md text-[10px]">
                        {exp.paymentMode}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">
                      {exp.paidTo && <span className="font-bold text-slate-700">{exp.paidTo} </span>}
                      {exp.notes && <span className="text-slate-400">({exp.notes})</span>}
                      {!exp.paidTo && !exp.notes && "—"}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-sm text-slate-900">
                      ₹{exp.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="font-black text-base text-slate-900">
                  {isTamil ? "புதிய செலவை பதிவு செய்க" : "Record New Expense"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  {isTamil ? "1. செலவு விவரம் (Title):" : "1. Expense Title:"}
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Milk 10 Litres / பால் கொள்முதல்"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    {isTamil ? "2. வகை (Category):" : "2. Category:"}
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    {isTamil ? "3. தொகை (Amount ₹):" : "3. Amount (₹):"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    {isTamil ? "4. செலுத்தும் முறை:" : "4. Payment Mode:"}
                  </label>
                  <select
                    value={form.paymentMode}
                    onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="CASH">💵 Cash (பணம்)</option>
                    <option value="UPI">📱 UPI / GPay</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    {isTamil ? "5. தேதி (Date):" : "5. Date:"}
                  </label>
                  <input
                    type="date"
                    value={form.expenseDate}
                    onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    {isTamil ? "சப்ளையர் பெயர் (Optional):" : "Paid To / Vendor:"}
                  </label>
                  <input
                    type="text"
                    value={form.paidTo}
                    onChange={(e) => setForm({ ...form, paidTo: e.target.value })}
                    placeholder="e.g. Senthil Milk / Anand Veg"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    {isTamil ? "குறிப்புகள் (Notes):" : "Notes:"}
                  </label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Bill no, remarks"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 rounded-xl"
                >
                  {isTamil ? "ரத்து" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-black text-white rounded-xl shadow-md shadow-orange-500/20 active:scale-[0.98] transition-all"
                >
                  {submitting ? "Saving..." : isTamil ? "சேமிக்க" : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
