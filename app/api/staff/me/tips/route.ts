import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/config';
import { getAuthenticationService, getStaffProfilesRepository, getTipsRepository } from '@/src/service-locator';
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

    const activeProfile = staffProfiles.find((sp) => sp.active) || staffProfiles[0];

    if (!activeProfile) {
      return NextResponse.json({ tips: [] });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    const tipsRepository = getTipsRepository();
    const tips = await tipsRepository.getTipsByCompany(activeProfile.companyId, {
      staffProfileId: activeProfile.id,
      paymentStatus: 'SUCCEEDED',
      startDate,
      endDate,
    });

    return NextResponse.json({ tips });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json(
        { error: 'Must be logged in' },
        { status: 401 }
      );
    }
    console.error('Get my staff tips error:', err);
    return NextResponse.json(
      { error: 'An error happened while fetching tips.' },
      { status: 500 }
    );
  }
}


