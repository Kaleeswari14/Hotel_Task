import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized: Please log in" }, { status: 401 });
    }

    const { reason, notes } = await req.json();

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: "A cancellation reason is required" }, { status: 400 });
    }

    const bill = await prisma.bill.findUnique({
      where: { id: params.id },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    if (bill.status === "PAID") {
      return NextResponse.json(
        { error: "Cannot cancel an already PAID bill directly." },
        { status: 400 }
      );
    }

    if (bill.status === "CANCELLED") {
      return NextResponse.json({ error: "This bill is already cancelled." }, { status: 400 });
    }

    const cancelled = await prisma.$transaction(async (tx) => {
      // 1. Mark bill status as CANCELLED
      const updated = await tx.bill.update({
        where: { id: params.id },
        data: {
          status: "CANCELLED",
        },
      });

      // 2. Create Cancellation audit record
      const audit = await tx.cancellation.create({
        data: {
          billId: params.id,
          reason: reason.trim(),
          notes: notes?.trim() || null,
          cancelledById: user.userId,
        },
        include: {
          cancelledBy: { select: { name: true, username: true } },
        },
      });

      return { bill: updated, cancellation: audit };
    });

    return NextResponse.json({
      success: true,
      message: "Bill cancelled successfully",
      data: cancelled,
    });
  } catch (error: any) {
    console.error("Cancel Bill Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
