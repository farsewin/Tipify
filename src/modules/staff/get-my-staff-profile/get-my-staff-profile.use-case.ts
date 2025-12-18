import { getStaffProfilesRepository } from '@/src/service-locator';
import type { StaffProfile } from '@/src/modules/staff/staff-profile.model';
import { getAuthenticationService } from '@/src/service-locator';

export async function getMyStaffProfileUseCase(input: {
  sessionId: string;
}): Promise<StaffProfile | null> {
  const authService = getAuthenticationService();
  const { user } = await authService.validateSession(input.sessionId);

  const staffProfilesRepository = getStaffProfilesRepository();
  const staffProfiles = await staffProfilesRepository.getStaffProfilesByUser(user.id);

  // Return the first active staff profile (or first one if none are active)
  const activeProfile = staffProfiles.find((sp) => sp.active);
  return activeProfile || staffProfiles[0] || null;
}







