import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// PUT update category (OWNER only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized: Owner access required" }, { status: 403 });
    }

    const { name, nameTamil, displayOrder, isActive } = await req.json();

    // Check if another category already has this name (case-insensitive)
    if (name && name.trim()) {
      const existingCategories = await prisma.category.findMany({
        where: { id: { not: params.id } },
        select: { name: true },
      });
      const isDuplicate = existingCategories.some(
        (c) => c.name.trim().toLowerCase() === name.trim().toLowerCase()
      );
      if (isDuplicate) {
        return NextResponse.json(
          { error: `Another category named "${name.trim()}" already exists!` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.category.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(nameTamil !== undefined && { nameTamil: nameTamil?.trim() || null }),
        ...(displayOrder !== undefined && { displayOrder: parseInt(displayOrder, 10) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE category (OWNER only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized: Owner access required" }, { status: 403 });
    }

    await prisma.category.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
