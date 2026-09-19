"use client";

import React, { useState, useEffect } from "react";
import {
  Edit3,
  Plus,
  Minus,
  Trash2,
  X,
  Check,
  Search,
  Tag,
  UtensilsCrossed,
  Layers,
  Save,
  AlertTriangle
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useLanguage } from "@/context/LanguageContext";

interface BillItem {
  id?: string;
  foodItemId: string;
  foodName: string;
  portionId?: string | null;
  portionName: string;
  unitMultiplier: number;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface Bill {
  id: string;
  billNumber: number;
  orderType: string;
  orderReference: string;
  customerName?: string | null;
  customerPhone?: string | null;
  subtotal: number;
  discount: number;
  totalAmount: number;
  status: string;
  items: BillItem[];
}

interface EditBillModalProps {
  bill: Bill;
  onClose: () => void;
  onSaveSuccess: (updatedBill: any) => void;
}

export default function EditBillModal({
  bill,
  onClose,
  onSaveSuccess,
}: EditBillModalProps) {
  const { getFoodName, getPortionName } = useLanguage();
  const [orderType, setOrderType] = useState(bill.orderType);
  const [orderReference, setOrderReference] = useState(bill.orderReference);
  const [customerName, setCustomerName] = useState(bill.customerName || "");
  const [customerPhone, setCustomerPhone] = useState(bill.customerPhone || "");
  const [discount, setDiscount] = useState(String(bill.discount || 0));
  const [items, setItems] = useState<BillItem[]>(
    (bill.items || []).map((it: any) => ({
      id: it.id,
      foodItemId: it.foodItemId || it.foodItem?.id || "",
      foodName: it.foodName || it.foodItem?.name || "Dish Item",
      portionId: it.portionId || it.portion?.id || null,
      portionName: it.portionName || it.portion?.portionName || "Portion",
      unitMultiplier: it.unitMultiplier || it.portion?.unitMultiplier || 1.0,
      unitPrice: it.unitPrice || 0,
      quantity: it.quantity || 1,
      subtotal: it.subtotal || (it.unitPrice || 0) * (it.quantity || 1),
    }))
  );

  // Available foods catalog for adding new items
  const [availableFoods, setAvailableFoods] = useState<any[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [searchFood, setSearchFood] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/foods")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAvailableFoods(data);
      })
      .catch((err) => console.error(err));
  }, []);

  // Update item quantity
  const updateQuantity = (index: number, delta: number) => {
    const updated = [...items];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      setItems(items.filter((_, i) => i !== index));
      return;
    }
    updated[index].quantity = newQty;
    updated[index].subtotal = updated[index].unitPrice * newQty;
    setItems(updated);
  };

  // Remove item from bill
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Add portion from food catalog
  const addFoodPortion = (food: any, portion: any) => {
    const existingIdx = items.findIndex(
      (it) => it.foodItemId === food.id && it.portionId === portion.id
    );

    if (existingIdx > -1) {
      updateQuantity(existingIdx, 1);
    } else {
      setItems([
        ...items,
        {
          foodItemId: food.id,
          foodName: food.name,
          portionId: portion.id,
          portionName: portion.portionName,
          unitMultiplier: portion.unitMultiplier,
          unitPrice: portion.price,
          quantity: 1,
          subtotal: portion.price,
        },
      ]);
    }
  };

  // Totals calculations
  const subtotal = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  const discountVal = Math.min(subtotal, Math.max(0, parseFloat(discount) || 0));
  const grandTotal = Math.max(0, subtotal - discountVal);

  // Save changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError("Bill must have at least one food item.");
      return;
    }

    if (!orderReference.trim()) {
      setError("Order reference (Table/Token) is required.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bills/${bill.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType,
          orderReference: orderReference.trim(),
          customerName: customerName.trim() || null,
          customerPhone: customerPhone.trim() || null,
          items,
          discount: discountVal,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update bill");

      onSaveSuccess(data);
    } catch (err: any) {
      setError(err.message || "Failed to update bill");
    } finally {
      setLoading(false);
    }
  };

  const filteredFoods = availableFoods.filter((f) =>
    f.name.toLowerCase().includes(searchFood.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 my-6 animate-scale-up">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg leading-tight">
                Edit Bill #{bill.billNumber}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Modify items, quantities, customer or order details
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-4">
          {/* Order Type, Reference & Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Order Type:
              </label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="TABLE">🪑 Table</option>
                <option value="TOKEN">🎟️ Token</option>
                <option value="PARCEL">🥡 Parcel / Takeaway</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Order Reference / Table No:
              </label>
              <input
                type="text"
                value={orderReference}
                onChange={(e) => setOrderReference(e.target.value)}
                placeholder="e.g. Table 4 / Token 12"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Customer Name:
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Optional customer name"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Customer Phone (WhatsApp):
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Current Items List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase text-slate-600 tracking-wider">
                Bill Items ({items.length})
              </span>
              <button
                type="button"
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddMenu ? "Hide Catalog" : "+ Add More Food"}</span>
              </button>
            </div>

            {/* Food Catalog Drawer (if adding new items) */}
            {showAddMenu && (
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl mb-3 space-y-2 max-h-48 overflow-y-auto">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchFood}
                    onChange={(e) => setSearchFood(e.target.value)}
                    placeholder="Search menu dishes to add..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {filteredFoods.map((food) => (
                    <div
                      key={food.id}
                      className="p-2 bg-white rounded-xl border border-slate-200 text-xs flex flex-col justify-between gap-1"
                    >
                      <span className="font-bold text-slate-900">{getFoodName({ name: food.name, nameTamil: (food as any).nameTamil })}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {food.portions.map((p: any) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => addFoodPortion(food, p)}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 rounded text-[10px] font-bold transition-all"
                          >
                            + {getPortionName({ portionName: p.portionName, portionNameTamil: p.portionNameTamil })} (₹{p.price})
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Items Stepper List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-bold text-slate-900 truncate">{getFoodName({ name: item.foodName, nameTamil: (item as any).foodNameTamil })}</div>
                    <div className="text-[11px] text-slate-500">
                      {getPortionName({ portionName: item.portionName, portionNameTamil: (item as any).portionNameTamil })} &bull; ₹{item.unitPrice} each
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => updateQuantity(idx, -1)}
                        className="w-6 h-6 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center font-black text-xs text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(idx, 1)}
                        className="w-6 h-6 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-black text-slate-900 w-14 text-right">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-300 rounded-xl">
                  No items left in this bill. Add food items from the catalog above.
                </div>
              )}
            </div>
          </div>

          {/* Discount & Totals */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-600">Discount (₹):</span>
              <input
                type="number"
                min="0"
                step="1"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-24 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-right font-bold text-xs"
              />
            </div>

            <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
            </div>

            {discountVal > 0 && (
              <div className="flex justify-between text-amber-700 font-semibold">
                <span>Discount:</span>
                <span>-{formatCurrency(discountVal)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
              <span>Updated Total:</span>
              <span className="text-orange-600 text-base">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-orange-700 text-white font-black rounded-xl text-xs shadow-md shadow-orange-500/20 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? "Saving Changes..." : "Save & Update Bill"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}