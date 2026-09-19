import React from "react";
import CustomerOrderView from "./CustomerOrderView";

export const metadata = {
  title: "Self-Order Menu | HOTEL JB",
  description: "Browse menu and place instant table orders directly from your phone",
};

export default function TableOrderPage({ params }: { params: { tableId: string } }) {
  return <CustomerOrderView tableId={params.tableId} />;
}
