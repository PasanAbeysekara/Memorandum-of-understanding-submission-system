import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const role = session.user.role;

    // If admin, fetch global, else fetch user’s own
    let moUs;
    if (isAdminRole(role)) {
      // e.g. get last 10 submissions
      moUs = await prisma.mou_submissions.findMany({
        orderBy: { dateSubmitted: 'desc' },
        take: 10,
      });
    } else {
      moUs = await prisma.mou_submissions.findMany({
        where: { userId },
        orderBy: { dateSubmitted: 'desc' },
        take: 10,
      });
    }

    return NextResponse.json(moUs);
  } catch (error) {
    console.error('Error fetching recent MOUs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function isAdminRole(role: string) {
  return [
    'LEGAL_ADMIN',
    'FACULTY_ADMIN',
    'SENATE_ADMIN',
    'UGC_ADMIN',
    'SUPER_ADMIN',
  ].includes(role);
}
