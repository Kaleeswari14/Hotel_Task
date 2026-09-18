import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signToken, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/auth/setup: Check if initial setup is required
export async function GET() {
  try {
    const ownerCount = await prisma.user.count({
      where: { role: "OWNER" },
    });

    return NextResponse.json({
      needsSetup: ownerCount === 0,
      hotelName: process.env.NEXT_PUBLIC_HOTEL_NAME || "HOTEL JB POS",
    });
  } catch (error: any) {
    console.error("GET /api/auth/setup error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/auth/setup: Create initial OWNER account
export async function POST(req: NextRequest) {
  try {
    const ownerCount = await prisma.user.count({
      where: { role: "OWNER" },
    });

    if (ownerCount > 0) {
      return NextResponse.json(
        { error: "Setup already completed. Please login with your existing account." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, username, password } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Owner full name is required" }, { status: 400 });
    }

    if (!username || !username.trim()) {
      return NextResponse.json({ error: "Username or email is required" }, { status: 400 });
    }

    if (!password || password.length < 4) {
      return NextResponse.json({ error: "Password must be at least 4 characters long" }, { status: 400 });
    }

    const cleanUsername = username.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        username: cleanUsername,
        passwordHash,
        role: "OWNER",
        isActive: true,
      },
    });

    // Automatically sign in the new owner
    const token = await signToken({
      userId: user.id,
      name: user.name,
      username: user.username,
      role: "OWNER",
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
      message: "Owner account created successfully!",
    });

    setSessionCookie(response, token);
    return response;
  } catch (error: any) {
    console.error("POST /api/auth/setup error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create owner account" },
      { status: 500 }
    );
  }
}
