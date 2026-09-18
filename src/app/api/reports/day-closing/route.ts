import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Helper to get local date string YYYY-MM-DD
function getLocalDateString(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// GET Day Closing Status, Live Preview & History
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized: Owner access required" }, { status: 403 });
    }

    const todayDate = getLocalDateString();

    // 1. Check if today is already closed
    const todayClosing = await prisma.dayClosing.findUnique({
      where: { closingDate: todayDate },
      include: {
        closedBy: { select: { name: true, username: true } },
      },
    });

    // 2. Calculate today's live metrics
    const bills = await prisma.bill.findMany({
      include: { items: true },
    });

    const payments = await prisma.payment.findMany();
    const cancellations = await prisma.cancellation.findMany({
      include: { bill: true },
    });

    // Food dietary map
    const foods = await prisma.foodItem.findMany({
      select: { name: true, dietary: true },
    });
    const foodDietaryMap: Record<string, string> = {};
    for (const f of foods) {
      foodDietaryMap[f.name] = f.dietary || "VEG";
    }

    let totalBills = bills.length;
    let paidBills = 0;
    let unpaidBills = 0;
    let cancelledBills = cancellations.length;
    let totalSales = 0;
    let outstandingAmount = 0;
    let cancelledAmount = 0;
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

    // Current Stock Snapshot
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

    // Past closings history
    const history = await prisma.dayClosing.findMany({
      include: {
        closedBy: { select: { name: true, username: true } },
      },
      orderBy: { closingDate: "desc" },
      take: 30,
    });

    return NextResponse.json({
      todayDate,
      isTodayClosed: Boolean(todayClosing),
      todayClosing,
      preview: {
        totalBills,
        paidBills,
        unpaidBills,
        cancelledBills,
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
      },
      history,
    });
  } catch (error: any) {
    console.error("Day Closing GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST Close Business Day (OWNER only)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized: Owner access required" }, { status: 403 });
    }

    const { notes } = await req.json();
    const todayDate = getLocalDateString();

    // Check duplicate closing
    const existing = await prisma.dayClosing.findUnique({
      where: { closingDate: todayDate },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Business day (${todayDate}) has already been closed. Duplicate closing is prevented.` },
        { status: 409 }
      );
    }

    // Recompute totals inside transaction
    const dayClosing = await prisma.$transaction(async (tx) => {
      const bills = await tx.bill.findMany({ include: { items: true } });
      const payments = await tx.payment.findMany();
      const cancellations = await tx.cancellation.findMany({ include: { bill: true } });

      let paidBills = 0;
      let unpaidBills = 0;
      let totalSales = 0;
      let outstandingAmount = 0;
      let cancelledAmount = 0;

      for (const b of bills) {
        if (b.status === "PAID") {
          paidBills++;
          totalSales += b.totalAmount;
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

      const stockItems = await tx.stock.findMany({
        include: {
          foodItem: { select: { name: true, category: { select: { name: true } } } },
        },
      });

      const stockSnapshot = stockItems.map((s) => ({
        foodName: s.foodItem.name,
        category: s.foodItem.category.name,
        quantity: s.currentQuantity,
        unitName: s.unitName,
        minThreshold: s.minThreshold,
      }));

      const created = await tx.dayClosing.create({
        data: {
          closingDate: todayDate,
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
          closingStockJson: JSON.stringify(stockSnapshot),
          closedById: user.userId,
          notes: notes?.trim() || null,
        },
        include: {
          closedBy: { select: { name: true, username: true } },
        },
      });

      return created;
    });

    return NextResponse.json({
      success: true,
      message: `Day closing completed successfully for ${todayDate}`,
      dayClosing,
    });
  } catch (error: any) {
    console.error("Day Closing POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
