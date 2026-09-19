import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Public endpoint for customers to place self-orders from table QR code
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tableId,
      customerName,
      customerPhone,
      items,
      notes,
    } = body;

    if (!tableId) {
      return NextResponse.json({ error: "Table identifier is required" }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Please select at least one item to order" }, { status: 400 });
    }

    // Default to system user/owner if no staff logged in
    const defaultStaff = await prisma.user.findFirst({
      where: { role: "OWNER" },
    });

    if (!defaultStaff) {
      return NextResponse.json({ error: "Hotel system is not ready. Contact counter." }, { status: 500 });
    }

    let subtotal = 0;
    const billItemsData: any[] = [];

    for (const item of items) {
      const food = await prisma.foodItem.findUnique({
        where: { id: item.foodItemId },
        include: { portions: true },
      });

      if (!food) continue;

      const portion = item.portionId
        ? food.portions.find((p) => p.id === item.portionId)
        : food.portions[0];

      const portionName = portion ? portion.portionName : "1 Plate";
      const unitMultiplier = portion ? portion.unitMultiplier : 1.0;
      const unitPrice = portion ? portion.price : 0;
      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      const itemSubtotal = unitPrice * quantity;

      subtotal += itemSubtotal;

      billItemsData.push({
        foodItemId: food.id,
        foodName: food.name,
        portionId: portion?.id || null,
        portionName: portionName,
        unitMultiplier: unitMultiplier,
        unitPrice: unitPrice,
        quantity: quantity,
        subtotal: itemSubtotal,
      });
    }

    if (billItemsData.length === 0) {
      return NextResponse.json({ error: "Selected items are no longer available." }, { status: 400 });
    }

    const totalAmount = subtotal;

    // Create Table Order / KOT Bill in DB
    const newBill = await prisma.$transaction(async (tx) => {
      const lastBill = await tx.bill.findFirst({
        orderBy: { billNumber: "desc" },
        select: { billNumber: true },
      });

      const nextBillNumber = lastBill ? lastBill.billNumber + 1 : 1001;

      return await tx.bill.create({
        data: {
          billNumber: nextBillNumber,
          orderType: "TABLE",
          orderReference: `Table ${tableId.replace(/^table\s*/i, '').trim()}`,
          customerName: customerName?.trim() || "QR Customer",
          customerPhone: customerPhone?.trim() || null,
          subtotal,
          discount: 0,
          totalAmount,
          paidAmount: 0,
          balanceAmount: totalAmount,
          status: "UNPAID",
          createdById: defaultStaff.id,
          items: {
            create: billItemsData,
          },
        },
        include: {
          items: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Order placed successfully! Kitchen is preparing your food.",
      orderNumber: newBill.billNumber,
      order: newBill,
    });
  } catch (error: any) {
    console.error("POST /api/orders/table error:", error);
    return NextResponse.json({ error: error.message || "Failed to place table order" }, { status: 500 });
  }
}
