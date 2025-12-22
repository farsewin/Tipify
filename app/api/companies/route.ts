import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/config';
import { getUserCompanies } from '@/src/shared/helpers/access-control';
import { UnauthenticatedError } from '@/src/shared/errors/auth';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Must be logged in' },
        { status: 401 }
      );
    }

    const companies = await getUserCompanies(sessionId);
    return NextResponse.json({ companies });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json(
        { error: 'Must be logged in' },
        { status: 401 }
      );
    }
    console.error('Get user companies error:', err);
    return NextResponse.json(
      { error: 'An error happened while fetching companies.' },
      { status: 500 }
    );
  }
}


