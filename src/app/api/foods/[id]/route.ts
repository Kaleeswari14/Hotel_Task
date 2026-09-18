import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET single food item
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const food = await prisma.foodItem.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        portions: { orderBy: { unitMultiplier: "asc" } },
        stock: true,
      },
    });

    if (!food) {
      return NextResponse.json({ error: "Food item not found" }, { status: 404 });
    }

    return NextResponse.json(food);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update food item, portions & stock threshold (OWNER only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized: Owner access required" }, { status: 403 });
    }

    const body = await req.json();
    const { name, nameTamil, categoryId, description, imageUrl, dietary, mealTime, stockType, isActive, portions, initialStock, minThreshold, unitName } = body;

    // Check if another food item already has this name (case-insensitive)
    if (name && name.trim()) {
      const existingFoods = await prisma.foodItem.findMany({
        where: {
          id: { not: params.id },
        },
        select: { name: true },
      });

      const isDuplicate = existingFoods.some(
        (f) => f.name.trim().toLowerCase() === name.trim().toLowerCase()
      );

      if (isDuplicate) {
        return NextResponse.json(
          { error: `Another food item named "${name.trim()}" already exists in the menu!` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update basic food details
      const food = await tx.foodItem.update({
        where: { id: params.id },
        data: {
          ...(name && { name: name.trim() }),
          ...(nameTamil !== undefined && { nameTamil: nameTamil?.trim() || null }),
          ...(categoryId && { categoryId }),
          ...(description !== undefined && { description: description?.trim() || null }),
          ...(imageUrl !== undefined && { imageUrl: imageUrl?.trim() || null }),
          ...(dietary !== undefined && { dietary: dietary?.trim() || "VEG" }),
          ...(mealTime !== undefined && { mealTime: mealTime?.trim() || "ALL" }),
          ...(stockType !== undefined && { stockType: stockType?.trim() || "EXACT_COUNT" }),
          ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        },
      });

      // 2. Update portions if supplied
      if (portions && Array.isArray(portions)) {
        // Delete portions not in updated list
        const existingPortionIds = portions.filter((p: any) => p.id).map((p: any) => p.id);
        await tx.foodPortion.deleteMany({
          where: {
            foodItemId: params.id,
            id: { notIn: existingPortionIds },
          },
        });

        // Upsert portions
        for (const p of portions) {
          if (p.id) {
            await tx.foodPortion.update({
              where: { id: p.id },
              data: {
                portionName: p.portionName.trim(),
                portionNameTamil: p.portionNameTamil?.trim() || null,
                unitMultiplier: parseFloat(p.unitMultiplier) || 1.0,
                price: parseFloat(p.price) || 0,
                packingCharge: parseFloat(p.packingCharge) || 0,
                isActive: p.isActive !== undefined ? Boolean(p.isActive) : true,
              },
            });
          } else {
            await tx.foodPortion.create({
              data: {
                foodItemId: params.id,
                portionName: p.portionName.trim(),
                portionNameTamil: p.portionNameTamil?.trim() || null,
                unitMultiplier: parseFloat(p.unitMultiplier) || 1.0,
                price: parseFloat(p.price) || 0,
                packingCharge: parseFloat(p.packingCharge) || 0,
                isActive: p.isActive !== undefined ? Boolean(p.isActive) : true,
              },
            });
          }
        }
      }

      // 3. Update stock threshold, quantity, and unit if supplied
      if (initialStock !== undefined || minThreshold !== undefined || unitName !== undefined) {
        await tx.stock.upsert({
          where: { foodItemId: params.id },
          update: {
            ...(initialStock !== undefined && { currentQuantity: parseFloat(initialStock) || 0 }),
            ...(minThreshold !== undefined && { minThreshold: parseFloat(minThreshold) }),
            ...(unitName !== undefined && { unitName: unitName.trim() }),
          },
          create: {
            foodItemId: params.id,
            currentQuantity: initialStock !== undefined ? parseFloat(initialStock) || 0 : 0,
            minThreshold: minThreshold !== undefined ? parseFloat(minThreshold) : 5,
            unitName: unitName !== undefined ? unitName.trim() : "Plates",
          },
        });
      }

      return tx.foodItem.findUnique({
        where: { id: params.id },
        include: {
          category: true,
          portions: { orderBy: { unitMultiplier: "asc" } },
          stock: true,
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Update Food Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE food item (OWNER only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized: Owner access required" }, { status: 403 });
    }

    const foodId = params.id;

    // Check if food exists
    const food = await prisma.foodItem.findUnique({
      where: { id: foodId },
    });

    if (!food) {
      return NextResponse.json({ error: "Food item not found" }, { status: 404 });
    }

    // Check if this food is referenced in any historical bill items
    const billItemsCount = await prisma.billItem.count({
      where: { foodItemId: foodId },
    });

    if (billItemsCount > 0) {
      // Soft-delete: Mark inactive so historical billing and accounting records remain 100% accurate
      await prisma.foodItem.update({
        where: { id: foodId },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        message: "Food item removed from menu (historical bill sales preserved)",
      });
    }

    // If not used in any bill, cleanly delete from database
    await prisma.$transaction(async (tx) => {
      await tx.stock.deleteMany({ where: { foodItemId: foodId } });
      await tx.foodPortion.deleteMany({ where: { foodItemId: foodId } });
      await tx.foodItem.delete({ where: { id: foodId } });
    });

    return NextResponse.json({ success: true, message: "Food item permanently deleted" });
  } catch (error: any) {
    console.error("Delete Food Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete food item" }, { status: 500 });
  }
}
