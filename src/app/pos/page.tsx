import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import PosTerminal from "./PosTerminal";

export default async function PosPage() {
  const user = await getCurrentUser();

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });

  const foods = await prisma.foodItem.findMany({
    where: { isActive: true },
    include: {
      category: true,
      portions: {
        where: { isActive: true },
        orderBy: { unitMultiplier: "asc" },
      },
      stock: true,
    },
    orderBy: [
      { category: { displayOrder: "asc" } },
      { name: "asc" },
    ],
  });

  // Fetch real latest sequential bill number
  const lastBill = await prisma.bill.findFirst({
    orderBy: { billNumber: "desc" },
    select: { billNumber: true },
  });
  const nextBillNumber = lastBill ? lastBill.billNumber + 1 : 1001;

  return (
    <PosTerminal
      categories={categories}
      foods={foods as any}
      userName={user?.name || "Cashier"}
      userRole={user?.role || "STAFF"}
      initialNextBillNumber={nextBillNumber}
    />
  );
}
