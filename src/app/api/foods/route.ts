import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET all food items with categories, portions, and stock
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const includeInactive = searchParams.get("includeInactive") === "true";

    const foods = await prisma.foodItem.findMany({
      where: {
        ...(categoryId ? { categoryId } : {}),
        ...(!includeInactive ? { isActive: true } : {}),
      },
      include: {
        category: true,
        portions: {
          where: !includeInactive ? { isActive: true } : {},
          orderBy: { unitMultiplier: "asc" },
        },
        stock: true,
      },
      orderBy: [
        { category: { displayOrder: "asc" } },
        { name: "asc" },
      ],
    });

    return NextResponse.json(foods);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create food item with portions and stock (OWNER only)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized: Owner access required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      nameTamil,
      categoryId,
      description,
      imageUrl,
      dietary = "VEG",
      mealTime = "ALL",
      stockType = "EXACT_COUNT",
      portions,
      initialStock = 0,
      minThreshold = 5,
      unitName = "Plates",
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Food item name is required" }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ error: "Category selection is required" }, { status: 400 });
    }

    if (!portions || !Array.isArray(portions) || portions.length === 0) {
      return NextResponse.json(
        { error: "At least one portion with a price is required (e.g. 1 Plate - ₹180)" },
        { status: 400 }
      );
    }

    // Check for duplicate food name (case-insensitive)
    const existingFoods = await prisma.foodItem.findMany({
      select: { name: true },
    });
    const isDuplicate = existingFoods.some(
      (f) => f.name.trim().toLowerCase() === name.trim().toLowerCase()
    );

    if (isDuplicate) {
      return NextResponse.json(
        { error: `A food item named "${name.trim()}" already exists in the menu!` },
        { status: 409 }
      );
    }

    // Create FoodItem, Portions, and Stock inside a transaction
    const newFood = await prisma.$transaction(async (tx) => {
      const food = await tx.foodItem.create({
        data: {
          name: name.trim(),
          nameTamil: nameTamil?.trim() || null,
          categoryId,
          description: description?.trim() || null,
          imageUrl: imageUrl?.trim() || null,
          dietary: dietary?.trim() || "VEG",
          mealTime: mealTime?.trim() || "ALL",
          stockType: stockType?.trim() || "EXACT_COUNT",
          portions: {
            create: portions.map((p: any) => ({
              portionName: p.portionName.trim(),
              portionNameTamil: p.portionNameTamil?.trim() || null,
              unitMultiplier: parseFloat(p.unitMultiplier) || 1.0,
              price: parseFloat(p.price) || 0,
              packingCharge: parseFloat(p.packingCharge) || 0,
              isActive: p.isActive !== undefined ? Boolean(p.isActive) : true,
            })),
          },
          stock: {
            create: {
              currentQuantity: parseFloat(initialStock) || 0,
              minThreshold: parseFloat(minThreshold) || 5,
              unitName: unitName.trim() || "Plates",
            },
          },
        },
        include: {
          category: true,
          portions: true,
          stock: true,
        },
      });

      return food;
    });

    return NextResponse.json(newFood, { status: 201 });
  } catch (error: any) {
    console.error("Create Food Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
