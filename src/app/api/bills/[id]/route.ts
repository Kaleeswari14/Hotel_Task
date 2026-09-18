import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET single bill
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bill = await prisma.bill.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            portion: true,
          },
        },
        createdBy: {
          select: { id: true, name: true, username: true, role: true },
        },
        payments: {
          include: {
            receivedBy: { select: { name: true, username: true } },
          },
        },
        cancellation: {
          include: {
            cancelledBy: { select: { name: true, username: true } },
          },
        },
      },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    return NextResponse.json(bill);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update an UNPAID bill (modify items/reference/discount)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.bill.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    if (existing.status === "PAID" || existing.status === "CANCELLED") {
      return NextResponse.json(
        { error: `Cannot modify a bill that is already ${existing.status}` },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { orderType, orderReference, customerName, customerPhone, items, discount = 0 } = body;

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

    const updated = await prisma.$transaction(async (tx) => {
      // Delete old items
      await tx.billItem.deleteMany({
        where: { billId: params.id },
      });

      // Update bill and insert new items
      const res = await tx.bill.update({
        where: { id: params.id },
        data: {
          ...(orderType && { orderType }),
          ...(orderReference && { orderReference: orderReference.trim() }),
          ...(customerName !== undefined && { customerName: customerName?.trim() || null }),
          ...(customerPhone !== undefined && { customerPhone: customerPhone?.trim() || null }),
          subtotal,
          discount: discountAmount,
          totalAmount,
          balanceAmount: totalAmount - existing.paidAmount,
          items: {
            create: billItemsData,
          },
        },
        include: {
          items: {
            include: {
              portion: true,
            },
          },
          createdBy: { select: { id: true, name: true, username: true, role: true } },
          payments: {
            include: {
              receivedBy: { select: { name: true, username: true } },
            },
          },
          cancellation: {
            include: {
              cancelledBy: { select: { name: true, username: true } },
            },
          },
        },
      });

      return res;
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
