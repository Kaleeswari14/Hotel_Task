import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST Process Payment & Atomically Reduce Stock & Mark Bill PAID
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized: Please log in" }, { status: 401 });
    }

    const body = await req.json();
    const { billId, amount, paymentMethod, notes } = body;

    if (!billId) {
      return NextResponse.json({ error: "Bill ID is required" }, { status: 400 });
    }

    if (!paymentMethod || !["CASH", "UPI", "CARD"].includes(paymentMethod)) {
      return NextResponse.json({ error: "Valid payment method (CASH, UPI, CARD) is required" }, { status: 400 });
    }

    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return NextResponse.json({ error: "Payment amount must be greater than 0" }, { status: 400 });
    }

    // Execute atomic payment transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch current bill with items
      const bill = await tx.bill.findUnique({
        where: { id: billId },
        include: {
          items: true,
          payments: true,
        },
      });

      if (!bill) {
        throw new Error("Bill not found");
      }

      if (bill.status === "PAID") {
        throw new Error("This bill is already fully PAID. Duplicate payments are not allowed.");
      }

      if (bill.status === "CANCELLED") {
        throw new Error("Cannot accept payment for a CANCELLED bill.");
      }

      const newPaidTotal = bill.paidAmount + payAmount;
      const newBalance = Math.max(0, bill.totalAmount - newPaidTotal);
      const isFullyPaid = newBalance === 0 || newPaidTotal >= bill.totalAmount;

      // 2. Create Payment record
      const payment = await tx.payment.create({
        data: {
          billId: bill.id,
          amount: payAmount,
          paymentMethod,
          receivedById: user.userId,
          notes: notes?.trim() || null,
        },
      });

      // 3. Update Bill status and amounts
      const updatedBill = await tx.bill.update({
        where: { id: bill.id },
        data: {
          paidAmount: newPaidTotal,
          balanceAmount: newBalance,
          status: isFullyPaid ? "PAID" : "PARTIAL",
        },
        include: {
          items: true,
          payments: {
            include: { receivedBy: { select: { name: true, username: true } } },
          },
          createdBy: { select: { name: true, username: true } },
        },
      });

      // 4. ATOMIC STOCK DEDUCTION (Only executed when bill reaches PAID status)
      if (isFullyPaid) {
        for (const item of bill.items) {
          // Check if food item has stock tracking enabled
          const food = await tx.foodItem.findUnique({
            where: { id: item.foodItemId },
            select: { stockType: true },
          });

          // Skip deduction if food is set to NO_TRACKING (e.g. Tea, Coffee, Juice, Butter Milk)
          if (food?.stockType === "NO_TRACKING") {
            continue;
          }

          const deduction = item.quantity * item.unitMultiplier;

          // Find existing stock record
          const stock = await tx.stock.findUnique({
            where: { foodItemId: item.foodItemId },
          });

          if (stock) {
            const updatedStockQty = Math.max(0, stock.currentQuantity - deduction);
            await tx.stock.update({
              where: { id: stock.id },
              data: {
                currentQuantity: updatedStockQty,
                updatedAt: new Date(),
              },
            });
          }
        }
      }

      return { bill: updatedBill, payment };
    });

    return NextResponse.json({
      success: true,
      message: "Payment confirmed successfully",
      bill: result.bill,
      payment: result.payment,
    });
  } catch (error: any) {
    console.error("Payment Error:", error);
    return NextResponse.json({ error: error.message || "Payment processing failed" }, { status: 400 });
  }
}

// GET all payments history (for audit log)
export async function GET(req: NextRequest) {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        bill: {
          include: {
            createdBy: { select: { name: true } },
            items: true,
          },
        },
        receivedBy: { select: { name: true, username: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Summary calculations
    let totalCollection = 0;
    let cashTotal = 0;
    let upiTotal = 0;
    let cardTotal = 0;

    for (const p of payments) {
      totalCollection += p.amount;
      if (p.paymentMethod === "CASH") cashTotal += p.amount;
      else if (p.paymentMethod === "UPI") upiTotal += p.amount;
      else if (p.paymentMethod === "CARD") cardTotal += p.amount;
    }

    return NextResponse.json({
      totalCollection,
      cashTotal,
      upiTotal,
      cardTotal,
      paymentsCount: payments.length,
      payments,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
