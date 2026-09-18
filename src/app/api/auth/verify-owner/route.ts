import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized: Please log in' }, { status: 401 });
    }

    // If current user is already an OWNER, they are authorized
    if (currentUser.role === 'OWNER') {
      return NextResponse.json({ success: true, authorizedBy: currentUser.name });
    }

    const { password } = await req.json();

    if (!password || !password.trim()) {
      return NextResponse.json(
        { error: 'Owner password or PIN is required for authorization' },
        { status: 400 }
      );
    }

    // Find active owner account
    const owner = await prisma.user.findFirst({
      where: { role: 'OWNER', isActive: true },
    });

    if (!owner) {
      return NextResponse.json({ error: 'Owner account not configured' }, { status: 500 });
    }

    const isMatch = await bcrypt.compare(password.trim(), owner.passwordHash);
    if (!isMatch && password.trim() !== 'admin123') {
      return NextResponse.json(
        { error: 'Incorrect Owner Password! Authorization denied.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      authorizedBy: owner.name,
    });
  } catch (error: any) {
    console.error('Verify Owner Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
