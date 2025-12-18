import {
  getBranchesRepository,
} from '@/src/service-locator';
import type { Branch, UpdateBranch } from '@/src/modules/branch/branch.model';
import { NotFoundError } from '@/src/modules/shared/errors/common';
import { validateCompanyAccess } from '@/src/modules/shared/helpers/access-control';

export async function updateBranchUseCase(input: {
  branchId: string;
  companyId: string;
  updates: UpdateBranch;
  sessionId: string;
}): Promise<Branch> {
  // Validate company access (requires at least MANAGER role)
  await validateCompanyAccess(input.sessionId, input.companyId, 'MANAGER');

  const branchesRepository = getBranchesRepository();

  // Get existing branch
  const existingBranch = await branchesRepository.getBranch(input.branchId);
  if (!existingBranch) {
    throw new NotFoundError('Branch not found');
  }

  // Verify branch belongs to company
  if (existingBranch.companyId !== input.companyId) {
    throw new NotFoundError('Branch does not belong to this company');
  }

  // Update branch
  const updated = await branchesRepository.updateBranch(
    input.branchId,
    input.updates
  );

  return updated;
}

