import { NextRequest, NextResponse } from "next/server";
import { getWhatsAppStatus, initWhatsAppEngine } from "@/lib/whatsapp-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await getWhatsAppStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    await initWhatsAppEngine(true);
    const status = await getWhatsAppStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
