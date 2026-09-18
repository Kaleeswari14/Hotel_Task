import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage, getWhatsAppStatus } from "@/lib/whatsapp-engine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, message, billNumber, customerName } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { error: "Phone number and message are required" },
        { status: 400 }
      );
    }

    // Clean phone number
    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = "91" + cleanPhone;
    } else if (cleanPhone.length > 10 && !cleanPhone.startsWith("91")) {
      cleanPhone = "91" + cleanPhone.slice(-10);
    }

    console.log("==========================================");
    console.log(`📲 [SELF-HOSTED WHATSAPP ENGINE AUTO-DISPATCH]`);
    console.log(`To: +${cleanPhone} (Customer: ${customerName || "Guest"})`);
    console.log(`Bill: #${billNumber || "N/A"}`);
    console.log("==========================================");

    // Send via Self-Hosted Baileys Engine
    const sendResult = await sendWhatsAppMessage(cleanPhone, message);

    if (sendResult.success) {
      return NextResponse.json({
        success: true,
        deliveredTo: cleanPhone,
        messageId: sendResult.messageId,
        provider: "SELF_HOSTED_ENGINE",
        message: "WhatsApp bill and offer sent silently in background!",
      });
    } else {
      console.warn("Self-Hosted engine dispatch notice:", sendResult.error);
      return NextResponse.json({
        success: false,
        deliveredTo: cleanPhone,
        error: sendResult.error,
        message: sendResult.error,
      });
    }
  } catch (error: any) {
    console.error("Error in WhatsApp auto-send route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to dispatch WhatsApp message" },
      { status: 500 }
    );
  }
}
