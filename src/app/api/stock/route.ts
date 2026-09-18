import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET stock status with low-stock alerts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter"); // "all" | "low" | "in_stock"

    const stockItems = await prisma.stock.findMany({
      include: {
        foodItem: {
          include: {
            category: true,
            portions: { orderBy: { unitMultiplier: "asc" } },
          },
        },
      },
      orderBy: { foodItem: { name: "asc" } },
    });

    // Compute stats
    let lowStockCount = 0;
    const items = stockItems.map((item) => {
      const isNoTracking = item.foodItem.stockType === "NO_TRACKING";
      const isLow = !isNoTracking && item.currentQuantity <= item.minThreshold;
      const isOut = !isNoTracking && item.currentQuantity <= 0;
      if (isLow) lowStockCount++;
      return {
        ...item,
        isNoTracking,
        isLowStock: isLow,
        isOutOfStock: isOut,
      };
    });

    let filteredItems = items;
    if (filter === "low") {
      filteredItems = items.filter((i) => i.isLowStock);
    } else if (filter === "in_stock") {
      filteredItems = items.filter((i) => !i.isLowStock && !i.isOutOfStock);
    }

    return NextResponse.json({
      totalItems: items.length,
      lowStockCount,
      stock: filteredItems,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST restock or adjust quantity (OWNER only)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized: Owner access required" }, { status: 403 });
    }

    const { stockId, foodItemId, mode, quantity, minThreshold, unitName, stockType } = await req.json();

    if (!stockId && !foodItemId) {
      return NextResponse.json({ error: "Stock ID or Food Item ID is required" }, { status: 400 });
    }

    const whereClause = stockId ? { id: stockId } : { foodItemId: foodItemId };
    const existing = await prisma.stock.findUnique({
      where: whereClause,
      include: { foodItem: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Stock entry not found" }, { status: 404 });
    }

    if (stockType !== undefined) {
      await prisma.foodItem.update({
        where: { id: existing.foodItemId },
        data: { stockType: stockType.trim() },
      });
    }

    let newQuantity = existing.currentQuantity;
    const qtyVal = parseFloat(quantity) || 0;

    if (mode === "ADD") {
      newQuantity += qtyVal;
    } else if (mode === "SET") {
      newQuantity = Math.max(0, qtyVal);
    }

    const updated = await prisma.stock.update({
      where: { id: existing.id },
      data: {
        currentQuantity: newQuantity,
        ...(minThreshold !== undefined && { minThreshold: parseFloat(minThreshold) }),
        ...(unitName && { unitName: unitName.trim() }),
        lastRestockedAt: new Date(),
      },
      include: {
        foodItem: {
          include: { category: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Stock updated for ${existing.foodItem.name}`,
      stock: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
