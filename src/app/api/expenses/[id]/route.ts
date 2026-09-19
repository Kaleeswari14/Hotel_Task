import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized: Owner access required" }, { status: 403 });
    }

    const { id } = params;
    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Expense deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/expenses/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete expense" }, { status: 500 });
  }
}
