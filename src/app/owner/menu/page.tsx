import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import MenuManager from "./MenuManager";

export default async function MenuPage() {
  const user = await getCurrentUser();

  const categories = await prisma.category.findMany({
    orderBy: { displayOrder: "asc" },
  });

  const foods = await prisma.foodItem.findMany({
    where: { isActive: true },
    include: {
      category: true,
      portions: { where: { isActive: true }, orderBy: { unitMultiplier: "asc" } },
      stock: true,
    },
    orderBy: [
      { category: { displayOrder: "asc" } },
      { name: "asc" },
    ],
  });

  return (
    <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
      <MenuManager
        initialCategories={categories}
        initialFoods={foods as any}
      />
    </div>
  );
}
