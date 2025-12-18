import { getBranchesRepository } from '@/src/service-locator';
import type { Branch } from '@/src/modules/branch/branch.model';
import { validateCompanyAccess } from '@/src/modules/shared/helpers/access-control';

export async function getBranchesUseCase(input: {
  companyId: string;
  sessionId: string;
  activeOnly?: boolean;
}): Promise<Branch[]> {
  // Validate company access
  await validateCompanyAccess(input.sessionId, input.companyId);

  const branchesRepository = getBranchesRepository();

  if (input.activeOnly) {
    return branchesRepository.getActiveBranchesByCompany(input.companyId);
  }

  return branchesRepository.getBranchesByCompany(input.companyId);
}

