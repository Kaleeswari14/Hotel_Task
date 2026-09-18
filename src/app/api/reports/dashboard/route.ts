import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET live dashboard metrics for Owner
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized: Owner access required" }, { status: 403 });
    }

    // 1. Fetch Today's Bills
    const bills = await prisma.bill.findMany({
      include: {
        items: true,
        payments: true,
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    let todaySales = 0;
    let todayCollected = 0;
    let todayCash = 0;
    let todayUpi = 0;
    let todayCard = 0;
    let todayOutstanding = 0;
    let paidBillsCount = 0;
    let unpaidBillsCount = 0;
    let cancelledBillsCount = 0;

    // Item sales aggregation for top sellers
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

    // 2. Fetch Payments (Collected Income)
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
    });

    for (const p of payments) {
      todayCollected += p.amount;
      if (p.paymentMethod === "CASH") todayCash += p.amount;
      else if (p.paymentMethod === "UPI") todayUpi += p.amount;
      else if (p.paymentMethod === "CARD") todayCard += p.amount;
    }

    // 3. Stock metrics & Low stock warnings
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

    // Dietary sales breakdown
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

    // Top 5 selling dishes with dietary info
    const topSellers = Object.values(itemSalesCount)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((item) => ({
        ...item,
        nameTamil: foodTamilMap[item.name] || null,
        dietary: foodDietaryMap[item.name] || "VEG",
      }));

    return NextResponse.json({
      todaySales,
      todayCollected,
      todayCash,
      todayUpi,
      todayCard,
      todayOutstanding,
      paidBillsCount,
      unpaidBillsCount,
      cancelledBillsCount,
      todayVegSales,
      todayNonVegSales,
      todayEggSales,
      todayVegCount,
      todayNonVegCount,
      todayEggCount,
      totalStockItems: allStock.length,
      lowStockCount: lowStockItems.length,
      lowStockItems,
      topSellers,
      recentBills: bills.slice(0, 8),
    });
  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
