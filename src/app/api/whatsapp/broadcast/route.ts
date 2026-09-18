import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendWhatsAppMessage, getWhatsAppStatus } from "@/lib/whatsapp-engine";

export const dynamic = "force-dynamic";

// GET unique previous customer contacts from bills
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized: Owner access required" }, { status: 403 });
    }

    // Fetch all bills with customer phone
    const bills = await prisma.bill.findMany({
      where: {
        customerPhone: { not: null },
      },
      select: {
        customerName: true,
        customerPhone: true,
        createdAt: true,
        totalAmount: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Deduplicate by clean 10-digit phone number
    const customerMap = new Map<string, { phone: string; name: string; lastVisit: Date; totalBills: number }>();

    for (const b of bills) {
      if (!b.customerPhone) continue;
      const cleanDigits = b.customerPhone.replace(/\D/g, "");
      const phone10 = cleanDigits.slice(-10);

      // Validate 10 digit Indian mobile number starting with 6,7,8,9
      if (phone10.length === 10 && /^[6-9]\d{9}$/.test(phone10)) {
        if (!customerMap.has(phone10)) {
          customerMap.set(phone10, {
            phone: phone10,
            name: b.customerName?.trim() || "Customer",
            lastVisit: b.createdAt,
            totalBills: 1,
          });
        } else {
          const existing = customerMap.get(phone10)!;
          existing.totalBills += 1;
          if (b.customerName && existing.name === "Customer") {
            existing.name = b.customerName.trim();
          }
        }
      }
    }

    const uniqueCustomers = Array.from(customerMap.values());
    const status = await getWhatsAppStatus();

    return NextResponse.json({
      totalCustomers: uniqueCustomers.length,
      customers: uniqueCustomers,
      whatsappStatus: status,
    });
  } catch (error: any) {
    console.error("Broadcast GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST Broadcast promotional offer message to previous customers
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized: Owner access required" }, { status: 403 });
    }

    const body = await req.json();
    const { message, posterUrl, customPhones } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Broadcast message content is required" }, { status: 400 });
    }

    // Check WhatsApp engine status
    const status = await getWhatsAppStatus();
    if (!status.isConnected) {
      return NextResponse.json(
        { error: "WhatsApp engine is not connected. Please scan QR Code in WhatsApp Settings first." },
        { status: 400 }
      );
    }

    // Determine target phone list
    let targetPhones: Array<{ phone: string; name: string }> = [];

    if (customPhones && Array.isArray(customPhones) && customPhones.length > 0) {
      targetPhones = customPhones.map((p: string) => ({
        phone: p.replace(/\D/g, "").slice(-10),
        name: "Valued Customer",
      })).filter((c: any) => c.phone.length === 10);
    } else {
      // Fetch all unique customers from DB
      const bills = await prisma.bill.findMany({
        where: { customerPhone: { not: null } },
        select: { customerName: true, customerPhone: true },
        orderBy: { createdAt: "desc" },
      });

      const phoneMap = new Map<string, string>();
      for (const b of bills) {
        if (!b.customerPhone) continue;
        const clean = b.customerPhone.replace(/\D/g, "").slice(-10);
        if (clean.length === 10 && /^[6-9]\d{9}$/.test(clean)) {
          if (!phoneMap.has(clean)) {
            phoneMap.set(clean, b.customerName?.trim() || "Customer");
          }
        }
      }

      targetPhones = Array.from(phoneMap.entries()).map(([phone, name]) => ({ phone, name }));
    }

    if (targetPhones.length === 0) {
      return NextResponse.json({ error: "No valid customer phone numbers found for broadcasting" }, { status: 400 });
    }

    console.log(`🚀 [WHATSAPP BROADCAST] Starting dispatch to ${targetPhones.length} customers...`);

    let sentCount = 0;
    let failedCount = 0;
    const results: Array<{ phone: string; success: boolean; error?: string }> = [];

    // Staggered safe sending loop (1200ms delay between messages to safeguard WhatsApp number)
    for (let i = 0; i < targetPhones.length; i++) {
      const { phone, name } = targetPhones[i];

      // Format personalized message
      let customerMsg = message.replace(/{customer_name}/g, name);
      if (posterUrl && posterUrl.trim()) {
        customerMsg = `${customerMsg}\n\n🖼️ *Offer Poster / Link:* ${posterUrl.trim()}`;
      }

      try {
        const sendRes = await sendWhatsAppMessage(phone, customerMsg);
        if (sendRes.success) {
          sentCount++;
          results.push({ phone, success: true });
        } else {
          failedCount++;
          results.push({ phone, success: false, error: sendRes.error });
        }
      } catch (err: any) {
        failedCount++;
        results.push({ phone, success: false, error: err.message });
      }

      // 1.2s delay between dispatches
      if (i < targetPhones.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }

    return NextResponse.json({
      success: true,
      totalTargets: targetPhones.length,
      sentCount,
      failedCount,
      results,
      message: `Broadcast complete! Successfully delivered to ${sentCount} out of ${targetPhones.length} customers.`,
    });
  } catch (error: any) {
    console.error("Broadcast POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
