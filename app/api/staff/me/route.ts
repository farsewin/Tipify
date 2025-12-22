import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/config';
import { getAuthenticationService, getStaffProfilesRepository } from '@/src/service-locator';
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

    const authService = getAuthenticationService();
    const { user } = await authService.validateSession(sessionId);

    const staffProfilesRepository = getStaffProfilesRepository();
    const staffProfiles = await staffProfilesRepository.getStaffProfilesByUser(user.id);

    const activeProfile = staffProfiles.find((sp) => sp.active);
    const profile = activeProfile || staffProfiles[0] || null;

    return NextResponse.json({ profile });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json(
        { error: 'Must be logged in' },
        { status: 401 }
      );
    }
    console.error('Get my staff profile error:', err);
    return NextResponse.json(
      { error: 'An error happened while fetching staff profile.' },
      { status: 500 }
    );
  }
}


