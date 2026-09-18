import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import DayClosingView from "./DayClosingView";

function getLocalDateString(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default async function DayClosingPage() {
  const user = await getCurrentUser();
  const todayDate = getLocalDateString();

  const todayClosing = await prisma.dayClosing.findUnique({
    where: { closingDate: todayDate },
    include: {
      closedBy: { select: { name: true, username: true } },
    },
  });

  const bills = await prisma.bill.findMany({ include: { items: true } });
  const payments = await prisma.payment.findMany();
  const cancellations = await prisma.cancellation.findMany({ include: { bill: true } });

  let paidBills = 0;
  let unpaidBills = 0;
  let totalSales = 0;
  let outstandingAmount = 0;
  let cancelledAmount = 0;

  // Food dietary map
  const foods = await prisma.foodItem.findMany({
    select: { name: true, dietary: true },
  });
  const foodDietaryMap: Record<string, string> = {};
  for (const f of foods) {
    foodDietaryMap[f.name] = f.dietary || "VEG";
  }

  let todayVegSales = 0;
  let todayNonVegSales = 0;
  let todayEggSales = 0;
  let todayVegCount = 0;
  let todayNonVegCount = 0;
  let todayEggCount = 0;

  for (const b of bills) {
    if (b.status === "PAID") {
      paidBills++;
      totalSales += b.totalAmount;

      for (const item of b.items) {
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
    } else if (b.status === "UNPAID" || b.status === "PARTIAL") {
      unpaidBills++;
      outstandingAmount += b.balanceAmount;
    }
  }

  for (const c of cancellations) {
    cancelledAmount += c.bill.totalAmount;
  }

  let totalCollected = 0;
  let cashCollected = 0;
  let upiCollected = 0;
  let cardCollected = 0;

  for (const p of payments) {
    totalCollected += p.amount;
    if (p.paymentMethod === "CASH") cashCollected += p.amount;
    else if (p.paymentMethod === "UPI") upiCollected += p.amount;
    else if (p.paymentMethod === "CARD") cardCollected += p.amount;
  }

  const stockItems = await prisma.stock.findMany({
    include: {
      foodItem: { select: { name: true, nameTamil: true, dietary: true, category: { select: { name: true } } } },
    },
    orderBy: { foodItem: { name: "asc" } },
  });

  const stockSnapshot = stockItems.map((s) => ({
    foodName: s.foodItem.name,
    nameTamil: s.foodItem.nameTamil || null,
    category: s.foodItem.category.name,
    dietary: s.foodItem.dietary || "VEG",
    quantity: s.currentQuantity,
    unitName: s.unitName,
    minThreshold: s.minThreshold,
  }));

  const history = await prisma.dayClosing.findMany({
    include: {
      closedBy: { select: { name: true, username: true } },
    },
    orderBy: { closingDate: "desc" },
    take: 30,
  });

  return (
    <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
      <DayClosingView
        todayDate={todayDate}
        initialIsClosed={Boolean(todayClosing)}
        initialTodayClosing={todayClosing as any}
        initialPreview={{
          totalBills: bills.length,
          paidBills,
          unpaidBills,
          cancelledBills: cancellations.length,
          totalSales,
          totalCollected,
          cashCollected,
          upiCollected,
          cardCollected,
          outstandingAmount,
          cancelledAmount,
          todayVegSales,
          todayNonVegSales,
          todayEggSales,
          todayVegCount,
          todayNonVegCount,
          todayEggCount,
          stockSnapshot,
        }}
        initialHistory={history as any}
      />
    </div>
  );
}
