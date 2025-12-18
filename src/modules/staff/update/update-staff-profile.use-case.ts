import {
  getStaffProfilesRepository,
  getBranchesRepository,
} from '@/src/service-locator';
import type { StaffProfile, UpdateStaffProfile } from '@/src/modules/staff/staff-profile.model';
import { NotFoundError } from '@/src/modules/shared/errors/common';
import { validateCompanyAccess } from '@/src/modules/shared/helpers/access-control';

export async function updateStaffProfileUseCase(input: {
  staffProfileId: string;
  companyId: string;
  updates: UpdateStaffProfile;
  sessionId: string;
}): Promise<StaffProfile> {
  // Validate company access (requires at least MANAGER role)
  await validateCompanyAccess(input.sessionId, input.companyId, 'MANAGER');

  const staffProfilesRepository = getStaffProfilesRepository();

  // Get existing staff profile
  const existingStaff = await staffProfilesRepository.getStaffProfile(input.staffProfileId);
  if (!existingStaff) {
    throw new NotFoundError('Staff profile not found');
  }

  // Verify staff belongs to company
  if (existingStaff.companyId !== input.companyId) {
    throw new NotFoundError('Staff profile does not belong to this company');
  }

  // If branchId is being updated, verify new branch belongs to company
  if (input.updates.branchId && input.updates.branchId !== existingStaff.branchId) {
    const branchesRepository = getBranchesRepository();
    const branch = await branchesRepository.getBranch(input.updates.branchId);
    if (!branch || branch.companyId !== input.companyId) {
      throw new NotFoundError('Branch does not belong to this company');
    }
  }

  // Update staff profile
  const updated = await staffProfilesRepository.updateStaffProfile(
    input.staffProfileId,
    input.updates
  );

  return updated;
}

