import { generateIdFromEntropySize } from 'lucia';
import { getBranchesRepository, getCompaniesRepository } from '@/src/service-locator';
import type { Branch } from '@/src/modules/branch/branch.model';
import { InputParseError, NotFoundError } from '@/src/modules/shared/errors/common';
import { validateCompanyAccess } from '@/src/modules/shared/helpers/access-control';

export async function createBranchUseCase(input: {
  companyId: string;
  name: string;
  location?: string;
  timezone?: string;
  sessionId: string;
}): Promise<Branch> {
  // Validate company access (requires at least MANAGER role)
  await validateCompanyAccess(input.sessionId, input.companyId, 'MANAGER');

  // Validate input
  if (input.name.length < 1 || input.name.length > 100) {
    throw new InputParseError('Branch name must be between 1 and 100 characters');
  }

  // Verify company exists
  const companiesRepository = getCompaniesRepository();
  const company = await companiesRepository.getCompany(input.companyId);
  if (!company) {
    throw new NotFoundError('Company not found');
  }

  // Generate slug from branch name
  const slug = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Check if slug is already taken for this company
  const branchesRepository = getBranchesRepository();
  const existingBranch = await branchesRepository.getBranchBySlugAndCompany(
    slug,
    input.companyId
  );
  if (existingBranch) {
    throw new InputParseError('A branch with this name already exists');
  }

  // Create branch
  const branchId = generateIdFromEntropySize(10);
  const branch = await branchesRepository.createBranch({
    id: branchId,
    companyId: input.companyId,
    name: input.name,
    location: input.location,
    slug: `${slug}-${branchId.slice(0, 6)}`, // Add unique suffix
    timezone: input.timezone || 'UTC',
    active: true,
  });

  return branch;
}

