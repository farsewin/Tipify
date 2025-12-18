import { getCompaniesRepository } from '@/src/service-locator';
import type { Company, UpdateCompany } from '@/src/modules/company/company.model';
import { NotFoundError } from '@/src/modules/shared/errors/common';
import { validateCompanyAccess } from '@/src/modules/shared/helpers/access-control';

export async function updateCompanyUseCase(input: {
  companyId: string;
  updates: UpdateCompany;
  sessionId: string;
}): Promise<Company> {
  // Validate company access (requires ADMIN role)
  await validateCompanyAccess(input.sessionId, input.companyId, 'ADMIN');

  const companiesRepository = getCompaniesRepository();
  const company = await companiesRepository.getCompany(input.companyId);

  if (!company) {
    throw new NotFoundError('Company not found');
  }

  const updated = await companiesRepository.updateCompany(input.companyId, input.updates);

  return updated;
}







