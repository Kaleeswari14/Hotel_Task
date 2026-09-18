import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import BillsQueue from "./BillsQueue";

export default async function BillsPage() {
  const user = await getCurrentUser();

  const bills = await prisma.bill.findMany({
    include: {
      items: {
        include: {
          portion: true,
        },
      },
      createdBy: {
        select: { id: true, name: true, username: true, role: true },
      },
      payments: true,
      cancellation: {
        include: {
          cancelledBy: { select: { name: true, username: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
      <BillsQueue
        initialBills={bills as any}
        userRole={user?.role || "STAFF"}
      />
    </div>
  );
}
