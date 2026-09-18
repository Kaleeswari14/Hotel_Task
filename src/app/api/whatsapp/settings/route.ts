import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET current WhatsApp settings
export async function GET(req: NextRequest) {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            "WHATSAPP_PROVIDER",
            "WHATSAPP_INSTANCE_ID",
            "WHATSAPP_API_TOKEN",
            "WHATSAPP_ENABLED",
          ],
        },
      },
    });

    const map: Record<string, string> = {};
    settings.forEach((s) => {
      map[s.key] = s.value;
    });

    return NextResponse.json({
      provider: map["WHATSAPP_PROVIDER"] || process.env.WHATSAPP_PROVIDER || "ULTRAMSG",
      instanceId: map["WHATSAPP_INSTANCE_ID"] || process.env.WHATSAPP_INSTANCE_ID || "",
      apiToken: map["WHATSAPP_API_TOKEN"] || process.env.WHATSAPP_API_TOKEN || "",
      enabled: (map["WHATSAPP_ENABLED"] ?? process.env.WHATSAPP_ENABLED ?? "true") === "true",
    });
  } catch (error: any) {
    console.error("GET WhatsApp Settings Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST save WhatsApp settings
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Only Hotel Owner can modify WhatsApp gateway settings" }, { status: 403 });
    }

    const body = await req.json();
    const { provider, instanceId, apiToken, enabled } = body;

    const upserts = [
      prisma.systemSetting.upsert({
        where: { key: "WHATSAPP_PROVIDER" },
        update: { value: provider || "ULTRAMSG" },
        create: { key: "WHATSAPP_PROVIDER", value: provider || "ULTRAMSG" },
      }),
      prisma.systemSetting.upsert({
        where: { key: "WHATSAPP_INSTANCE_ID" },
        update: { value: instanceId?.trim() || "" },
        create: { key: "WHATSAPP_INSTANCE_ID", value: instanceId?.trim() || "" },
      }),
      prisma.systemSetting.upsert({
        where: { key: "WHATSAPP_API_TOKEN" },
        update: { value: apiToken?.trim() || "" },
        create: { key: "WHATSAPP_API_TOKEN", value: apiToken?.trim() || "" },
      }),
      prisma.systemSetting.upsert({
        where: { key: "WHATSAPP_ENABLED" },
        update: { value: enabled ? "true" : "false" },
        create: { key: "WHATSAPP_ENABLED", value: enabled ? "true" : "false" },
      }),
    ];

    await prisma.$transaction(upserts);

    return NextResponse.json({
      success: true,
      message: "WhatsApp Gateway settings saved successfully!",
    });
  } catch (error: any) {
    console.error("Save WhatsApp Settings Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
