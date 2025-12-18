import { getStaffProfilesRepository } from '@/src/service-locator';
import type { StaffProfile } from '@/src/modules/staff/staff-profile.model';
import { validateCompanyAccess } from '@/src/modules/shared/helpers/access-control';

export async function getStaffProfilesUseCase(input: {
  companyId: string;
  branchId?: string;
  activeOnly?: boolean;
  sessionId: string;
}): Promise<StaffProfile[]> {
  // Validate company access
  await validateCompanyAccess(input.sessionId, input.companyId);

  const staffProfilesRepository = getStaffProfilesRepository();

  if (input.branchId) {
    if (input.activeOnly) {
      return staffProfilesRepository.getActiveStaffProfilesByBranch(input.branchId);
    }
    return staffProfilesRepository.getStaffProfilesByBranch(input.branchId);
  }

  return staffProfilesRepository.getStaffProfilesByCompany(input.companyId);
}

