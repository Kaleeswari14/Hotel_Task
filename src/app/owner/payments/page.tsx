import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import PaymentHistoryView from "./PaymentHistoryView";

export default async function PaymentsHistoryPage() {
  const user = await getCurrentUser();

  const payments = await prisma.payment.findMany({
    include: {
      bill: {
        include: {
          items: true,
          createdBy: { select: { name: true } },
        },
      },
      receivedBy: { select: { name: true, username: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
      <PaymentHistoryView initialPayments={payments as any} />
    </div>
  );
}
