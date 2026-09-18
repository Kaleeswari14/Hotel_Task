import React from "react";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import DashboardView from "./DashboardView";

export default async function OwnerDashboardPage() {
  const user = await getCurrentUser();

  // 1. Fetch Bills
  const bills = await prisma.bill.findMany({
    include: {
      items: true,
      payments: true,
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  let todaySales = 0;
  let todayOutstanding = 0;
  let paidBillsCount = 0;
  let unpaidBillsCount = 0;
  let cancelledBillsCount = 0;

  // Aggregate Top Sellers
  const itemSalesCount: Record<string, { name: string; count: number; revenue: number }> = {};

  for (const bill of bills) {
    if (bill.status === "PAID") {
      todaySales += bill.totalAmount;
      paidBillsCount++;

      for (const item of bill.items) {
        if (!itemSalesCount[item.foodName]) {
          itemSalesCount[item.foodName] = { name: item.foodName, count: 0, revenue: 0 };
        }
        itemSalesCount[item.foodName].count += item.quantity;
        itemSalesCount[item.foodName].revenue += item.subtotal;
      }
    } else if (bill.status === "UNPAID" || bill.status === "PARTIAL") {
      todayOutstanding += bill.balanceAmount;
      unpaidBillsCount++;
    } else if (bill.status === "CANCELLED") {
      cancelledBillsCount++;
    }
  }

  // 2. Fetch Payments (Actual Collected Income)
  const payments = await prisma.payment.findMany();
  let todayCollected = 0;
  let todayCash = 0;
  let todayUpi = 0;
  let todayCard = 0;

  for (const p of payments) {
    todayCollected += p.amount;
    if (p.paymentMethod === "CASH") todayCash += p.amount;
    else if (p.paymentMethod === "UPI") todayUpi += p.amount;
    else if (p.paymentMethod === "CARD") todayCard += p.amount;
  }

  // 3. Stock & Low Stock Items
  const allStock = await prisma.stock.findMany({
    include: {
      foodItem: { include: { category: true } },
    },
    orderBy: { currentQuantity: "asc" },
  });

  const lowStockItems = allStock.filter((s) => s.currentQuantity <= s.minThreshold);

  // 4. Food maps for Tamil names and dietary classification
  const foods = await prisma.foodItem.findMany({
    select: { name: true, nameTamil: true, dietary: true },
  });
  const foodTamilMap: Record<string, string> = {};
  const foodDietaryMap: Record<string, string> = {};
  for (const f of foods) {
    if (f.nameTamil) foodTamilMap[f.name] = f.nameTamil;
    foodDietaryMap[f.name] = f.dietary || "VEG";
  }

  // Dietary sales aggregation
  let todayVegSales = 0;
  let todayNonVegSales = 0;
  let todayEggSales = 0;
  let todayVegCount = 0;
  let todayNonVegCount = 0;
  let todayEggCount = 0;

  for (const bill of bills) {
    if (bill.status === "PAID") {
      for (const item of bill.items) {
        const diet = foodDietaryMap[item.foodName] || "VEG";
        if (diet === "NON_VEG") {
          todayNonVegSales += item.subtotal;
          todayNonVegCount += item.quantity;
        } else if (diet === "EGG") {
          todayEggSales += item.subtotal;
          todayEggCount += item.quantity;
        } else {
          todayVegSales += item.subtotal;
          todayVegCount += item.quantity;
        }
      }
    }
  }

  // Top 5 Sellers sorted by quantity with Tamil name & dietary support
  const topSellers = Object.values(itemSalesCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((item) => ({
      ...item,
      nameTamil: foodTamilMap[item.name] || null,
      dietary: foodDietaryMap[item.name] || "VEG",
    }));

  return (
    <DashboardView
      user={user ? { name: user.name, username: user.username, role: user.role } : null}
      bills={bills}
      payments={payments}
      allStock={allStock}
      lowStockItems={lowStockItems}
      topSellers={topSellers}
      todaySales={todaySales}
      todayOutstanding={todayOutstanding}
      paidBillsCount={paidBillsCount}
      unpaidBillsCount={unpaidBillsCount}
      cancelledBillsCount={cancelledBillsCount}
      todayCollected={todayCollected}
      todayCash={todayCash}
      todayUpi={todayUpi}
      todayCard={todayCard}
      todayVegSales={todayVegSales}
      todayNonVegSales={todayNonVegSales}
      todayEggSales={todayEggSales}
      todayVegCount={todayVegCount}
      todayNonVegCount={todayNonVegCount}
      todayEggCount={todayEggCount}
    />
  );
}
