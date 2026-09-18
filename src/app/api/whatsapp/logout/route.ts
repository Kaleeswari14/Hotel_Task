import { NextRequest, NextResponse } from "next/server";
import { logoutWhatsApp } from "@/lib/whatsapp-engine";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await logoutWhatsApp();
    return NextResponse.json({ success: true, message: "WhatsApp disconnected successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
