import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getLocalDateString(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized: Owner access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || undefined;
    const category = searchParams.get("category") || undefined;
    const fromDate = searchParams.get("fromDate") || undefined;
    const toDate = searchParams.get("toDate") || undefined;

    let whereClause: any = {};
    if (date) {
      whereClause.expenseDate = date;
    } else if (fromDate && toDate) {
      whereClause.expenseDate = { gte: fromDate, lte: toDate };
    }
    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: { name: true, username: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const todayStr = getLocalDateString();
    const todayExpenses = expenses.filter((e) => e.expenseDate === todayStr);
    const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    const categoryTotals: Record<string, number> = {};
    for (const e of expenses) {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    }

    return NextResponse.json({
      success: true,
      expenses,
      todayTotal,
      totalAmount,
      categoryTotals,
    });
  } catch (error: any) {
    console.error("GET /api/expenses error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized: Owner access required" }, { status: 403 });
    }

    const body = await req.json();
    const { title, category, amount, paymentMode, paidTo, notes, expenseDate } = body;

    if (!title || !category || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid expense data. Title, category, and positive amount are required." },
        { status: 400 }
      );
    }

    const targetDate = expenseDate || getLocalDateString();

    const expense = await prisma.expense.create({
      data: {
        title: title.trim(),
        category,
        amount: Number(amount),
        paymentMode: paymentMode || "CASH",
        paidTo: paidTo?.trim() || null,
        notes: notes?.trim() || null,
        expenseDate: targetDate,
        createdById: user.userId,
      },
      include: {
        createdBy: {
          select: { name: true, username: true },
        },
      },
    });

    return NextResponse.json({ success: true, expense });
  } catch (error: any) {
    console.error("POST /api/expenses error:", error);
    return NextResponse.json({ error: error.message || "Failed to create expense" }, { status: 500 });
  }
}
