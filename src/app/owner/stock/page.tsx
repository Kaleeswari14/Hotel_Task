import React from "react";
import prisma from "@/lib/prisma";
import StockManager from "./StockManager";

export default async function StockPage() {
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

  return (
    <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
      <StockManager initialStock={stockItems as any} />
    </div>
  );
}
