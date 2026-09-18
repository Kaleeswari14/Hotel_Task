import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET all bills (with filters for status: UNPAID, PAID, CANCELLED, etc.)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // "UNPAID" | "PAID" | "CANCELLED" | "ALL"
    const orderType = searchParams.get("orderType");
    const query = searchParams.get("query");

    const whereClause: any = {};

    if (status && status !== "ALL") {
      if (status === "ACTIVE_UNPAID") {
        whereClause.status = { in: ["UNPAID", "PARTIAL"] };
      } else {
        whereClause.status = status;
      }
    }

    if (orderType && orderType !== "ALL") {
      whereClause.orderType = orderType;
    }

    if (query && query.trim()) {
      const q = query.trim();
      const numQuery = parseInt(q, 10);
      whereClause.OR = [
        { orderReference: { contains: q } },
        ...(!isNaN(numQuery) ? [{ billNumber: numQuery }] : []),
      ];
    }

    const bills = await prisma.bill.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            portion: true,
          },
        },
        createdBy: {
          select: { id: true, name: true, username: true, role: true },
        },
        payments: true,
        cancellation: {
          include: {
            cancelledBy: { select: { name: true, username: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bills);
  } catch (error: any) {
    console.error("GET Bills Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create new bill (Status is strictly UNPAID - ZERO stock/financial deductions)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized: Please log in" }, { status: 401 });
    }

    const body = await req.json();
    const { customerName, customerPhone, items, discount = 0 } = body;
    const rawOrderType = body.orderType;
    const orderType = rawOrderType && ["TABLE", "TOKEN", "PARCEL"].includes(rawOrderType) ? rawOrderType : "TOKEN";
    const orderReference = (body.orderReference && body.orderReference.trim()) ? body.orderReference.trim() : "Counter";

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one food item must be added to create a bill" }, { status: 400 });
    }

    // Calculate totals
    let subtotal = 0;
    const billItemsData: any[] = [];

    for (const item of items) {
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const quantity = parseInt(item.quantity, 10) || 1;
      const itemSubtotal = unitPrice * quantity;
      subtotal += itemSubtotal;

      billItemsData.push({
        foodItemId: item.foodItemId,
        foodName: item.foodName,
        portionId: item.portionId || null,
        portionName: item.portionName,
        unitMultiplier: parseFloat(item.unitMultiplier) || 1.0,
        unitPrice,
        quantity,
        subtotal: itemSubtotal,
      });
    }

    const discountAmount = Math.max(0, parseFloat(discount) || 0);
    const totalAmount = Math.max(0, subtotal - discountAmount);

    // Database transaction to get next Bill Number and create Bill + Items atomically
    const newBill = await prisma.$transaction(async (tx) => {
      // Find highest bill number, start from 1001
      const lastBill = await tx.bill.findFirst({
        orderBy: { billNumber: "desc" },
        select: { billNumber: true },
      });

      const nextBillNumber = lastBill ? lastBill.billNumber + 1 : 1001;

      const created = await tx.bill.create({
        data: {
          billNumber: nextBillNumber,
          orderType,
          orderReference: orderReference.trim(),
          customerName: customerName?.trim() || null,
          customerPhone: customerPhone?.trim() || null,
          subtotal,
          discount: discountAmount,
          totalAmount,
          paidAmount: 0,
          balanceAmount: totalAmount,
          status: "UNPAID", // CRITICAL INVARIANT: status is UNPAID, NO stock/sales/income touched
          createdById: user.userId,
          items: {
            create: billItemsData,
          },
        },
        include: {
          items: true,
          createdBy: { select: { id: true, name: true, username: true } },
        },
      });

      return created;
    });

    return NextResponse.json(newBill, { status: 201 });
  } catch (error: any) {
    console.error("Create Bill Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
