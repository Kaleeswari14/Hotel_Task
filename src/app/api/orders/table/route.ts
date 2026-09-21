import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET active unpaid order for a specific table
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tableId = searchParams.get("tableId");

    if (!tableId) {
      return NextResponse.json({ error: "tableId required" }, { status: 400 });
    }

    const tableRef = `Table ${tableId.replace(/^table\s*/i, "").trim()}`;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const activeBill = await prisma.bill.findFirst({
      where: {
        orderType: "TABLE",
        orderReference: tableRef,
        status: "UNPAID",
        createdAt: { gte: todayStart },
      },
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ activeBill });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

    const tableRef = `Table ${tableId.replace(/^table\s*/i, "").trim()}`;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Check if there is already an active UNPAID bill for this table today
    const existingActiveBill = await prisma.bill.findFirst({
      where: {
        orderType: "TABLE",
        orderReference: tableRef,
        status: "UNPAID",
        createdAt: { gte: todayStart },
      },
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingActiveBill) {
      // Append items to existing running table bill
      const updatedSubtotal = existingActiveBill.subtotal + subtotal;
      const updatedTotal = existingActiveBill.totalAmount + subtotal;
      const updatedBalance = updatedTotal - existingActiveBill.paidAmount;

      const updatedBill = await prisma.$transaction(async (tx) => {
        // Create new items for existing bill
        for (const item of billItemsData) {
          await tx.billItem.create({
            data: {
              billId: existingActiveBill.id,
              foodItemId: item.foodItemId,
              foodName: item.foodName,
              portionId: item.portionId,
              portionName: item.portionName,
              unitMultiplier: item.unitMultiplier,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              subtotal: item.subtotal,
            },
          });
        }

        return await tx.bill.update({
          where: { id: existingActiveBill.id },
          data: {
            subtotal: updatedSubtotal,
            totalAmount: updatedTotal,
            balanceAmount: updatedBalance,
            customerName: customerName?.trim() || existingActiveBill.customerName,
            customerPhone: customerPhone?.trim() || existingActiveBill.customerPhone,
          },
          include: {
            items: true,
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Additional items added to table order! Kitchen is preparing your food.",
        isAppended: true,
        orderNumber: updatedBill.billNumber,
        newItemsCount: billItemsData.length,
        order: updatedBill,
      });
    }

    const totalAmount = subtotal;

    // Create New Table Order / KOT Bill in DB
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
          orderReference: tableRef,
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
      isAppended: false,
      orderNumber: newBill.billNumber,
      order: newBill,
    });
  } catch (error: any) {
    console.error("POST /api/orders/table error:", error);
    return NextResponse.json({ error: error.message || "Failed to place table order" }, { status: 500 });
  }
}
