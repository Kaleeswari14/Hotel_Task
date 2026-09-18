import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { getCurrentUser, signToken, setSessionCookie } from "@/lib/auth";

// GET: Fetch list of users (Owner gets all, Staff gets self)
export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (currentUser.role === "OWNER") {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json(users);
    } else {
      const user = await prisma.user.findUnique({
        where: { id: currentUser.userId },
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          isActive: true,
        },
      });
      return NextResponse.json(user ? [user] : []);
    }
  } catch (error: any) {
    console.error("GET Users Error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST: Create new staff user (OWNER only)
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "OWNER") {
      return NextResponse.json({ error: "Only Owner can add new staff users" }, { status: 403 });
    }

    const { name, username, password, role } = await req.json();

    if (!name || !username || !password) {
      return NextResponse.json({ error: "Name, username and password are required" }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    if (existing) {
      return NextResponse.json({ error: "Username already exists. Please choose a different username." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        username: cleanUsername,
        passwordHash,
        role: role === "OWNER" ? "OWNER" : "STAFF",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error("POST User Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 });
  }
}

// PUT: Update username, password, name, or role
export async function PUT(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId, name, username, newPassword, currentPassword, role, isActive } = await req.json();

    const userIdToUpdate = targetUserId || currentUser.userId;
    const isSelf = userIdToUpdate === currentUser.userId;

    // Non-owners can only update themselves
    if (!isSelf && currentUser.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden: You can only update your own profile" }, { status: 403 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userIdToUpdate },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check username duplication
    let cleanUsername = existingUser.username;
    if (username && username.trim().toLowerCase() !== existingUser.username) {
      cleanUsername = username.trim().toLowerCase();
      if (cleanUsername.length < 3) {
        return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
      }

      const duplicate = await prisma.user.findUnique({
        where: { username: cleanUsername },
      });

      if (duplicate && duplicate.id !== userIdToUpdate) {
        return NextResponse.json({ error: "Username already taken. Please choose another." }, { status: 400 });
      }
    }

    // Password change logic
    let newPasswordHash: string | undefined = undefined;
    if (newPassword && newPassword.trim()) {
      if (newPassword.trim().length < 4) {
        return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
      }

      // If user is updating their own password and provides current password, verify it
      if (isSelf && currentPassword) {
        const isMatch = await bcrypt.compare(currentPassword, existingUser.passwordHash);
        if (!isMatch) {
          return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
        }
      }

      newPasswordHash = await bcrypt.hash(newPassword.trim(), 10);
    }

    const updateData: any = {
      name: name ? name.trim() : existingUser.name,
      username: cleanUsername,
    };

    if (newPasswordHash) {
      updateData.passwordHash = newPasswordHash;
    }

    // Role & active status can only be modified by Owner for others
    if (currentUser.role === "OWNER") {
      if (role && (role === "OWNER" || role === "STAFF")) {
        updateData.role = role;
      }
      if (typeof isActive === "boolean") {
        updateData.isActive = isActive;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userIdToUpdate },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
      },
    });

    const response = NextResponse.json({
      success: true,
      user: updatedUser,
      message: "User updated successfully",
    });

    // If updated own username or name, refresh session token
    if (isSelf) {
      const newToken = await signToken({
        userId: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        role: updatedUser.role as "OWNER" | "STAFF",
      });
      setSessionCookie(response, newToken);
    }

    return response;
  } catch (error: any) {
    console.error("PUT User Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
  }
}

// DELETE: Delete staff user (OWNER only)
export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized: Only Owner can delete users" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (userId === currentUser.userId) {
      return NextResponse.json({ error: "You cannot delete your own logged-in account" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    console.error("DELETE User Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 });
  }
}
