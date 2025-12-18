import { getTipsRepository, getStaffProfilesRepository } from '@/src/service-locator';
import type { Tip } from '@/src/modules/tips/tip.model';
import { NotFoundError } from '@/src/modules/shared/errors/common';
import { getAuthenticationService } from '@/src/service-locator';

export async function getStaffTipsUseCase(input: {
  staffProfileId: string;
  sessionId: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<Tip[]> {
  // Validate session
  if (!input.sessionId) {
    throw new Error('Session ID is required');
  }

  const authService = getAuthenticationService();
  const { user } = await authService.validateSession(input.sessionId);

  // Verify staff profile exists and is linked to user
  const staffProfilesRepository = getStaffProfilesRepository();
  const staffProfile = await staffProfilesRepository.getStaffProfile(input.staffProfileId);

  if (!staffProfile) {
    throw new NotFoundError('Staff profile not found');
  }

  // Verify staff is linked to the current user
  if (staffProfile.userId !== user.id) {
    throw new NotFoundError('You do not have access to this staff profile');
  }

  // Get tips for this staff member
  const tipsRepository = getTipsRepository();
  const tips = await tipsRepository.getTipsByCompany(staffProfile.companyId, {
    staffProfileId: input.staffProfileId,
    paymentStatus: 'SUCCEEDED',
    startDate: input.startDate,
    endDate: input.endDate,
  });

  return tips;
}







