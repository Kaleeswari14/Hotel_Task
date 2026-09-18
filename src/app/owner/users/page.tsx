import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import UserManager from "./UserManager";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <UserManager
        currentUser={{
          userId: user.userId,
          name: user.name,
          username: user.username,
          role: user.role,
        }}
      />
    </div>
  );
}
