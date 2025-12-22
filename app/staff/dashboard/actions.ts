import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import {
  getStaffProfilesRepository,
  getTipsRepository,
  getAuthenticationService,
} from '@/src/service-locator';
import { UnauthenticatedError } from '@/src/shared/errors/auth';

async function getSessionId() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    throw new UnauthenticatedError('Must be logged in');
  }

  return sessionId;
}

export async function getMyStaffProfile() {
  try {
    const sessionId = await getSessionId();
    const authService = getAuthenticationService();
    const { user } = await authService.validateSession(sessionId);

    const staffProfilesRepository = getStaffProfilesRepository();
    const staffProfiles = await staffProfilesRepository.getStaffProfilesByUser(user.id);

    const activeProfile = staffProfiles.find((sp) => sp.active);
    return activeProfile || staffProfiles[0] || null;
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      redirect('/sign-in');
    }
    console.error('Get my staff profile error:', err);
    throw err;
  }
}

export async function getMyStaffTips(startDate?: Date, endDate?: Date) {
  try {
    const sessionId = await getSessionId();
    const authService = getAuthenticationService();
    const { user } = await authService.validateSession(sessionId);

    const staffProfilesRepository = getStaffProfilesRepository();
    const staffProfiles = await staffProfilesRepository.getStaffProfilesByUser(user.id);

    const activeProfile = staffProfiles.find((sp) => sp.active) || staffProfiles[0];

    if (!activeProfile) {
      return [];
    }

    const tipsRepository = getTipsRepository();
    return tipsRepository.getTipsByCompany(activeProfile.companyId, {
      staffProfileId: activeProfile.id,
      paymentStatus: 'SUCCEEDED',
      startDate,
      endDate,
    });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      redirect('/sign-in');
    }
    console.error('Get my staff tips error:', err);
    throw err;
  }
}

