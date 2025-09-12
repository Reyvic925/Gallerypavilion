import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Role } from '@prisma/client';
import { authOptions } from '@/lib/auth';

// This endpoint is deprecated as we no longer have a Client model
export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.json(
    { message: 'This endpoint is deprecated' },
    { status: 410 }
  );
}